"use client";

import { useState, useMemo } from "react";
import { Plus, X, PackagePlus, ReceiptText, Printer, Trash2, Filter } from "lucide-react";
import { useInventory } from "./InventoryContext";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  addStockReceiptToSupabase,
  updateIngredientInSupabase,
  addInventoryLogToSupabase,
  addDeliveryNoteToSupabase,
  addPaymentDocumentToSupabase,
  deletePaymentDocumentByReceiptGroupCodeInSupabase,
  deleteDeliveryNoteByReceiptGroupCodeInSupabase,
  deleteStockReceiptGroupInSupabase,
} from "@/lib/db";

type ReceiptLine = {
  lineId: string;
  ingredientId: string;
  quantity: string;
  unitCost: string;
};

const createEmptyReceiptLine = (): ReceiptLine => ({
  lineId: `receipt-line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  ingredientId: "",
  quantity: "",
  unitCost: "",
});

function getStartOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type ReceiptFilterPreset = "all" | "today" | "7days" | "30days";

function isInPreset(dateString: string, preset: ReceiptFilterPreset) {
  if (preset === "all") return true;
  const target = new Date(dateString);
  const now = new Date();
  if (preset === "today") return getDateInputValue(target) === getDateInputValue(now);
  const start = getStartOfDay(new Date());
  const days = preset === "7days" ? 6 : 29;
  start.setDate(start.getDate() - days);
  return target >= start;
}

export default function StockReceiptsTab() {
  const {
    ingredients,
    suppliers,
    stockReceipts,
    deliveryNotes,
    paymentDocuments,
    loadInventory,
    currentUser,
  } = useInventory();

  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [receiptLines, setReceiptLines] = useState<ReceiptLine[]>([createEmptyReceiptLine()]);
  const [receiptNote, setReceiptNote] = useState("Nhập hàng");
  const [selectedReceiptCode, setSelectedReceiptCode] = useState<string | null>(null);
  const [submittingReceipt, setSubmittingReceipt] = useState(false);

  const [deliveryForm, setDeliveryForm] = useState({
    delivery_code: "",
    delivered_at: new Date().toISOString(),
    delivered_by: currentUser?.fullName || "Quản trị viên",
    vehicle_number: "",
    note: "",
  });

  const [paymentForm, setPaymentForm] = useState({
    payment_code: "",
    payment_method: "bank_transfer",
    amount: "",
    payment_date: getDateInputValue(new Date()),
    reference_number: "",
    note: "",
  });

  const [receiptFilterPreset, setReceiptFilterPreset] = useState<ReceiptFilterPreset>("all");
  const [receiptFilterDate, setReceiptFilterDate] = useState("");
  const [receiptSearch, setReceiptSearch] = useState("");

  const updateReceiptLine = (lineId: string, field: keyof ReceiptLine, value: string) => {
    setReceiptLines((prev) =>
      prev.map((line) => (line.lineId === lineId ? { ...line, [field]: value } : line))
    );
  };

  const addReceiptLine = () => setReceiptLines((prev) => [...prev, createEmptyReceiptLine()]);
  const removeReceiptLine = (lineId: string) => {
    setReceiptLines((prev) => (prev.length === 1 ? prev : prev.filter((line) => line.lineId !== lineId)));
  };

  const receiptPreview = useMemo(() => {
    return receiptLines.map((line) => {
      const ingredient = ingredients.find((item) => item.id === line.ingredientId);
      const quantity = Number(line.quantity || 0);
      const unitCost = Number(line.unitCost || 0);
      const totalCost = quantity * unitCost;
      return { ...line, ingredient, quantity, unitCost, totalCost };
    });
  }, [receiptLines, ingredients]);

  const receiptGrandTotal = useMemo(() => {
    return receiptPreview.reduce((sum, line) => sum + line.totalCost, 0);
  }, [receiptPreview]);

  const filteredStockReceipts = useMemo(() => {
    let result = [...stockReceipts];
    if (receiptFilterPreset !== "all") {
      result = result.filter((item) => isInPreset(item.created_at, receiptFilterPreset));
    }
    if (receiptFilterDate) {
      result = result.filter((item) => getDateInputValue(new Date(item.created_at)) === receiptFilterDate);
    }
    if (receiptSearch.trim()) {
      const keyword = receiptSearch.trim().toLowerCase();
      result = result.filter((item) => {
        const groupCode = (item.receipt_group_code || "").toLowerCase();
        return (
          groupCode.includes(keyword) ||
          (item.ingredient_name || "").toLowerCase().includes(keyword) ||
          (item.supplier_name || "").toLowerCase().includes(keyword) ||
          (item.note || "").toLowerCase().includes(keyword)
        );
      });
    }
    return result;
  }, [stockReceipts, receiptFilterPreset, receiptFilterDate, receiptSearch]);

  const groupedReceipts = useMemo(() => {
    const map = new Map<string, any>();
    for (const item of filteredStockReceipts) {
      const code = item.receipt_group_code || item.id;
      const existing = map.get(code);
      if (!existing) {
        map.set(code, {
          receipt_group_code: code,
          created_at: item.created_at,
          received_by: item.received_by,
          supplier_id: item.supplier_id,
          supplier_name: item.supplier_name,
          note: item.note,
          lines: [item],
          total_amount: Number(item.total_cost || 0),
          total_items: 1,
        });
      } else {
        existing.lines.push(item);
        existing.total_amount += Number(item.total_cost || 0);
        existing.total_items += 1;
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [filteredStockReceipts]);

  const selectedReceipt = useMemo(() => {
    if (!selectedReceiptCode) return null;
    return groupedReceipts.find((item) => item.receipt_group_code === selectedReceiptCode) || null;
  }, [groupedReceipts, selectedReceiptCode]);

  const selectedDelivery = useMemo(() => {
    if (!selectedReceiptCode) return null;
    return deliveryNotes.find((item) => item.receipt_group_code === selectedReceiptCode) || null;
  }, [deliveryNotes, selectedReceiptCode]);

  const selectedPayment = useMemo(() => {
    if (!selectedReceiptCode) return null;
    return paymentDocuments.find((item) => item.receipt_group_code === selectedReceiptCode) || null;
  }, [paymentDocuments, selectedReceiptCode]);

  const submitReceipt = async (e: React.FormEvent) => {
    e.preventDefault();

    const validLines = receiptPreview.filter(
      (line) => line.ingredient && line.quantity > 0 && line.unitCost >= 0
    );

    if (validLines.length === 0) {
      alert("Vui lòng nhập ít nhất 1 nguyên liệu hợp lệ.");
      return;
    }

    if (!selectedSupplierId) {
      alert("Vui lòng chọn nhà cung cấp cho phiếu nhập.");
      return;
    }

    const supplier = suppliers.find((item) => item.id === selectedSupplierId);
    if (!supplier) {
      alert("Nhà cung cấp không hợp lệ.");
      return;
    }

    const ingredientIds = validLines.map((line) => line.ingredientId);
    const uniqueIds = new Set(ingredientIds);

    if (uniqueIds.size !== ingredientIds.length) {
      alert("Mỗi nguyên liệu chỉ nên xuất hiện 1 lần trong cùng một phiếu nhập.");
      return;
    }

    try {
      setSubmittingReceipt(true);
      const createdAt = new Date().toISOString();
      const receiptGroupCode = `PNK-${Date.now()}`;
      const deliveryCode = deliveryForm.delivery_code.trim() || `PGH-${Date.now()}`;
      const paymentCode = paymentForm.payment_code.trim() || `CTTT-${Date.now()}`;

      for (const line of validLines) {
        const ingredient = line.ingredient;
        if (!ingredient) continue;

        const previousQuantity = Number(ingredient.quantity || 0);
        const newQuantity = previousQuantity + line.quantity;
        
        // Tính giá vốn trung bình (Bình quân gia quyền) theo Rule Giá Vốn
        const previousTotalValue = previousQuantity * (ingredient.cost || 0);
        const importTotalValue = line.quantity * line.unitCost;
        let newAverageCost = ingredient.cost;
        if (newQuantity > 0) {
          newAverageCost = Math.round((previousTotalValue + importTotalValue) / newQuantity);
        }

        await addStockReceiptToSupabase({
          receipt_group_code: receiptGroupCode,
          ingredient_id: ingredient.id,
          ingredient_name: ingredient.name,
          quantity_added: line.quantity,
          unit_cost: line.unitCost,
          total_cost: Math.round(line.totalCost),
          note: receiptNote,
          received_by: currentUser?.fullName || "Quản trị viên",
          created_at: createdAt,
          supplier_id: supplier.id,
          supplier_name: supplier.name,
        });

        await updateIngredientInSupabase(ingredient.id, {
          name: ingredient.name,
          unit: ingredient.unit,
          quantity: Math.round(newQuantity),
          cost: Math.round(newAverageCost),
          min_stock: ingredient.min_stock,
        });

        await addInventoryLogToSupabase({
          ingredient_id: ingredient.id,
          ingredient_name: ingredient.name,
          previous_quantity: previousQuantity,
          new_quantity: newQuantity,
          difference: line.quantity,
          note: `Nhập kho ${receiptGroupCode}: ${receiptNote}`,
          updated_by: currentUser?.fullName || "Quản trị viên",
          created_at: createdAt,
        });
      }

      await addDeliveryNoteToSupabase({
        receipt_group_code: receiptGroupCode,
        supplier_id: supplier.id,
        supplier_name: supplier.name,
        delivery_code: deliveryCode,
        delivered_at: deliveryForm.delivered_at,
        delivered_by: deliveryForm.delivered_by,
        vehicle_number: deliveryForm.vehicle_number,
        note: deliveryForm.note,
        created_at: createdAt,
      });

      await addPaymentDocumentToSupabase({
        receipt_group_code: receiptGroupCode,
        supplier_id: supplier.id,
        supplier_name: supplier.name,
        payment_code: paymentCode,
        payment_method: paymentForm.payment_method,
        amount: Number(paymentForm.amount || receiptGrandTotal),
        payment_date: paymentForm.payment_date,
        reference_number: paymentForm.reference_number,
        note: paymentForm.note,
        created_at: createdAt,
      });

      setReceiptLines([createEmptyReceiptLine()]);
      setReceiptNote("Nhập hàng");
      setSelectedSupplierId("");
      setDeliveryForm({
        delivery_code: "",
        delivered_at: new Date().toISOString(),
        delivered_by: currentUser?.fullName || "Quản trị viên",
        vehicle_number: "",
        note: "",
      });
      setPaymentForm({
        payment_code: "",
        payment_method: "bank_transfer",
        amount: "",
        payment_date: getDateInputValue(new Date()),
        reference_number: "",
        note: "",
      });

      await loadInventory(false);
      setSelectedReceiptCode(receiptGroupCode);
      alert("Đã ghi nhận phiếu nhập kho, phiếu giao hàng và chứng từ thanh toán thành công.");
    } catch (error: any) {
      console.error("Lỗi nhập kho:", error);
      const message = error?.message || JSON.stringify(error);
      alert(`Có lỗi khi nhập kho: ${message}`);
    } finally {
      setSubmittingReceipt(false);
    }
  };

  const handleDeleteReceiptGroup = async (receiptGroupCode: string) => {
    const ok = confirm(`Bạn có chắc muốn xóa toàn bộ phiếu ${receiptGroupCode}? Hành động này sẽ rollback tồn kho và xóa chứng từ liên quan.`);
    if (!ok) return;

    try {
      const receiptLines = stockReceipts.filter((item) => item.receipt_group_code === receiptGroupCode);

      for (const line of receiptLines) {
        const ingredient = ingredients.find((item) => item.id === line.ingredient_id);
        if (!ingredient) continue;

        const previousQuantity = Number(ingredient.quantity || 0);
        const rollbackQuantity = Math.max(previousQuantity - Number(line.quantity_added || 0), 0);

        // Giữ nguyên giá vốn cũ, chỉ trừ số lượng
        await updateIngredientInSupabase(ingredient.id, {
          name: ingredient.name,
          unit: ingredient.unit,
          quantity: rollbackQuantity,
          cost: ingredient.cost,
          min_stock: ingredient.min_stock,
        });

        await addInventoryLogToSupabase({
          id: `inventory-log-delete-${Date.now()}-${ingredient.id}`,
          ingredient_id: ingredient.id,
          ingredient_name: ingredient.name,
          previous_quantity: previousQuantity,
          new_quantity: rollbackQuantity,
          difference: rollbackQuantity - previousQuantity,
          note: `Xóa/Rollback phiếu nhập ${receiptGroupCode}`,
          updated_by: currentUser?.fullName || "Quản trị viên",
          created_at: new Date().toISOString(),
        });
      }

      await deletePaymentDocumentByReceiptGroupCodeInSupabase(receiptGroupCode);
      await deleteDeliveryNoteByReceiptGroupCodeInSupabase(receiptGroupCode);
      await deleteStockReceiptGroupInSupabase(receiptGroupCode);
      await loadInventory(false);
      
      if (selectedReceiptCode === receiptGroupCode) setSelectedReceiptCode(null);
      alert("Đã xóa phiếu nhập và rollback dữ liệu liên quan.");
    } catch (error) {
      alert(`Có lỗi khi xóa phiếu nhập: ${error}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Bộ lọc nhập kho</h2>
            <p className="mt-1 text-sm text-slate-500">Tìm kiếm chứng từ theo khoảng thời gian hoặc theo mã phiếu.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-4 xl:min-w-[760px]">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Khoảng ngày</label>
              <div className="relative">
                <Filter size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select className="w-full rounded-2xl border border-[#d7e2d5] py-3 pl-10 pr-4 outline-none" value={receiptFilterPreset} onChange={(e) => setReceiptFilterPreset(e.target.value as ReceiptFilterPreset)}>
                  <option value="all">Tất cả</option>
                  <option value="today">Hôm nay</option>
                  <option value="7days">7 ngày gần đây</option>
                  <option value="30days">30 ngày gần đây</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Ngày cụ thể</label>
              <input type="date" className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none" value={receiptFilterDate} onChange={(e) => setReceiptFilterDate(e.target.value)} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Tìm kiếm</label>
              <input className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none" value={receiptSearch} onChange={(e) => setReceiptSearch(e.target.value)} placeholder="Mã phiếu / NVL / NCC" />
            </div>
            <div className="flex items-end gap-3">
              <button
                type="button"
                onClick={() => { setReceiptFilterPreset("all"); setReceiptFilterDate(""); setReceiptSearch(""); }}
                className="w-full rounded-2xl border border-[#d7e2d5] bg-[#eef3ee] px-4 py-3 font-semibold text-slate-700 hover:bg-[#dfeada]"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[430px_1fr]">
        <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800">Phiếu nhập kho liên kết</h2>
          <p className="mt-1 text-sm text-slate-500">Một lần ghi nhận sẽ sinh ra: phiếu nhập kho, phiếu giao hàng và chứng từ thanh toán.</p>

          <form onSubmit={submitReceipt} className="mt-4 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Nhà cung cấp (*)</label>
              <select className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none" value={selectedSupplierId} onChange={(e) => setSelectedSupplierId(e.target.value)}>
                <option value="">-- Chọn nhà cung cấp --</option>
                {suppliers.filter((s) => s.active).map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Mã phiếu giao hàng</label>
                <input className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none" value={deliveryForm.delivery_code} onChange={(e) => setDeliveryForm((prev) => ({ ...prev, delivery_code: e.target.value }))} placeholder="Tự sinh nếu rỗng" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Người giao</label>
                <input className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none" value={deliveryForm.delivered_by} onChange={(e) => setDeliveryForm((prev) => ({ ...prev, delivered_by: e.target.value }))} />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Mã chứng từ thanh toán</label>
                <input className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none" value={paymentForm.payment_code} onChange={(e) => setPaymentForm((prev) => ({ ...prev, payment_code: e.target.value }))} placeholder="Tự sinh nếu rỗng" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Số tiền thanh toán</label>
                <input type="text" inputMode="numeric" className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none" value={paymentForm.amount} onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: e.target.value.replace(/\D/g, "") }))} placeholder={String(receiptGrandTotal)} />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Hình thức thanh toán</label>
              <select className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none" value={paymentForm.payment_method} onChange={(e) => setPaymentForm((prev) => ({ ...prev, payment_method: e.target.value }))}>
                <option value="cash">Tiền mặt</option>
                <option value="bank_transfer">Chuyển khoản</option>
                <option value="debt">Công nợ</option>
              </select>
            </div>

            <div className="space-y-4">
              {receiptLines.map((line, index) => (
                <div key={line.lineId} className="rounded-[20px] border border-[#d7e2d5] bg-[#f8fbf7] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-slate-800">Dòng hàng #{index + 1}</h3>
                    {receiptLines.length > 1 && (
                      <button type="button" onClick={() => removeReceiptLine(line.lineId)} className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600"><X size={14} />Xóa</button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Nguyên liệu</label>
                      <select className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none" value={line.ingredientId} onChange={(e) => updateReceiptLine(line.lineId, "ingredientId", e.target.value)}>
                        <option value="">-- Chọn nguyên liệu --</option>
                        {ingredients.map((item) => (
                          <option key={item.id} value={item.id}>{item.name} ({item.unit}) - Tồn: {item.quantity}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Số lượng</label>
                        <input type="text" inputMode="numeric" className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none" value={line.quantity} onChange={(e) => updateReceiptLine(line.lineId, "quantity", e.target.value.replace(/\D/g, ""))} />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Đơn giá</label>
                        <input type="text" inputMode="numeric" className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none" value={line.unitCost} onChange={(e) => updateReceiptLine(line.lineId, "unitCost", e.target.value.replace(/\D/g, ""))} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button type="button" onClick={addReceiptLine} className="inline-flex items-center gap-2 rounded-2xl border border-[#d7e2d5] bg-[#eef3ee] px-4 py-3 font-semibold text-slate-700 hover:bg-[#dfeada]"><Plus size={16} />Thêm dòng nguyên liệu</button>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Ghi chú phiếu nhập</label>
              <input className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none" value={receiptNote} onChange={(e) => setReceiptNote(e.target.value)} placeholder="Nhập từ lô mới..." />
            </div>

            <div className="rounded-2xl border border-[#d7e2d5] bg-[#eff4ef] p-4 text-[#3d5643]">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Tổng bộ chứng từ:</span>
                <span>{formatCurrency(receiptGrandTotal)}</span>
              </div>
              <p className="mt-1 text-sm text-[#4e6b53]">Giá vốn trung bình của các nguyên liệu cũng sẽ được tính lại tự động.</p>
            </div>

            <button type="submit" disabled={submittingReceipt} className="w-full inline-flex justify-center items-center gap-2 rounded-2xl bg-[#4e6b53] px-4 py-3 font-semibold text-white hover:bg-[#3f5845] disabled:opacity-70">
              <PackagePlus size={18} />{submittingReceipt ? "Đang xử lý..." : "Xác nhận Nhập Kho"}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800">Lịch sử phiếu nhập</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-[#eff4ef] text-left text-sm text-slate-700">
                    <th className="rounded-l-2xl px-4 py-3">Mã phiếu</th>
                    <th className="px-4 py-3">Nhà cung cấp</th>
                    <th className="px-4 py-3">Tổng tiền</th>
                    <th className="px-4 py-3">Thời gian</th>
                    <th className="rounded-r-2xl px-4 py-3">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedReceipts.length === 0 && (
                    <tr><td colSpan={5} className="py-8 text-center text-slate-500">Không tìm thấy phiếu nhập nào</td></tr>
                  )}
                  {groupedReceipts.map((item) => (
                    <tr key={item.receipt_group_code} className="border-b border-[#edf1ec] text-sm md:text-base">
                      <td className="px-4 py-3 font-semibold text-slate-800">{item.receipt_group_code}</td>
                      <td className="px-4 py-3">{item.supplier_name || "-"}</td>
                      <td className="px-4 py-3 text-red-600 font-semibold">{formatCurrency(item.total_amount)}</td>
                      <td className="px-4 py-3">{formatDateTime(item.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => setSelectedReceiptCode(item.receipt_group_code)} className="inline-flex items-center gap-2 rounded-2xl border border-[#d7e2d5] bg-[#eef3ee] px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-[#dfeada]"><ReceiptText size={15} />Chi tiết</button>
                          <button onClick={() => handleDeleteReceiptGroup(item.receipt_group_code)} className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600"><Trash2 size={15} />Rollback</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {selectedReceipt && (
            <div className="rounded-[24px] border border-[#d7e2d5] bg-[#f8fbf7] p-5 shadow-inner">
              <h3 className="text-xl font-bold text-slate-800">Chi tiết đối soát {selectedReceipt.receipt_group_code}</h3>
              <p className="text-sm text-slate-500 mb-4">{selectedReceipt.note ? `Ghi chú: ${selectedReceipt.note}` : ""}</p>
              
              <div className="grid gap-4 md:grid-cols-3 mb-4">
                <div className="rounded-2xl border border-[#d7e2d5] bg-white p-4">
                  <p className="text-sm text-slate-500">Nhà cung cấp</p>
                  <p className="mt-1 font-semibold text-slate-800">{selectedReceipt.supplier_name || "-"}</p>
                </div>
                <div className="rounded-2xl border border-[#d7e2d5] bg-white p-4">
                  <p className="text-sm text-slate-500">Phiếu giao hàng</p>
                  <p className="mt-1 font-semibold text-slate-800">{selectedDelivery?.delivery_code || "-"}</p>
                  <p className="text-xs text-slate-400">{selectedDelivery ? formatDateTime(selectedDelivery.delivered_at) : ""}</p>
                </div>
                <div className="rounded-2xl border border-[#d7e2d5] bg-white p-4">
                  <p className="text-sm text-slate-500">Chứng từ thanh toán</p>
                  <p className="mt-1 font-semibold text-slate-800">{selectedPayment?.payment_code || "-"}</p>
                  <p className="text-xs text-slate-400">{selectedPayment ? `${selectedPayment.payment_method} - ${formatCurrency(selectedPayment.amount)}` : ""}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#d7e2d5] bg-white p-4">
                <p className="text-sm font-semibold text-slate-700 mb-3">Danh sách nguyên vật liệu nhập ({selectedReceipt.total_items})</p>
                <div className="space-y-2">
                  {selectedReceipt.lines.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center bg-[#f7faf6] p-2 px-3 rounded-lg text-sm">
                      <span className="font-medium">{item.ingredient_name} x {item.quantity_added}</span>
                      <span>Đơn giá: {formatCurrency(item.unit_cost)} <b className="ml-3">{formatCurrency(item.total_cost)}</b></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
