"use client";

import { useState } from "react";
import { Plus, Trash2, Save, Settings2 } from "lucide-react";
import { useInventory } from "./InventoryContext";
import { formatCurrency } from "@/lib/utils";
import {
  addIngredientToSupabase,
  updateIngredientInSupabase,
  deleteIngredientInSupabase,
  addInventoryLogToSupabase,
} from "@/lib/db";

const emptyIngredientForm = { name: "", unit: "" };
const emptyEditForm = { name: "", unit: "", minStock: "" };

function statusBadgeClass(isDanger: boolean) {
  return isDanger
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-emerald-50 text-emerald-700 border-emerald-200";
}

export default function IngredientsTab() {
  const { ingredients, stockReceipts, inventoryLogs, loadInventory, currentUser } = useInventory();

  const [ingredientForm, setIngredientForm] = useState(emptyIngredientForm);
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [stockModalId, setStockModalId] = useState<string | null>(null);
  const [stockQuantity, setStockQuantity] = useState("");
  const [stockNote, setStockNote] = useState("Kiểm kho cuối ngày");

  const submitIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: ingredientForm.name.trim(),
      unit: ingredientForm.unit.trim(),
    };
    if (!payload.name || !payload.unit) {
      alert("Vui lòng nhập đầy đủ tên nguyên liệu và đơn vị.");
      return;
    }
    try {
      await addIngredientToSupabase({
        id: `ingredient-${Date.now()}`,
        name: payload.name,
        unit: payload.unit,
        quantity: 0,
        cost: 0,
        min_stock: 0,
        created_at: new Date().toISOString(),
      });
      setIngredientForm(emptyIngredientForm);
      await loadInventory(false);
      alert("Đã thêm nguyên liệu mới.");
    } catch (error) {
      alert(`Có lỗi khi thêm nguyên liệu: ${error}`);
    }
  };

  const openEditIngredient = (item: any) => {
    setEditingIngredientId(item.id);
    setEditForm({ name: item.name, unit: item.unit, minStock: String(item.min_stock) });
  };

  const submitEditIngredient = async () => {
    if (!editingIngredientId) return;
    const oldItem = ingredients.find((item) => item.id === editingIngredientId);
    if (!oldItem) return;
    try {
      await updateIngredientInSupabase(editingIngredientId, {
        name: editForm.name.trim(),
        unit: editForm.unit.trim(),
        min_stock: Number(editForm.minStock || 0),
        quantity: oldItem.quantity,
        cost: oldItem.cost,
      });
      setEditingIngredientId(null);
      await loadInventory(false);
      alert("Đã lưu cấu hình nguyên liệu.");
    } catch (error) {
      alert(`Có lỗi khi cập nhật nguyên liệu: ${error}`);
    }
  };

  const openStockUpdate = (item: any) => {
    setStockModalId(item.id);
    setStockQuantity(String(item.quantity));
    setStockNote("Kiểm kho cuối ngày");
  };

  const submitStockUpdate = async () => {
    if (!stockModalId) return;
    const item = ingredients.find((x) => x.id === stockModalId);
    if (!item) return;

    const newQuantity = Number(stockQuantity || 0);
    const previousQuantity = Number(item.quantity || 0);
    const difference = newQuantity - previousQuantity;

    try {
      await updateIngredientInSupabase(item.id, {
        name: item.name,
        unit: item.unit,
        quantity: newQuantity,
        cost: item.cost,
        min_stock: item.min_stock,
      });

      await addInventoryLogToSupabase({
        id: `inventory-log-${Date.now()}`,
        ingredient_id: item.id,
        ingredient_name: item.name,
        previous_quantity: previousQuantity,
        new_quantity: newQuantity,
        difference,
        note: stockNote,
        updated_by: currentUser?.fullName || "Quản trị viên",
        created_at: new Date().toISOString(),
      });

      setStockModalId(null);
      setStockQuantity("");
      setStockNote("Kiểm kho cuối ngày");
      await loadInventory(false);
      alert("Đã cập nhật tồn kho.");
    } catch (error) {
      alert(`Có lỗi khi cập nhật tồn kho: ${error}`);
    }
  };

  const handleDeleteIngredient = async (id: string) => {
    const hasLinkedReceipts = stockReceipts.some((item) => item.ingredient_id === id);
    const hasLinkedLogs = inventoryLogs.some((item) => item.ingredient_id === id);
    if (hasLinkedReceipts || hasLinkedLogs) {
      alert("Không thể xóa nguyên liệu đã phát sinh nhập kho hoặc log tồn. Hãy cân nhắc đánh dấu ngừng sử dụng thay vì xóa cứng.");
      return;
    }
    const ok = confirm("Bạn có chắc muốn xóa nguyên liệu này?");
    if (!ok) return;

    try {
      await deleteIngredientInSupabase(id);
      await loadInventory(false);
      alert("Đã xóa nguyên liệu.");
    } catch (error) {
      alert(`Có lỗi khi xóa nguyên liệu: ${error}`);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[430px_1fr]">
      <div className="space-y-6">
        <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800">Thêm nguyên liệu</h2>
          <p className="mt-1 text-sm text-slate-500">Thêm danh mục để phục vụ nhập kho và báo cáo.</p>

          <form onSubmit={submitIngredient} className="mt-4 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Tên nguyên liệu</label>
              <input
                className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none"
                value={ingredientForm.name}
                onChange={(e) => setIngredientForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ví dụ: Sữa tươi"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Đơn vị</label>
              <input
                className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none"
                value={ingredientForm.unit}
                onChange={(e) => setIngredientForm((prev) => ({ ...prev, unit: e.target.value }))}
                placeholder="Ví dụ: Lít / Kg / Chai"
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-[#4e6b53] px-4 py-3 font-semibold text-white hover:bg-[#3f5845]">
                <Plus size={16} />Thêm
              </button>
              <button type="button" onClick={() => setIngredientForm(emptyIngredientForm)} className="rounded-2xl border border-[#d7e2d5] bg-[#eef3ee] px-4 py-3 font-semibold text-slate-700">
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800">Tồn kho hiện tại</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-[#eff4ef] text-left text-sm text-slate-700">
                  <th className="rounded-l-2xl px-4 py-3">Tên</th>
                  <th className="px-4 py-3">Đơn vị</th>
                  <th className="px-4 py-3">Tồn hiện tại</th>
                  <th className="px-4 py-3">Giá nhập gần nhất</th>
                  <th className="px-4 py-3">Mức tối thiểu</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="rounded-r-2xl px-4 py-3">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map((item) => {
                  const isLow = item.quantity <= item.min_stock;
                  return (
                    <tr key={item.id} className="border-b border-[#edf1ec] text-sm">
                      <td className="px-4 py-3">{item.name}</td>
                      <td className="px-4 py-3">{item.unit}</td>
                      <td className="px-4 py-3 font-bold">{item.quantity}</td>
                      <td className="px-4 py-3">{formatCurrency(item.cost)}</td>
                      <td className="px-4 py-3">{item.min_stock}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(isLow)}`}>
                          {isLow ? "Sắp hết" : "Ổn định"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => openEditIngredient(item)} className="inline-flex items-center gap-2 rounded-2xl border border-[#d7e2d5] bg-[#eef3ee] px-3 py-2 text-sm font-semibold text-slate-700"><Settings2 size={15} />Cấu hình</button>
                          <button onClick={() => openStockUpdate(item)} className="inline-flex items-center gap-2 rounded-2xl border border-[#cfe0cf] bg-[#edf5ed] px-3 py-2 text-sm font-semibold text-[#3d5643]"><Save size={15} />Cập nhật tồn</button>
                          <button onClick={() => handleDeleteIngredient(item.id)} className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600"><Trash2 size={15} />Xóa</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {editingIngredientId && (
            <div className="mt-5 rounded-[24px] border border-[#d7e2d5] bg-[#f8fbf7] p-4">
              <h3 className="text-lg font-bold text-slate-800">Cấu hình nguyên liệu</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Tên nguyên liệu</label>
                  <input className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none" value={editForm.name} onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Đơn vị</label>
                  <input className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none" value={editForm.unit} onChange={(e) => setEditForm((prev) => ({ ...prev, unit: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Mức tối thiểu</label>
                  <input type="text" inputMode="numeric" className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none" value={editForm.minStock} onChange={(e) => setEditForm((prev) => ({ ...prev, minStock: e.target.value.replace(/\D/g, "") }))} />
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <button onClick={submitEditIngredient} className="rounded-2xl bg-[#4e6b53] px-4 py-3 font-semibold text-white hover:bg-[#3f5845]">Lưu cấu hình</button>
                <button onClick={() => { setEditingIngredientId(null); setEditForm(emptyEditForm); }} className="rounded-2xl border border-[#d7e2d5] bg-white px-4 py-3 font-semibold text-slate-700">Hủy</button>
              </div>
            </div>
          )}

          {stockModalId && (
            <div className="mt-5 rounded-[24px] border border-[#d7e2d5] bg-[#f8fbf7] p-4">
              <h3 className="text-lg font-bold text-slate-800">Cập nhật tồn kho cuối ngày</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Tồn thực tế mới</label>
                  <input type="text" inputMode="numeric" className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value.replace(/\D/g, ""))} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Ghi chú</label>
                  <input className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none" value={stockNote} onChange={(e) => setStockNote(e.target.value)} />
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <button onClick={submitStockUpdate} className="rounded-2xl bg-[#4e6b53] px-4 py-3 font-semibold text-white hover:bg-[#3f5845]">Lưu cập nhật</button>
                <button onClick={() => { setStockModalId(null); setStockQuantity(""); }} className="rounded-2xl border border-[#d7e2d5] bg-white px-4 py-3 font-semibold text-slate-700">Hủy</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
