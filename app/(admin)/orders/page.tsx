"use client";

import { useEffect, useMemo, useState } from "react";
import { Filter, Eye } from "lucide-react";
import { useCafeStore } from "@/lib/store";
import {
  getOrders,
  getProducts,
  updateCafeTableInSupabase,
  updateOrderInSupabase,
  updateProductStockInSupabase,
  upsertCustomerAfterPayment,
} from "@/lib/db";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import OrderDetailModal from "./components/OrderDetailModal";
import OrderInvoicePrint from "./components/OrderInvoicePrint";

type OrderStatus = "ordering" | "preparing" | "served" | "paid" | "cancelled";
type ShiftType = "all" | "morning" | "afternoon" | "evening";
type DatePreset = "all" | "today" | "7days" | "30days";

export type OrderItem = {
  id: string;
  customer_name: string;
  customer_phone: string;
  is_student: boolean;
  university: string;
  voucher_name: string;
  discount_rate: number;
  subtotal: number;
  discount: number;
  final_total: number;
  items: {
    id: string;
    name: string;
    category: string;
    price: number;
    quantity: number;
    size?: string;
    topping?: string;
    note?: string;
  }[];
  created_at: string;
  created_by: string;
  order_type: "dine-in" | "takeaway";
  floor: number | null;
  table_id: string | null;
  table_code: string | null;
  status: OrderStatus;
  paid_at: string | null;
};

const statusOptions: { value: OrderStatus; label: string }[] = [
  { value: "ordering", label: "Đang order" },
  { value: "preparing", label: "Đang chuẩn bị" },
  { value: "served", label: "Đã giao khách" },
  { value: "paid", label: "Đã thanh toán" },
  { value: "cancelled", label: "Đã hủy" },
];

function getStatusLabel(status: OrderStatus) {
  return statusOptions.find((item) => item.value === status)?.label || status;
}

function getDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function matchDatePreset(dateString: string, preset: DatePreset) {
  if (preset === "all") return true;

  const target = new Date(dateString);
  const now = new Date();

  if (preset === "today") {
    return getDateInputValue(target) === getDateInputValue(now);
  }

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (preset === "7days" ? 6 : 29));

  return target >= start;
}

function matchShift(dateString: string, shift: ShiftType) {
  if (shift === "all") return true;

  const hour = new Date(dateString).getHours();

  if (shift === "morning") return hour >= 5 && hour < 12;
  if (shift === "afternoon") return hour >= 12 && hour < 18;
  return hour >= 18 || hour < 5;
}

