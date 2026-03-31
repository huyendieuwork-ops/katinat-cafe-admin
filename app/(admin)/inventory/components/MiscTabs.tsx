"use client";

import { useInventory } from "./InventoryContext";
import { formatDateTime } from "@/lib/utils";
import { ScrollText, LogOut, Download, AlertTriangle } from "lucide-react";

export function InventoryLogsTab() {
  const { inventoryLogs } = useInventory();

  return (
    <div className="space-y-6">
      <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><ScrollText /> Nhật ký Kho (Log)</h2>
        <p className="mt-1 text-sm text-slate-500">Mọi hành động tăng giảm trên kho đều được ghi nhận tự động vào bảng này để đối soát.</p>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-[#eff4ef] text-left text-sm text-slate-700">
                <th className="rounded-l-2xl px-4 py-3">Nguyên liệu</th>
                <th className="px-4 py-3 text-center">Tồn trước</th>
                <th className="px-4 py-3 text-center">Thay đổi</th>
                <th className="px-4 py-3 text-center">Tồn sau</th>
                <th className="px-4 py-3 w-1/3">Ghi chú</th>
                <th className="px-4 py-3">Người thực hiện</th>
                <th className="rounded-r-2xl px-4 py-3">Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {inventoryLogs.length === 0 && (
                <tr><td colSpan={7} className="py-6 text-center text-slate-500">Chưa có bản ghi hoạt động kho</td></tr>
              )}
              {inventoryLogs.map((log) => {
                const isIncrease = log.difference > 0;
                const isDecrease = log.difference < 0;
                return (
                  <tr key={log.id} className="border-b border-[#edf1ec] text-sm">
                    <td className="px-4 py-3 font-semibold text-slate-800">{log.ingredient_name}</td>
                    <td className="px-4 py-3 text-center text-slate-500">{log.previous_quantity}</td>
                    <td className={`px-4 py-3 text-center font-bold ${isIncrease ? "text-emerald-600" : isDecrease ? "text-red-500" : "text-slate-400"}`}>
                      {isIncrease ? `+${log.difference}` : log.difference}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-700">{log.new_quantity}</td>
                    <td className="px-4 py-3 text-xs italic text-slate-600">{log.note}</td>
                    <td className="px-4 py-3">{log.updated_by}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{formatDateTime(log.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function OverviewTab() {
  const { ingredients, stockReceipts } = useInventory();

  // Tính toán cảnh báo
  const lowWarning = ingredients.filter(i => i.quantity <= i.min_stock && i.quantity > 0);
  const outOfStock = ingredients.filter(i => i.quantity <= 0);

  const importTimes = new Set(stockReceipts.map(r => r.receipt_group_code)).size;
  const topImported = [...ingredients].sort((a,b) => b.quantity - a.quantity).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-[24px] border-2 border-red-200 bg-red-50 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-red-600 flex items-center gap-2"><LogOut /> Hết hàng (Out of stock)</h2>
          <div className="mt-4 space-y-3">
            {outOfStock.length === 0 ? <p className="text-sm text-slate-500">Không có nguyên liệu nào hết hàng.</p> : null}
            {outOfStock.map(i => (
              <div key={i.id} className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm">
                <span className="font-semibold">{i.name}</span>
                <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">CẦN NHẬP GẤP</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border-2 border-amber-200 bg-amber-50 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-amber-600 flex items-center gap-2"><AlertTriangle /> Dưới định mức (Low stock)</h2>
          <div className="mt-4 space-y-3">
            {lowWarning.length === 0 ? <p className="text-sm text-slate-500">Mọi nguyên liệu đều đang ở mức an toàn.</p> : null}
            {lowWarning.map(i => (
              <div key={i.id} className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm">
                <span className="font-semibold">{i.name}</span>
                <span className="text-sm text-amber-700">Tồn: {i.quantity} (Min: {i.min_stock})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Download /> Tình hình nhập kho</h2>
        <p className="text-slate-500 mt-2 mb-4">Tổng số phiếu nhập đã ghi nhận: <b className="text-slate-800">{importTimes}</b> phiếu</p>
        
        <h3 className="font-bold text-slate-700 mt-6 mb-3">Top 5 nguyên liệu tồn nhiều nhất</h3>
        <div className="space-y-2">
          {topImported.map(item => (
            <div key={item.id} className="flex items-center justify-between border-b border-[#edf1ec] pb-2 last:border-0 text-sm">
              <span className="font-medium text-slate-700">{item.name}</span>
              <span className="text-emerald-700 font-bold">{item.quantity} {item.unit}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
