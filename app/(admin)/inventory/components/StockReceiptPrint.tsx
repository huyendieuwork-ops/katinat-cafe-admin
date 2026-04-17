import React, { forwardRef } from "react";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface StockReceiptPrintProps {
  receipts: any[];
}

const StockReceiptPrint = forwardRef<HTMLDivElement, StockReceiptPrintProps>(
  ({ receipts }, ref) => {
    if (!receipts || receipts.length === 0) return null;

    return (
      <>
        <style media="print">{`
          @page { size: A4; margin: 15mm; }
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
          }
          .print-page {
            page-break-after: always;
            width: 100%;
          }
          .print-page:last-child {
            page-break-after: auto;
          }
        `}</style>
        <div ref={ref} className="print-only hidden print:block bg-white text-black font-sans text-sm leading-snug">
          {receipts.map((receipt, idx) => (
            <div key={receipt.receipt_group_code || idx} className="print-page pb-8">
              {/* Header */}
              <div className="flex justify-between items-start mb-6 border-b border-gray-400 pb-4">
                <div>
                  <h1 className="text-2xl font-bold uppercase mb-1">KATINAT</h1>
                  <p className="text-sm font-semibold">Quản lý Kho Hiện Đại</p>
                  <p className="text-xs text-gray-600 mt-1">Hệ thống quản lý chuỗi Katinat Cafe</p>
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-bold uppercase">Phiếu Nhập Kho</h2>
                  <p className="text-sm font-semibold mt-1">Mã: {receipt.receipt_group_code}</p>
                  <p className="text-xs mt-1">Ngày lập: {formatDateTime(receipt.created_at)}</p>
                </div>
              </div>

              {/* Info */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                  <p><span className="font-semibold w-24 inline-block">Nhà cung cấp:</span> {receipt.supplier_name || "-"}</p>
                  <p className="mt-1"><span className="font-semibold w-24 inline-block">Mã KH/NCC:</span> {receipt.supplier_id || "-"}</p>
                </div>
                <div>
                  <p><span className="font-semibold w-24 inline-block">Người nhận:</span> {receipt.received_by || "Admin"}</p>
                  <p className="mt-1"><span className="font-semibold w-24 inline-block">Ghi chú:</span> {receipt.note || "-"}</p>
                </div>
              </div>

              {/* Table */}
              <table className="w-full text-sm border-collapse border border-gray-400 mb-6">
                <thead>
                  <tr className="bg-gray-100 italic">
                    <th className="border border-gray-400 py-2 px-3 text-center w-12">STT</th>
                    <th className="border border-gray-400 py-2 px-3 text-left">Tên nguyên vật liệu</th>
                    <th className="border border-gray-400 py-2 px-3 text-right">Số lượng</th>
                    <th className="border border-gray-400 py-2 px-3 text-right">Đơn giá</th>
                    <th className="border border-gray-400 py-2 px-3 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {receipt.lines.map((line: any, index: number) => (
                    <tr key={index}>
                      <td className="border border-gray-400 py-2 px-3 text-center">{index + 1}</td>
                      <td className="border border-gray-400 py-2 px-3">{line.ingredient_name}</td>
                      <td className="border border-gray-400 py-2 px-3 text-right font-medium">{line.quantity_added}</td>
                      <td className="border border-gray-400 py-2 px-3 text-right">{formatCurrency(line.unit_cost)}</td>
                      <td className="border border-gray-400 py-2 px-3 text-right font-medium">{formatCurrency(line.total_cost)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={2} className="border border-gray-400 py-2 px-3 text-right font-bold uppercase">Tổng cộng ({receipt.total_items} khoản mục)</td>
                    <td className="border border-gray-400 py-2 px-3 text-right font-bold">
                      {receipt.lines.reduce((acc: number, line: any) => acc + Number(line.quantity_added || 0), 0)}
                    </td>
                    <td className="border border-gray-400 py-2 px-3"></td>
                    <td className="border border-gray-400 py-2 px-3 text-right font-bold text-base">{formatCurrency(receipt.total_amount)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Signatures */}
              <div className="flex justify-between mt-12 px-8 text-center">
                <div>
                  <p className="font-semibold mb-16">Người lập phiếu</p>
                  <p className="italic text-gray-600 text-xs">(Ký, ghi rõ họ tên)</p>
                  <p className="font-semibold mt-4">{receipt.received_by || "Admin"}</p>
                </div>
                <div>
                  <p className="font-semibold mb-16">Người giao hàng</p>
                  <p className="italic text-gray-600 text-xs">(Ký, ghi rõ họ tên)</p>
                </div>
                <div>
                  <p className="font-semibold mb-16">Thủ kho</p>
                  <p className="italic text-gray-600 text-xs">(Ký, ghi rõ họ tên)</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }
);

StockReceiptPrint.displayName = "StockReceiptPrint";

export default StockReceiptPrint;
