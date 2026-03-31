"use client";

import { useMemo } from "react";
import { useInventory } from "./InventoryContext";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { FileText, Printer } from "lucide-react";

export default function ReportsTab() {
  const { ingredients, stockReceipts, stockExports, inventoryChecks, paymentDocuments } = useInventory();

  // 1. Tồn Kho Tổng Hợp
  const reportRows = useMemo(() => {
    return ingredients.map((item) => {
      const receipts = stockReceipts.filter((r) => r.ingredient_id === item.id);
      const exportsList = stockExports.filter((e) => e.ingredient_id === item.id);
      
      const totalQtyImported = receipts.reduce((sum, r) => sum + Number(r.quantity_added || 0), 0);
      const totalQtyExported = exportsList.reduce((sum, e) => sum + Number(e.quantity_exported || 0), 0);
      
      const val = Number(item.quantity || 0) * Number(item.cost || 0);

      return {
        ...item,
        totalQtyImported,
        totalQtyExported,
        inventoryValue: val,
      };
    });
  }, [ingredients, stockReceipts, stockExports]);

  const totalInventoryValue = reportRows.reduce((a, b) => a + b.inventoryValue, 0);

  // 2. Báo Cáo Công Nợ NCC (Simplified)
  const debtReport = useMemo(() => {
    return paymentDocuments.filter(p => p.payment_method === 'debt');
  }, [paymentDocuments]);

  // Handle Print Action (Tái sử dụng logic cũ nhưng cải thiện style và UX)
  const printReport = () => {
    const printWindow = window.open("", "_blank", "width=1200,height=800");
    if (!printWindow) return;

    const rowsHtml = reportRows
      .map(
        (item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${item.name}</td>
            <td>${item.quantity} ${item.unit}</td>
            <td>${formatCurrency(item.cost)}</td>
            <td>${formatCurrency(item.inventoryValue)}</td>
            <td>${item.totalQtyImported}</td>
            <td>${item.totalQtyExported}</td>
          </tr>
        `
      ).join("");

    const debtHtml = debtReport
      .map(
        (item, idx) => `
          <tr>
            <td>${item.payment_code}</td>
            <td>${item.supplier_name}</td>
            <td>${formatCurrency(item.amount)}</td>
            <td>${formatDateTime(item.payment_date)}</td>
          </tr>
        `
      ).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Báo Cáo Tồn Kho & Công Nợ</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #1f2937; line-height: 1.5; }
            .wrap { max-width: 1200px; margin: 0 auto; }
            h1 { margin-bottom: 8px; color: #3d5643; }
            h2 { margin-top: 32px; font-size: 18px; color: #4e6b53; border-bottom: 2px solid #d7e2d5; padding-bottom: 6px; }
            .muted { color: #64748b; margin-bottom: 20px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 14px; }
            th, td { border: 1px solid #d7e2d5; padding: 10px 12px; text-align: left; }
            th { background: #eef4ee; font-weight: bold; color: #3d5643; }
            tr:nth-child(even) { background-color: #f8fbf7; }
            .footer-total { margin-top: 20px; text-align: right; font-size: 20px; font-weight: bold; color: #b91c1c; }
            .date-print { text-align: right; font-size: 12px; font-style: italic; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="wrap">
            <div class="date-print">Ngày in: ${new Date().toLocaleString('vi-VN')}</div>
            <h1>BÁO CÁO NHẬP XUẤT TỒN & GIÁ VỐN KHO</h1>
            
            <h2>1. Thống kê nhập xuất tồn từng nguyên vật liệu</h2>
            <table>
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Nguyên liệu</th>
                  <th>Tồn hệ thống</th>
                  <th>Giá vốn TB</th>
                  <th>Giá trị tồn kho</th>
                  <th>Tổng nhập lũy kế</th>
                  <th>Tổng xuất lũy kế</th>
                </tr>
              </thead>
              <tbody>${rowsHtml || "<tr><td colspan='7' style='text-align:center;'>Không có dữ liệu</td></tr>"}</tbody>
            </table>
            <div class="footer-total">Tổng giá trị tồn kho: ${formatCurrency(totalInventoryValue)}</div>

            <h2>2. Thống kê Công nợ Nhà cung cấp (Chưa tất toán)</h2>
            <table>
              <thead>
                <tr>
                  <th>Mã thanh toán</th>
                  <th>Nhà cung cấp</th>
                  <th>Số tiền nợ</th>
                  <th>Ngày phát sinh</th>
                </tr>
              </thead>
              <tbody>${debtHtml || "<tr><td colspan='4' style='text-align:center;'>Không có công nợ</td></tr>"}</tbody>
            </table>

            <h2>3. Thống kê sai lệch kiểm kê gần đây</h2>
            <p class="muted">Ghi nhận ${inventoryChecks.length} phiếu điều chỉnh tồn kho.</p>
          </div>
          <script>window.onload = function(){ window.print(); }</script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-8 px-10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-[#3d5643] flex items-center gap-2"><FileText /> Trung tâm Báo cáo Kho</h2>
          <p className="text-slate-500 mt-2 max-w-xl leading-relaxed">
            Xem báo cáo tổng hợp để nắm rõ dòng di chuyển của dòng tiền nhập hàng và sự luân chuyển của nguyên vật liệu. 
            Bạn có thể in hoặc xuất ra PDF để nộp cho kế toán.
          </p>
        </div>
        <button onClick={printReport} className="inline-flex shrink-0 items-center justify-center gap-3 rounded-2xl bg-amber-600 px-6 py-4 font-bold text-white shadow-lg shadow-amber-600/20 hover:bg-amber-700 transition transform hover:-translate-y-1">
          <Printer size={20} />
          In Báo Cáo / Trích xuất PDF
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr]">
        <div className="rounded-[24px] border border-[#d7e2d5] bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#d7e2d5] bg-[#f8fbf7] flex items-center justify-between">
            <h3 className="font-bold text-slate-800">1. Báo cáo Xuất Nhập Tồn & Giá vốn</h3>
            <span className="font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full text-sm">
              Tổng vốn lưu động: {formatCurrency(totalInventoryValue)}
            </span>
          </div>
          <div className="overflow-x-auto p-4">
            <table className="min-w-full">
              <thead>
                <tr className="border-b-2 border-[#d7e2d5] text-left text-sm text-slate-700">
                  <th className="px-4 py-3">Nguyên liệu</th>
                  <th className="px-4 py-3 text-right">Tồn LK</th>
                  <th className="px-4 py-3 text-right">Giá vốn GQ</th>
                  <th className="px-4 py-3 text-right">Thành tiền tồn</th>
                  <th className="px-4 py-3 text-center">Đã nhập</th>
                  <th className="px-4 py-3 text-center">Đã xuất</th>
                </tr>
              </thead>
              <tbody>
                {reportRows.map((item) => (
                  <tr key={item.id} className="border-b border-[#edf1ec] text-sm hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-800">{item.name}</td>
                    <td className="px-4 py-3 text-right font-bold text-[#3d5643]">{item.quantity} {item.unit}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(item.cost)}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-700">{formatCurrency(item.inventoryValue)}</td>
                    <td className="px-4 py-3 text-center text-emerald-600 font-semibold">+{item.totalQtyImported}</td>
                    <td className="px-4 py-3 text-center text-red-500 font-semibold">-{item.totalQtyExported}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
