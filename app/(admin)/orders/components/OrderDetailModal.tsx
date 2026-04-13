import React from "react";
import { X, Printer } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { OrderItem } from "../page";

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderItem | null;
  onPrint: () => void;
}

export default function OrderDetailModal({ isOpen, onClose, order, onPrint }: OrderDetailModalProps) {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#edf1ec] px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Chi tiết đơn hàng</h2>
            <p className="text-sm text-slate-500">Mã đơn: {order.id}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 text-sm">
          {/* Order Info Grid */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-[#d7e2d5] bg-[#f8fbf7] p-4 text-slate-700">
              <span className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wider">Khách hàng</span>
              <div className="font-semibold">{order.customer_name}</div>
              <div>{order.customer_phone || "Không có SĐT"}</div>
            </div>
            
            <div className="rounded-2xl border border-[#d7e2d5] bg-[#f8fbf7] p-4 text-slate-700">
              <span className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wider">Thời gian</span>
              <div className="font-medium">{formatDateTime(order.created_at)}</div>
              <div>Tạo bởi: {order.created_by || "Admin"}</div>
            </div>

            <div className="rounded-2xl border border-[#d7e2d5] bg-[#f8fbf7] p-4 text-slate-700">
              <span className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái</span>
              <div className="font-medium">
                {order.status === "paid" ? (
                  <span className="text-[#3d5643] font-semibold">Đã thanh toán</span>
                ) : order.status === "cancelled" ? (
                  <span className="text-red-500 font-semibold">Đã hủy</span>
                ) : (
                  <span className="text-amber-600 font-semibold">Chưa thanh toán</span>
                )}
              </div>
              <div>
                Phục vụ: {order.order_type === "dine-in" ? "Ở lại" : "Mang về"}
                {order.order_type === "dine-in" && order.table_code && ` (Bàn ${order.table_code} - Tầng ${order.floor})`}
              </div>
            </div>
          </div>

          <h3 className="mb-3 text-lg font-bold text-slate-800">Danh sách sản phẩm</h3>
          
          <div className="overflow-hidden rounded-2xl border border-[#d7e2d5]">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-[#eff4ef] text-left text-sm text-slate-700">
                  <th className="px-4 py-3 font-semibold">Sản phẩm</th>
                  <th className="px-4 py-3 font-semibold text-center">Số lượng</th>
                  <th className="px-4 py-3 font-semibold text-right">Đơn giá</th>
                  <th className="px-4 py-3 font-semibold text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf1ec] bg-white">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{item.name}</div>
                        {(item.size || item.topping || item.note) && (
                          <div className="mt-1 flex flex-col gap-0.5 text-xs text-slate-500">
                            {item.size && <span>• Size: {item.size}</span>}
                            {item.topping && <span>• Topping: {item.topping}</span>}
                            {item.note && <span className="italic">• Ghi chú: {item.note}</span>}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-medium">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(item.price)}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-800">
                        {formatCurrency(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500 italic">
                      Chưa có sản phẩm trong đơn hàng này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-sm rounded-2xl border border-[#d7e2d5] bg-[#f8fbf7] p-5">
              <div className="space-y-3">
                <div className="flex justify-between text-slate-600">
                  <span>Tạm tính</span>
                  <span className="font-medium">{formatCurrency(order.subtotal)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá ({order.voucher_name})</span>
                    <span className="font-medium">- {formatCurrency(order.discount)}</span>
                  </div>
                )}
                <div className="my-2 border-t border-dashed border-[#d7e2d5]"></div>
                <div className="flex justify-between text-lg font-bold text-slate-800">
                  <span>Tổng thanh toán</span>
                  <span className="text-[#3d5643]">{formatCurrency(order.final_total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[#edf1ec] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-2xl border border-[#d7e2d5] bg-white px-5 py-2.5 font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Đóng
          </button>
          <button
            onClick={onPrint}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#4e6b53] px-5 py-2.5 font-semibold text-white hover:bg-[#3f5845] transition-colors shadow-sm"
          >
            <Printer size={18} />
            In hóa đơn
          </button>
        </div>
      </div>
    </div>
  );
}
