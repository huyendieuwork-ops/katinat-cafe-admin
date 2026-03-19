"use client";

import { useEffect, useState } from "react";
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

type OrderStatus = "ordering" | "preparing" | "served" | "paid" | "cancelled";

type OrderItem = {
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

export default function OrdersPage() {
  const { currentUser } = useCafeStore();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
        <h2 className="text-xl font-bold text-slate-800">Quản lý đơn hàng</h2>
        <p className="mt-1 text-sm text-slate-500">
          Khi đơn được thanh toán thì doanh thu mới được tính vào Dashboard và bàn tự về trống.
        </p>

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
                  <th className="rounded-r-2xl px-4 py-3">Cập nhật</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
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
                  </tr>
                ))}

                {orders.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                      Chưa có đơn hàng nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}