"use client";

import { useState } from "react";
import { ClipboardCheck, Check, Save } from "lucide-react";
import { useInventory } from "./InventoryContext";
import { formatDateTime } from "@/lib/utils";
import {
  addInventoryCheckToSupabase,
  updateIngredientInSupabase,
  addInventoryLogToSupabase,
} from "@/lib/db";

export default function InventoryChecksTab() {
  const { ingredients, inventoryChecks, loadInventory, currentUser } = useInventory();
  
  const [checking, setChecking] = useState(false);
  const [actualValues, setActualValues] = useState<Record<string, string>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [checkNote, setCheckNote] = useState("Kiểm kê định kỳ");
  const [submittingCheck, setSubmittingCheck] = useState(false);

  const startCheck = () => {
    setChecking(true);
    const initial: Record<string, string> = {};
    const initialReasons: Record<string, string> = {};
    ingredients.forEach(i => {
      initial[i.id] = String(i.quantity);
      initialReasons[i.id] = "";
    });
    setActualValues(initial);
    setReasons(initialReasons);
  };

  const cancelCheck = () => {
    const ok = confirm("Hủy bỏ phiên kiểm kê chưa lưu?");
    if (ok) {
      setChecking(false);
      setActualValues({});
      setReasons({});
    }
  };

  const submitCheck = async () => {
    // Only process items that actually have a difference
    const diffItems = ingredients.filter(i => {
      const actual = Number(actualValues[i.id] || 0);
      return actual !== i.quantity;
    });

    if (diffItems.length === 0) {
      alert("Khớp 100% với hệ thống, không có gì để điều chỉnh chênh lệch.");
      // Just record a nominal check if you want, but UX-wise returning is better.
      return;
    }

    try {
      setSubmittingCheck(true);
      const createdAt = new Date().toISOString();
      const checkCode = `KK-${Date.now()}`;

      for (const item of diffItems) {
        const actual = Number(actualValues[item.id] || 0);
        const difference = actual - item.quantity;
        const reason = reasons[item.id] || "Hao hụt tự nhiên";

        await addInventoryCheckToSupabase({
          check_code: checkCode,
          ingredient_id: item.id,
          ingredient_name: item.name,
          system_quantity: item.quantity,
          actual_quantity: actual,
          difference: difference,
          reason: reason,
          status: "completed",
          checked_by: currentUser?.fullName || "Quản trị viên",
          note: checkNote,
          created_at: createdAt,
        });

        await updateIngredientInSupabase(item.id, {
          name: item.name,
          unit: item.unit,
          quantity: actual,
          cost: item.cost,
          min_stock: item.min_stock,
        });

        await addInventoryLogToSupabase({
          id: `inventory-log-check-${Date.now()}-${item.id}`,
          ingredient_id: item.id,
          ingredient_name: item.name,
          previous_quantity: item.quantity,
          new_quantity: actual,
          difference: difference,
          note: `Phiếu KK ${checkCode}: ${reason}`,
          updated_by: currentUser?.fullName || "Quản trị viên",
          created_at: createdAt,
        });
      }

      setChecking(false);
      setActualValues({});
      setReasons({});
      await loadInventory(false);
      alert(`Đã hoàn thành kiểm kê và điều chỉnh lại ${diffItems.length} mặt hàng.`);
    } catch (error) {
      alert(`Có lỗi khi kiểm kê: ${error}`);
    } finally {
      setSubmittingCheck(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Kiểm kê kho thực tế</h2>
            <p className="mt-1 text-sm text-slate-500">So sánh tồn trên hệ thống và đối chiếu kho thực tế. Chọn tạo thẻ kho để bắt đầu.</p>
          </div>
          {!checking ? (
            <button onClick={startCheck} className="inline-flex items-center gap-2 rounded-2xl bg-[#4e6b53] px-4 py-3 font-semibold text-white hover:bg-[#3f5845]"><ClipboardCheck size={18} />Tạo thẻ kiểm kê</button>
          ) : (
            <div className="flex gap-2">
              <button 
                onClick={submitCheck} 
                disabled={submittingCheck}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#ecfccb] text-[#4d7c0f] px-4 py-3 font-semibold hover:bg-[#d9f99d] transition disabled:opacity-50"
              >
                <Save size={18} />{submittingCheck ? "Đang lưu..." : "Xác nhận"}
              </button>
              <button onClick={cancelCheck} className="rounded-2xl border border-[#d7e2d5] px-4 py-3 font-semibold text-slate-600">Hủy bỏ</button>
            </div>
          )}
        </div>

        {checking && (
          <div className="mt-6 mb-4">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Ghi chú phiếu kiểm</label>
            <input className="w-full xl:w-1/2 rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none" value={checkNote} onChange={(e) => setCheckNote(e.target.value)} placeholder="KK toàn bộ hay 1 phần kho?" />
          </div>
        )}

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-[#eff4ef] text-left text-sm text-slate-700">
                <th className="rounded-l-2xl px-4 py-3">Băng Mép/Mã</th>
                <th className="px-4 py-3 w-64">Nguyên liệu</th>
                <th className="px-4 py-3 text-center">Hệ thống</th>
                <th className="px-4 py-3 text-center w-48">Thực tế đếm</th>
                <th className="px-4 py-3 text-center">Độ lệch</th>
                <th className="rounded-r-2xl px-4 py-3 w-64">Lý do điều chỉnh</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map((item, index) => {
                const sysQty = item.quantity;
                const actQty = actualValues[item.id] !== undefined ? Number(actualValues[item.id]) : sysQty;
                const diff = actQty - sysQty;
                
                return (
                  <tr key={item.id} className={`border-b border-[#edf1ec] text-sm ${diff !== 0 && checking ? 'bg-amber-50' : ''}`}>
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">{index + 1}</td>
                    <td className="px-4 py-3 font-semibold">{item.name} <span className="text-slate-400 font-normal">({item.unit})</span></td>
                    <td className="px-4 py-3 text-center font-bold text-slate-600">{sysQty}</td>
                    <td className="px-4 py-3 text-center">
                      {checking ? (
                        <input 
                          type="text" inputMode="numeric" 
                          className="w-full text-center rounded-xl border border-[#d7e2d5] px-2 py-1.5 outline-none font-bold focus:border-[#4e6b53] focus:bg-[#f7faf6]"
                          value={actualValues[item.id] ?? sysQty}
                          onChange={(e) => setActualValues(p => ({ ...p, [item.id]: e.target.value.replace(/\D/g, "") }))}
                        />
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {checking ? (
                        <span className={`font-bold ${diff > 0 ? "text-emerald-600" : diff < 0 ? "text-red-500" : "text-slate-400"}`}>
                          {diff > 0 ? `+${diff}` : diff}
                        </span>
                      ) : "-"}
                    </td>
                    <td className="px-4 py-3">
                      {checking && diff !== 0 ? (
                        <input
                          type="text"
                          className="w-full rounded-xl border border-amber-200 bg-white px-2 py-1.5 outline-none text-xs focus:border-amber-400"
                          value={reasons[item.id] || ""}
                          onChange={(e) => setReasons(p => ({ ...p, [item.id]: e.target.value }))}
                          placeholder="Lý do lệch..."
                        />
                      ) : (
                        <span className="text-slate-400 text-xs italic">{checking && diff === 0 ? "Khớp" : ""}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {ingredients.length === 0 && <div className="text-center py-6 text-slate-500">Kho trống, không có dữ liệu để kiểm.</div>}
        </div>
      </div>

      <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800">Nhật ký xử lý chênh lệch kiểm kê</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-[#eff4ef] text-left text-sm text-slate-700">
                <th className="rounded-l-2xl px-4 py-3">Mã phiếu</th>
                <th className="px-4 py-3">Nguyên liệu</th>
                <th className="px-4 py-3">Hệ thống</th>
                <th className="px-4 py-3">Thực tế</th>
                <th className="px-4 py-3">Chênh lệch</th>
                <th className="px-4 py-3">Lý do</th>
                <th className="px-4 py-3">Người kiểm</th>
                <th className="rounded-r-2xl px-4 py-3">Ngày T/H</th>
              </tr>
            </thead>
            <tbody>
              {inventoryChecks.length === 0 && (
                <tr><td colSpan={8} className="py-6 text-center text-slate-500">Chưa có phiếu kiểm kê sai lệch nào</td></tr>
              )}
              {inventoryChecks.map((item) => (
                <tr key={item.id} className="border-b border-[#edf1ec] text-sm md:text-base">
                  <td className="px-4 py-3 font-semibold text-slate-800">{item.check_code}</td>
                  <td className="px-4 py-3">{item.ingredient_name}</td>
                  <td className="px-4 py-3 text-slate-500 line-through">{item.system_quantity}</td>
                  <td className="px-4 py-3 font-semibold">{item.actual_quantity}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${item.difference > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                      {item.difference > 0 ? `+${item.difference}` : item.difference}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">{item.reason}</td>
                  <td className="px-4 py-3 text-slate-600">{item.checked_by}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{formatDateTime(item.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