export default function OrdersPage() {
  const { currentUser } = useCafeStore();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [exactDate, setExactDate] = useState("");
  const [shift, setShift] = useState<ShiftType>("all");

  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);

  const handlePrint = () => {
    window.print();
  };

  async function loadOrders(showAlert = false) {
    try {
      setLoading(true);
      const data = await getOrders();
      setOrders((data || []) as OrderItem[]);
    } catch (error) {
      console.error("Lỗi tải đơn hàng:", error);
      if (showAlert) {
        const message =
          error instanceof Error ? error.message : JSON.stringify(error);
        alert(`Lỗi tải đơn hàng: ${message}`);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders(true);
  }, []);

  async function changeOrderStatus(order: OrderItem, status: OrderStatus) {
    try {
      setUpdatingId(order.id);

      if (status === order.status) return;

      if (status === "paid") {
        const paidAt = new Date().toISOString();

        await updateOrderInSupabase(order.id, {
          status: "paid",
          paid_at: paidAt,
        });

        if (order.table_id) {
          await updateCafeTableInSupabase(order.table_id, {
            status: "available",
            current_order_id: null,
            current_customer_name: null,
            occupied_at: null,
          });
        }

        if (order.customer_phone?.trim()) {
          await upsertCustomerAfterPayment({
            customerName: order.customer_name,
            customerPhone: order.customer_phone,
            finalTotal: order.final_total,
            orderType: order.order_type,
            paidAt,
          });
        }

        await loadOrders();
        alert("Đã cập nhật đơn sang trạng thái thanh toán.");
        return;
      }

      if (status === "cancelled") {
        const products = await getProducts();

        for (const item of order.items) {
          const product = (products || []).find((p: any) => p.id === item.id);
          if (!product) continue;
          await updateProductStockInSupabase(
            item.id,
            Number(product.stock || 0) + Number(item.quantity || 0)
          );
        }

        await updateOrderInSupabase(order.id, {
          status: "cancelled",
          paid_at: null,
        });

        if (order.table_id) {
          await updateCafeTableInSupabase(order.table_id, {
            status: "available",
            current_order_id: null,
            current_customer_name: null,
            occupied_at: null,
          });
        }

        await loadOrders();
        alert("Đã hủy đơn, hoàn tồn kho và trả bàn về trống.");
        return;
      }

      await updateOrderInSupabase(order.id, {
        status,
      });

      await loadOrders();
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái đơn:", error);
      const message =
        error instanceof Error ? error.message : JSON.stringify(error);
      alert(`Có lỗi khi cập nhật đơn hàng: ${message}`);
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const okPreset = matchDatePreset(order.created_at, datePreset);
      const okShift = matchShift(order.created_at, shift);
      const okExact = exactDate
        ? getDateInputValue(new Date(order.created_at)) === exactDate
        : true;

      return okPreset && okShift && okExact;
    });
  }, [orders, datePreset, exactDate, shift]);

  if (currentUser?.role !== "admin" && currentUser?.role !== "staff") {
    return (
      <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-6 shadow-sm">
        Bạn không có quyền truy cập đơn hàng.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Quản lý đơn hàng</h2>
            <p className="mt-1 text-sm text-slate-500">
              Lọc theo ngày và theo ca để quản lý đơn hàng theo từng khung giờ vận hành.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Khoảng ngày
              </label>
              <div className="relative">
                <Filter
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <select
                  className="w-full rounded-2xl border border-[#d7e2d5] py-3 pl-10 pr-4 outline-none"
                  value={datePreset}
                  onChange={(e) => setDatePreset(e.target.value as DatePreset)}
                >
                  <option value="all">Tất cả</option>
                  <option value="today">Hôm nay</option>
                  <option value="7days">7 ngày gần đây</option>
                  <option value="30days">30 ngày gần đây</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Ngày cụ thể
              </label>
              <input
                type="date"
                className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none"
                value={exactDate}
                onChange={(e) => setExactDate(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Ca làm
              </label>
              <select
                className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none"
                value={shift}
                onChange={(e) => setShift(e.target.value as ShiftType)}
              >
                <option value="all">Tất cả ca</option>
                <option value="morning">Ca sáng</option>
                <option value="afternoon">Ca chiều</option>
                <option value="evening">Ca tối</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setDatePreset("all");
                  setExactDate("");
                  setShift("all");
                }}
                className="w-full rounded-2xl border border-[#d7e2d5] bg-[#eef3ee] px-4 py-3 font-semibold text-slate-700"
              >
                Reset lọc
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="mt-4 rounded-2xl border border-dashed border-[#d7e2d5] p-6 text-slate-500">
            Đang tải đơn hàng từ Supabase...
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-[#eff4ef] text-left text-sm text-slate-700">
                  <th className="rounded-l-2xl px-4 py-3">Mã đơn</th>
                  <th className="px-4 py-3">Khách hàng</th>
                  <th className="px-4 py-3">Thời gian tạo</th>
                  <th className="px-4 py-3">Hình thức</th>
                  <th className="px-4 py-3">Bàn</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Tổng tiền</th>
                  <th className="px-4 py-3">Cập nhật</th>
                  <th className="rounded-r-2xl px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-[#edf1ec] text-sm">
                    <td className="px-4 py-3">{order.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{order.customer_name}</div>
                      <div className="text-slate-500">
                        {order.customer_phone || "Khách không để lại SĐT"}
                      </div>
                    </td>
                    <td className="px-4 py-3">{formatDateTime(order.created_at)}</td>
                    <td className="px-4 py-3">
                      {order.order_type === "dine-in" ? "Ở lại" : "Mang về"}
                    </td>
                    <td className="px-4 py-3">
                      {order.order_type === "dine-in"
                        ? `${order.table_code || "-"} / Tầng ${order.floor || "-"}`
                        : "-"}
                    </td>
                    <td className="px-4 py-3">{getStatusLabel(order.status)}</td>
                    <td className="px-4 py-3">{formatCurrency(order.final_total)}</td>
                    <td className="px-4 py-3">
                      <select
                        className="rounded-xl border border-[#d7e2d5] px-3 py-2 outline-none"
                        value={order.status}
                        disabled={updatingId === order.id}
                        onChange={(e) =>
                          changeOrderStatus(order, e.target.value as OrderStatus)
                        }
                      >
                        {statusOptions.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="inline-flex items-center justify-center rounded-xl bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 hover:text-slate-800 transition-colors"
                        title="Xem chi tiết"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-6 text-center text-slate-500">
                      Không có đơn hàng nào theo bộ lọc hiện tại.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <OrderDetailModal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
        onPrint={handlePrint}
      />

      <OrderInvoicePrint order={selectedOrder} />
    </div>
  );
}