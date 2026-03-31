"use client";

import { useState } from "react";
import { ArrowUpRight, Plus, X } from "lucide-react";
import { useInventory } from "./InventoryContext";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  addStockExportToSupabase,
  updateIngredientInSupabase,
  addInventoryLogToSupabase,
} from "@/lib/db";

type ExportLine = {
  lineId: string;
  ingredientId: string;
  quantity: string;
  reason: string;
};

const createEmptyExportLine = (): ExportLine => ({
  lineId: `export-line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  ingredientId: "",
  quantity: "",
  reason: "Sử dụng nội bộ",
});

export default function StockExportsTab() {
  const { ingredients, stockExports, loadInventory, currentUser } = useInventory();
  
  const [exportLines, setExportLines] = useState<ExportLine[]>([createEmptyExportLine()]);
  const [exportNote, setExportNote] = useState("");
  const [submittingExport, setSubmittingExport] = useState(false);

  const updateExportLine = (lineId: string, field: keyof ExportLine, value: string) => {
    setExportLines((prev) =>
      prev.map((line) => (line.lineId === lineId ? { ...line, [field]: value } : line))
    );
  };

  const addExportLine = () => setExportLines((prev) => [...prev, createEmptyExportLine()]);
  const removeExportLine = (lineId: string) => {
    setExportLines((prev) => (prev.length === 1 ? prev : prev.filter((line) => line.lineId !== lineId)));
  };

  const submitExport = async (e: React.FormEvent) => {
    e.preventDefault();

    const validLines = exportLines.filter(
      (line) => line.ingredientId && Number(line.quantity) > 0
    );

    if (validLines.length === 0) {
      alert("Vui lòng cấu hình ít nhất 1 nguyên vật liệu để xuất kho hợp lệ.");
      return;
    }

    // Strict Mode validation: Không cho xuất quá tồn
    for (const line of validLines) {
      const ingredient = ingredients.find((item) => item.id === line.ingredientId);
      if (ingredient && Number(line.quantity) > ingredient.quantity) {
        alert(`Lỗi: Số lượng xuất của [${ingredient.name}] vượt quá tồn kho hiện tại (${ingredient.quantity} ${ingredient.unit}). Vui lòng kiểm tra lại!`);
        return;
      }
    }

    try {
      setSubmittingExport(true);
      const createdAt = new Date().toISOString();
      const exportGroupCode = `PXK-${Date.now()}`;

      for (const line of validLines) {
        const ingredient = ingredients.find((item) => item.id === line.ingredientId);
        if (!ingredient) continue;

        const qtyToExport = Number(line.quantity);
        const previousQuantity = Number(ingredient.quantity || 0);
        const newQuantity = previousQuantity - qtyToExport;
        const totalValue = qtyToExport * Number(ingredient.cost || 0);

        await addStockExportToSupabase({
          export_code: exportGroupCode,
          ingredient_id: ingredient.id,
          ingredient_name: ingredient.name,
          quantity_exported: qtyToExport,
          unit_cost: ingredient.cost,
          total_value: totalValue,
          reason: line.reason,
          exported_by: currentUser?.fullName || "Quản trị viên",
          note: exportNote,
          created_at: createdAt,
        });

        await updateIngredientInSupabase(ingredient.id, {
          name: ingredient.name,
          unit: ingredient.unit,
          quantity: newQuantity,
          cost: ingredient.cost,
          min_stock: ingredient.min_stock,
        });

        await addInventoryLogToSupabase({
          id: `inventory-log-export-${Date.now()}-${ingredient.id}`,
          ingredient_id: ingredient.id,
          ingredient_name: ingredient.name,
          previous_quantity: previousQuantity,
          new_quantity: newQuantity,
          difference: -qtyToExport,
          note: `Xuất kho ${exportGroupCode}: ${line.reason}`,
          updated_by: currentUser?.fullName || "Quản trị viên",
          created_at: createdAt,
        });
      }

      setExportLines([createEmptyExportLine()]);
      setExportNote("");
      await loadInventory(false);
      alert("Đã ghi nhận phiếu xuất kho thành công.");
    } catch (error) {
      alert(`Có lỗi xảy ra: ${JSON.stringify(error)}`);
    } finally {
      setSubmittingExport(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[430px_1fr]">
      <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800">Tạo Phiếu Xuất Kho</h2>
        <p className="mt-1 text-sm text-slate-500">Dùng để xuất kho thủ công: hư hỏng, nội bộ, điều chuyển, hoặc cân bằng hao hụt.</p>
        
        <form onSubmit={submitExport} className="mt-4 space-y-4">
          <div className="space-y-4">
            {exportLines.map((line, index) => {
              const selectedIngredient = ingredients.find(item => item.id === line.ingredientId);
              const maxStock = selectedIngredient ? selectedIngredient.quantity : 0;
              const isOverStock = selectedIngredient && Number(line.quantity) > maxStock;

              return (
                <div key={line.lineId} className={`rounded-[20px] border p-4 ${isOverStock ? 'border-red-300 bg-red-50' : 'border-[#d7e2d5] bg-[#f8fbf7]'}`}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-slate-800">Mục xuất #{index + 1}</h3>
                    {exportLines.length > 1 && (
                      <button type="button" onClick={() => removeExportLine(line.lineId)} className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-600"><X size={14} />Xóa</button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Nguyên liệu</label>
                      <select className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none" value={line.ingredientId} onChange={(e) => updateExportLine(line.lineId, "ingredientId", e.target.value)}>
                        <option value="">-- Chọn nguyên liệu --</option>
                        {ingredients.map((item) => (
                          <option key={item.id} value={item.id} disabled={item.quantity <= 0}>
                            {item.name} ({item.unit}) - Tồn hợp lệ: {item.quantity}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Lý do xuất</label>
                        <select className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none" value={line.reason} onChange={(e) => updateExportLine(line.lineId, "reason", e.target.value)}>
                          <option value="Sử dụng nội bộ">Dùng nội bộ</option>
                          <option value="Hư hỏng/Hết hạn">Hư hỏng / Hết hạn</option>
                          <option value="Cho/Tặng/Khuyến mãi">Cho tặng / KM</option>
                          <option value="Hủy mẫu test">Hủy mẫu test</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-2 flex justify-between text-sm font-semibold text-slate-700">
                          <span>Số lượng xuất</span>
                          {selectedIngredient && <span className="text-xs text-slate-400 font-normal mt-0.5">(Max {maxStock})</span>}
                        </label>
                        <input type="text" inputMode="numeric" className={`w-full rounded-2xl border ${isOverStock ? 'border-red-500' : 'border-[#d7e2d5]'} px-4 py-3 outline-none`} value={line.quantity} onChange={(e) => updateExportLine(line.lineId, "quantity", e.target.value.replace(/\D/g, ""))} />
                        {isOverStock && <p className="text-red-500 text-xs mt-1 font-medium">Xuất quá tồn kho (Strict mode)</p>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button type="button" onClick={addExportLine} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#d7e2d5] bg-transparent px-4 py-3 font-semibold text-slate-500 hover:bg-[#f7faf6]"><Plus size={16} />Thêm dòng xuất</button>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Ghi chú chung</label>
            <input className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none" value={exportNote} onChange={(e) => setExportNote(e.target.value)} placeholder="Mã phiếu kiểm hoặc phòng ban yêu cầu..." />
          </div>

          <button type="submit" disabled={submittingExport} className="w-full inline-flex justify-center items-center gap-2 rounded-2xl bg-amber-600 px-4 py-3 font-semibold text-white hover:bg-amber-700 disabled:opacity-70">
            <ArrowUpRight size={18} />{submittingExport ? "Đang xử lý..." : "Xác nhận Xuất Kho"}
          </button>
        </form>
      </div>

      <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800">Nhật ký xuất kho</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-[#eff4ef] text-left text-sm text-slate-700">
                <th className="rounded-l-2xl px-4 py-3">Mã phiếu</th>
                <th className="px-4 py-3">Nguyên liệu</th>
                <th className="px-4 py-3">SL Xuất</th>
                <th className="px-4 py-3">Tổng giá trị</th>
                <th className="px-4 py-3">Lý do</th>
                <th className="px-4 py-3">Người xuất</th>
                <th className="rounded-r-2xl px-4 py-3">Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {stockExports.length === 0 && (
                <tr><td colSpan={7} className="py-6 text-center text-slate-500">Chưa có dữ liệu xuất kho</td></tr>
              )}
              {stockExports.map((item) => (
                <tr key={item.id} className="border-b border-[#edf1ec] text-sm">
                  <td className="px-4 py-3 font-semibold text-slate-800">{item.export_code}</td>
                  <td className="px-4 py-3">{item.ingredient_name}</td>
                  <td className="px-4 py-3 font-bold text-red-600">-{item.quantity_exported}</td>
                  <td className="px-4 py-3">{formatCurrency(item.total_value)}</td>
                  <td className="px-4 py-3"><span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs font-semibold">{item.reason}</span></td>
                  <td className="px-4 py-3">{item.exported_by}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDateTime(item.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
