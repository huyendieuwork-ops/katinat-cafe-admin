import React, { forwardRef } from "react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { OrderItem } from "../page";

interface OrderInvoicePrintProps {
  order: OrderItem | null;
}

const OrderInvoicePrint = forwardRef<HTMLDivElement, OrderInvoicePrintProps>(
  ({ order }, ref) => {
    if (!order) return null;

    return (
      <>
        <style media="print">{`
          @page { size: auto; margin: 0mm; }
          body * {
            visibility: hidden;
          }
          .print-only, .print-only * {
            visibility: visible;
          }
          .print-only {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: flex;
            justify-content: center;
          }
        `}</style>
        <div 
          ref={ref} 
          className="print-only hidden print:flex"
        >
        <div className="w-[80mm] bg-white p-4 text-black font-sans mx-auto text-sm leading-snug">
          {/* Header */}
          <div className="text-center mb-4 border-b border-dashed border-gray-400 pb-3">
            <h1 className="text-2xl font-bold mb-1">KATINAT</h1>
            <p className="text-xs text-gray-600">HỘI THOẠI CỦA NHỮNG VỊ TRÀ</p>
            <p className="text-xs text-gray-600">Đ/c: 123 Đường ABC, Quận XYZ, TP.HCM</p>
            <p className="text-xs text-gray-600">Hotline: 1900 123 456</p>
          </div>

          <div className="text-center mb-4">
            <h2 className="text-lg font-bold">HÓA ĐƠN THANH TOÁN</h2>
          </div>

          {/* Order Info */}
          <div className="mb-3 space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Mã đơn:</span>
              <span className="font-semibold">{order.id}</span>
            </div>
            <div className="flex justify-between">
              <span>Ngày giờ:</span>
              <span>{formatDateTime(order.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span>Thu ngân:</span>
              <span>{order.created_by || "Admin"}</span>
            </div>
            <div className="flex justify-between">
              <span>Khách hàng:</span>
              <span>{order.customer_name}</span>
            </div>
            {order.customer_phone && (
              <div className="flex justify-between">
                <span>SĐT:</span>
                <span>{order.customer_phone}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Phục vụ:</span>
              <span>{order.order_type === "dine-in" ? "Ở lại" : "Mang về"}</span>
            </div>
            {order.order_type === "dine-in" && order.table_code && (
              <div className="flex justify-between">
                <span>Bàn:</span>
                <span>{order.table_code} (Tầng {order.floor})</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="border-t border-b border-dashed border-gray-400 py-2 mb-3">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left pb-1 font-semibold">Tên Món</th>
                  <th className="text-center pb-1 font-semibold w-8">SL</th>
                  <th className="text-right pb-1 font-semibold">T.Tiền</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, index) => (
                  <tr key={index} className="align-top">
                    <td className="py-2 pr-1">
                      <div className="font-medium">{item.name}</div>
                      {(item.size || item.topping || item.note) && (
                        <div className="text-[10px] text-gray-500 mt-0.5 space-y-0.5 pl-1">
                          {item.size && <div>+ Size: {item.size}</div>}
                          {item.topping && <div>+ Topping: {item.topping}</div>}
                          {item.note && <div>* Ghi chú: {item.note}</div>}
                        </div>
                      )}
                    </td>
                    <td className="py-2 text-center">{item.quantity}</td>
                    <td className="py-2 text-right">
                      {formatCurrency(item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="space-y-1 text-xs border-b border-dashed border-gray-400 pb-3 mb-3">
            <div className="flex justify-between">
              <span>Tạm tính:</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between">
                <span>Giảm giá ({order.voucher_name}):</span>
                <span>- {formatCurrency(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm mt-1 pt-1 border-t border-gray-200">
              <span>TỔNG CỘNG:</span>
              <span>{formatCurrency(order.final_total)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Trạng thái:</span>
              <span>{order.status === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-600 space-y-1">
            <p className="font-medium">Cảm ơn & Hẹn gặp lại quý khách!</p>
            <p>Pass wifi: katinat2024</p>
          </div>
        </div>
      </div>
      </>
    );
  }
);

OrderInvoicePrint.displayName = "OrderInvoicePrint";

export default OrderInvoicePrint;
