"use client";

import { useCafeStore } from "@/lib/store";
import { OrderStatus } from "@/lib/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";

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
  const { data, updateOrderStatus } = useCafeStore();

  return (
    <div className="space-y-5">
      <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800">Quản lý đơn hàng</h2>
        <p className="mt-1 text-sm text-slate-500">
          Khi tạo đơn, tồn kho sản phẩm bị trừ ngay để giữ hàng. Chỉ khi đơn chuyển sang “Đã thanh toán” thì mới cộng doanh thu.
          Nếu đơn bị hủy, tồn kho sẽ được hoàn lại và bàn tự động về trống.
        </p>

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
              {data.orders.map((order) => (
                <tr key={order.id} className="border-b border-[#edf1ec] text-sm">
                  <td className="px-4 py-3">{order.id}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{order.customerName}</div>
                    <div className="text-slate-500">{order.customerPhone}</div>
                  </td>
                  <td className="px-4 py-3">{formatDateTime(order.createdAt)}</td>
                  <td className="px-4 py-3">
                    {order.orderType === "dine-in" ? "Ở lại" : "Mang về"}
                  </td>
                  <td className="px-4 py-3">
                    {order.orderType === "dine-in"
                      ? `${order.tableCode || "-"} / Tầng ${order.floor || "-"}`
                      : "-"}
                  </td>
                  <td className="px-4 py-3">{getStatusLabel(order.status)}</td>
                  <td className="px-4 py-3">{formatCurrency(order.finalTotal)}</td>
                  <td className="px-4 py-3">
                    <select
                      className="rounded-xl border border-[#d7e2d5] px-3 py-2 outline-none"
                      value={order.status}
                      onChange={(e) =>
                        updateOrderStatus(order.id, e.target.value as OrderStatus)
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

              {data.orders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                    Chưa có đơn hàng nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}