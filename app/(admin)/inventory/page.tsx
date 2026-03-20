"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  Save,
  PackagePlus,
  Printer,
  Settings2,
  X,
  Filter,
} from "lucide-react";
import { useCafeStore } from "@/lib/store";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  addIngredientToSupabase,
  addInventoryLogToSupabase,
  addStockReceiptToSupabase,
  deleteIngredientInSupabase,
  getIngredients,
  getInventoryLogs,
  getStockReceipts,
  updateIngredientInSupabase,
} from "@/lib/db";

type IngredientRow = {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  cost: number;
  min_stock: number;
  created_at: string;
};

type InventoryLogRow = {
  id: string;
  ingredient_id: string;
  ingredient_name: string;
  previous_quantity: number;
  new_quantity: number;
  difference: number;
  note: string;
  updated_by: string;
  created_at: string;
};

type StockReceiptRow = {
  id: string;
  ingredient_id: string;
  ingredient_name: string;
  quantity_added: number;
  unit_cost: number;
  total_cost: number;
  note: string;
  received_by: string;
  created_at: string;
};

type ReceiptLine = {
  lineId: string;
  ingredientId: string;
  quantity: string;
  unitCost: string;
};

type ReceiptFilterPreset = "all" | "today" | "7days" | "30days";

const emptyIngredientForm = {
  name: "",
  unit: "",
};

const emptyEditForm = {
  name: "",
  unit: "",
  minStock: "",
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

function isInPreset(dateString: string, preset: ReceiptFilterPreset) {
  if (preset === "all") return true;

  const target = new Date(dateString);
  const now = new Date();

  if (preset === "today") {
    return getDateInputValue(target) === getDateInputValue(now);
  }

  const start = getStartOfDay(new Date());
  const days = preset === "7days" ? 6 : 29;
  start.setDate(start.getDate() - days);

  return target >= start;
}

export default function InventoryPage() {
  const { currentUser } = useCafeStore();

  const [ingredients, setIngredients] = useState<IngredientRow[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLogRow[]>([]);
  const [stockReceipts, setStockReceipts] = useState<StockReceiptRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [ingredientForm, setIngredientForm] = useState(emptyIngredientForm);

  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyEditForm);

  const [stockModalId, setStockModalId] = useState<string | null>(null);
  const [stockQuantity, setStockQuantity] = useState("");
  const [stockNote, setStockNote] = useState("Kiểm kho cuối ngày");

  const [receiptLines, setReceiptLines] = useState<ReceiptLine[]>([createEmptyReceiptLine()]);
  const [receiptNote, setReceiptNote] = useState("Nhập hàng");
  const [selectedReceipt, setSelectedReceipt] = useState<StockReceiptRow | null>(null);
  const [submittingReceipt, setSubmittingReceipt] = useState(false);

  const [receiptFilterPreset, setReceiptFilterPreset] =
    useState<ReceiptFilterPreset>("all");
  const [receiptFilterDate, setReceiptFilterDate] = useState("");

  async function loadInventory(showAlert = false) {
    try {
      setLoading(true);

      const [ingredientsData, logsData, receiptsData] = await Promise.all([
        getIngredients(),
        getInventoryLogs(),
        getStockReceipts(),
      ]);

      setIngredients((ingredientsData || []) as IngredientRow[]);
      setInventoryLogs((logsData || []) as InventoryLogRow[]);
      setStockReceipts((receiptsData || []) as StockReceiptRow[]);
    } catch (error) {
      console.error("Lỗi tải dữ liệu kho:", error);
      if (showAlert) {
        const message =
          error instanceof Error ? error.message : JSON.stringify(error);
        alert(`Lỗi tải dữ liệu kho: ${message}`);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInventory(true);
  }, []);

  if (currentUser?.role !== "admin") {
    return (
      <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-6">
        Chỉ admin mới được quản lý kho.
      </div>
    );
  }

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
      await loadInventory();
      alert("Đã thêm nguyên liệu mới.");
    } catch (error) {
      console.error("Lỗi thêm nguyên liệu:", error);
      const message =
        error instanceof Error ? error.message : JSON.stringify(error);
      alert(`Có lỗi khi thêm nguyên liệu: ${message}`);
    }
  };

  const openEditIngredient = (item: IngredientRow) => {
    setEditingIngredientId(item.id);
    setEditForm({
      name: item.name,
      unit: item.unit,
      minStock: String(item.min_stock),
    });
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
      setEditForm(emptyEditForm);
      await loadInventory();
      alert("Đã lưu cấu hình nguyên liệu.");
    } catch (error) {
      console.error("Lỗi cập nhật nguyên liệu:", error);
      const message =
        error instanceof Error ? error.message : JSON.stringify(error);
      alert(`Có lỗi khi cập nhật nguyên liệu: ${message}`);
    }
  };

  const openStockUpdate = (item: IngredientRow) => {
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
      await loadInventory();
      alert("Đã cập nhật tồn kho.");
    } catch (error) {
      console.error("Lỗi cập nhật tồn kho:", error);
      const message =
        error instanceof Error ? error.message : JSON.stringify(error);
      alert(`Có lỗi khi cập nhật tồn kho: ${message}`);
    }
  };

  const updateReceiptLine = (
    lineId: string,
    field: keyof ReceiptLine,
    value: string
  ) => {
    setReceiptLines((prev) =>
      prev.map((line) =>
        line.lineId === lineId ? { ...line, [field]: value } : line
      )
    );
  };

  const addReceiptLine = () => {
    setReceiptLines((prev) => [...prev, createEmptyReceiptLine()]);
  };

  const removeReceiptLine = (lineId: string) => {
    setReceiptLines((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((line) => line.lineId !== lineId);
    });
  };

  const receiptPreview = useMemo(() => {
    return receiptLines.map((line) => {
      const ingredient = ingredients.find((item) => item.id === line.ingredientId);
      const quantity = Number(line.quantity || 0);
      const unitCost = Number(line.unitCost || 0);
      const totalCost = quantity * unitCost;

      return {
        ...line,
        ingredient,
        quantity,
        unitCost,
        totalCost,
      };
    });
  }, [receiptLines, ingredients]);

  const receiptGrandTotal = useMemo(() => {
    return receiptPreview.reduce((sum, line) => sum + line.totalCost, 0);
  }, [receiptPreview]);

  const submitReceipt = async (e: React.FormEvent) => {
    e.preventDefault();

    const validLines = receiptPreview.filter(
      (line) => line.ingredient && line.quantity > 0 && line.unitCost >= 0
    );

    if (validLines.length === 0) {
      alert("Vui lòng nhập ít nhất 1 nguyên liệu hợp lệ.");
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

      for (const line of validLines) {
        const ingredient = line.ingredient;
        if (!ingredient) continue;

        const previousQuantity = Number(ingredient.quantity || 0);
        const newQuantity = previousQuantity + line.quantity;

        await addStockReceiptToSupabase({
          id: `${receiptGroupCode}-${ingredient.id}`,
          ingredient_id: ingredient.id,
          ingredient_name: ingredient.name,
          quantity_added: line.quantity,
          unit_cost: line.unitCost,
          total_cost: line.totalCost,
          note: receiptNote,
          received_by: currentUser?.fullName || "Quản trị viên",
          created_at: createdAt,
        });

        await updateIngredientInSupabase(ingredient.id, {
          name: ingredient.name,
          unit: ingredient.unit,
          quantity: newQuantity,
          cost: line.unitCost,
          min_stock: ingredient.min_stock,
        });

        await addInventoryLogToSupabase({
          id: `inventory-log-${Date.now()}-${ingredient.id}`,
          ingredient_id: ingredient.id,
          ingredient_name: ingredient.name,
          previous_quantity: previousQuantity,
          new_quantity: newQuantity,
          difference: line.quantity,
          note: `Nhập kho: ${receiptNote}`,
          updated_by: currentUser?.fullName || "Quản trị viên",
          created_at: createdAt,
        });
      }

      setReceiptLines([createEmptyReceiptLine()]);
      setReceiptNote("Nhập hàng");
      await loadInventory();
      alert("Đã ghi nhận phiếu nhập kho nhiều nguyên liệu.");
    } catch (error) {
      console.error("Lỗi nhập kho:", error);
      const message =
        error instanceof Error ? error.message : JSON.stringify(error);
      alert(`Có lỗi khi nhập kho: ${message}`);
    } finally {
      setSubmittingReceipt(false);
    }
  };

  const handleDeleteIngredient = async (id: string) => {
    const ok = confirm("Bạn có chắc muốn xóa nguyên liệu này?");
    if (!ok) return;

    try {
      await deleteIngredientInSupabase(id);
      await loadInventory();
      alert("Đã xóa nguyên liệu.");
    } catch (error) {
      console.error("Lỗi xóa nguyên liệu:", error);
      const message =
        error instanceof Error ? error.message : JSON.stringify(error);
      alert(`Có lỗi khi xóa nguyên liệu: ${message}`);
    }
  };

  const filteredStockReceipts = useMemo(() => {
    let result = [...stockReceipts];

    if (receiptFilterPreset !== "all") {
      result = result.filter((item) => isInPreset(item.created_at, receiptFilterPreset));
    }

    if (receiptFilterDate) {
      result = result.filter(
        (item) => getDateInputValue(new Date(item.created_at)) === receiptFilterDate
      );
    }

    return result;
  }, [stockReceipts, receiptFilterPreset, receiptFilterDate]);

  const totalImportValue = useMemo(
    () =>
      filteredStockReceipts.reduce(
        (sum, item) => sum + Number(item.total_cost || 0),
        0
      ),
    [filteredStockReceipts]
  );

  const totalImportTimes = useMemo(() => {
    const receiptPrefixes = new Set(
      filteredStockReceipts.map((item) => item.id.split("-").slice(0, 2).join("-"))
    );
    return receiptPrefixes.size;
  }, [filteredStockReceipts]);

  const printReceipt = (receipt: StockReceiptRow) => {
    const receiptPrefix = receipt.id.split("-").slice(0, 2).join("-");
    const sameReceiptItems = stockReceipts.filter((item) =>
      item.id.startsWith(receiptPrefix)
    );

    const grandTotal = sameReceiptItems.reduce(
      (sum, item) => sum + Number(item.total_cost || 0),
      0
    );

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    const rowsHtml = sameReceiptItems
      .map(
        (item) => `
          <tr>
            <td>${item.ingredient_name}</td>
            <td>${item.quantity_added}</td>
            <td>${formatCurrency(item.unit_cost)}</td>
            <td>${formatCurrency(item.total_cost)}</td>
          </tr>
        `
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Phieu nhap kho - ${receiptPrefix}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #1f2937; }
            .wrap { max-width: 900px; margin: 0 auto; }
            h1 { margin-bottom: 8px; }
            .muted { color: #64748b; margin-bottom: 24px; }
            .box { border: 1px solid #d7e2d5; border-radius: 16px; padding: 20px; margin-bottom: 20px; }
            .row { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 12px; }
            .label { color: #64748b; font-size: 14px; }
            .value { font-weight: 600; font-size: 16px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #d7e2d5; padding: 12px; text-align: left; }
            th { background: #eef4ee; }
            .total { margin-top: 20px; text-align: right; font-size: 22px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="wrap">
            <h1>PHIEU NHAP KHO</h1>
            <div class="muted">He thong quan ly kho KATINAT</div>

            <div class="box">
              <div class="row">
                <div>
                  <div class="label">Ma phieu</div>
                  <div class="value">${receiptPrefix}</div>
                </div>
                <div>
                  <div class="label">Thoi gian</div>
                  <div class="value">${formatDateTime(receipt.created_at)}</div>
                </div>
              </div>

              <div class="row">
                <div>
                  <div class="label">Nguoi nhap</div>
                  <div class="value">${receipt.received_by}</div>
                </div>
                <div>
                  <div class="label">Ghi chu</div>
                  <div class="value">${receipt.note}</div>
                </div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Nguyen lieu</th>
                  <th>So luong nhap</th>
                  <th>Don gia nhap</th>
                  <th>Thanh tien</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>

            <div class="total">Tong thanh toan: ${formatCurrency(grandTotal)}</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[470px_1fr]">
        <div className="space-y-6">
          <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800">Thêm nguyên liệu</h2>
            <p className="mt-1 text-sm text-slate-500">
              Chỉ tạo danh mục nguyên liệu để dùng ở phần nhập kho phía dưới.
            </p>

            <form onSubmit={submitIngredient} className="mt-4 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Tên nguyên liệu
                </label>
                <input
                  className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none"
                  value={ingredientForm.name}
                  onChange={(e) =>
                    setIngredientForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Ví dụ: Sữa tươi"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Đơn vị
                </label>
                <input
                  className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none"
                  value={ingredientForm.unit}
                  onChange={(e) =>
                    setIngredientForm((prev) => ({ ...prev, unit: e.target.value }))
                  }
                  placeholder="Ví dụ: Lít / Kg / Chai"
                />
              </div>

              <div className="rounded-2xl border border-dashed border-[#d7e2d5] bg-[#f8fbf7] p-4 text-sm text-slate-600">
                Sau khi thêm nguyên liệu, bạn có thể nhập kho 1 hoặc nhiều nguyên liệu cùng lúc ở phần bên dưới.
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#4e6b53] px-4 py-3 font-semibold text-white hover:bg-[#3f5845]"
                >
                  <Plus size={16} />
                  Thêm
                </button>

                <button
                  type="button"
                  onClick={() => setIngredientForm(emptyIngredientForm)}
                  className="rounded-2xl border border-[#d7e2d5] bg-[#eef3ee] px-4 py-3 font-semibold text-slate-700"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800">Nhập kho nhiều nguyên liệu</h2>
            <p className="mt-1 text-sm text-slate-500">
              Trong cùng 1 phiếu nhập, bạn có thể chọn 1 hoặc nhiều nguyên liệu. Hệ thống sẽ tự cập nhật tồn kho, lịch sử nhập và lịch sử cập nhật tồn.
            </p>

            <form onSubmit={submitReceipt} className="mt-4 space-y-4">
              <div className="space-y-4">
                {receiptLines.map((line, index) => (
                  <div
                    key={line.lineId}
                    className="rounded-[20px] border border-[#d7e2d5] bg-[#f8fbf7] p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-slate-800">
                        Dòng nhập #{index + 1}
                      </h3>

                      {receiptLines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeReceiptLine(line.lineId)}
                          className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600"
                        >
                          <X size={14} />
                          Xóa dòng
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Nguyên liệu
                        </label>
                        <select
                          className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none"
                          value={line.ingredientId}
                          onChange={(e) =>
                            updateReceiptLine(line.lineId, "ingredientId", e.target.value)
                          }
                        >
                          <option value="">-- Chọn nguyên liệu --</option>
                          {ingredients.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} ({item.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Số lượng nhập
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none"
                            value={line.quantity}
                            onChange={(e) =>
                              updateReceiptLine(
                                line.lineId,
                                "quantity",
                                e.target.value.replace(/\D/g, "")
                              )
                            }
                            placeholder="Ví dụ: 10"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Đơn giá nhập
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none"
                            value={line.unitCost}
                            onChange={(e) =>
                              updateReceiptLine(
                                line.lineId,
                                "unitCost",
                                e.target.value.replace(/\D/g, "")
                              )
                            }
                            placeholder="Ví dụ: 30000"
                          />
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[#d7e2d5] bg-white p-4">
                        <div className="flex items-center justify-between text-sm text-slate-600">
                          <span>Thành tiền dòng này</span>
                          <strong className="text-slate-800">
                            {formatCurrency(
                              Number(line.quantity || 0) * Number(line.unitCost || 0)
                            )}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addReceiptLine}
                className="inline-flex items-center gap-2 rounded-2xl border border-[#d7e2d5] bg-[#eef3ee] px-4 py-3 font-semibold text-slate-700"
              >
                <Plus size={16} />
                Thêm dòng nguyên liệu
              </button>

              <div className="rounded-2xl border border-[#d7e2d5] bg-[#f7faf6] p-4">
                <div className="space-y-2">
                  {receiptPreview.map((line, index) => (
                    <div
                      key={line.lineId}
                      className="flex items-center justify-between text-sm text-slate-600"
                    >
                      <span>
                        Dòng {index + 1}: {line.ingredient?.name || "Chưa chọn nguyên liệu"}
                      </span>
                      <strong className="text-slate-800">
                        {formatCurrency(line.totalCost)}
                      </strong>
                    </div>
                  ))}
                </div>

                <div className="mt-3 border-t border-dashed border-[#d7e2d5] pt-3 flex items-center justify-between text-lg font-bold text-[#3d5643]">
                  <span>Tổng thanh toán phiếu nhập</span>
                  <strong>{formatCurrency(receiptGrandTotal)}</strong>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Ghi chú phiếu nhập
                </label>
                <input
                  className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none"
                  value={receiptNote}
                  onChange={(e) => setReceiptNote(e.target.value)}
                  placeholder="Ví dụ: Nhập từ nhà cung cấp A"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReceipt}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#4e6b53] px-4 py-3 font-semibold text-white hover:bg-[#3f5845] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <PackagePlus size={16} />
                {submittingReceipt ? "Đang ghi nhận..." : "Ghi nhận nhập kho"}
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
            <div>
  <h2 className="text-xl font-bold text-slate-800">Tồn kho hiện tại</h2>
  <p className="mt-1 text-sm text-slate-500">
    Chỉ cập nhật ở đây khi đã nhập kho hoặc khi quản lý kiểm kho thực tế cuối ngày.
  </p>
</div>

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
                  {ingredients.map((item) => (
                    <tr key={item.id} className="border-b border-[#edf1ec] text-sm">
                      <td className="px-4 py-3">{item.name}</td>
                      <td className="px-4 py-3">{item.unit}</td>
                      <td className="px-4 py-3">{item.quantity}</td>
                      <td className="px-4 py-3">{formatCurrency(item.cost)}</td>
                      <td className="px-4 py-3">{item.min_stock}</td>
                      <td className="px-4 py-3">
                        {item.quantity <= item.min_stock ? "Sắp hết" : "Ổn định"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => openEditIngredient(item)}
                            className="inline-flex items-center gap-2 rounded-2xl border border-[#d7e2d5] bg-[#eef3ee] px-3 py-2 text-sm font-semibold text-slate-700"
                          >
                            <Settings2 size={15} />
                            Cấu hình
                          </button>

                          <button
                            onClick={() => openStockUpdate(item)}
                            className="inline-flex items-center gap-2 rounded-2xl border border-[#cfe0cf] bg-[#edf5ed] px-3 py-2 text-sm font-semibold text-[#3d5643]"
                          >
                            <Save size={15} />
                            Cập nhật tồn
                          </button>

                          <button
                            onClick={() => handleDeleteIngredient(item.id)}
                            className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600"
                          >
                            <Trash2 size={15} />
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {ingredients.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                        Chưa có nguyên liệu nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {editingIngredientId && (
              <div className="mt-5 rounded-[24px] border border-[#d7e2d5] bg-[#f8fbf7] p-4">
                <h3 className="text-lg font-bold text-slate-800">Cấu hình nguyên liệu</h3>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Tên nguyên liệu
                    </label>
                    <input
                      className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Đơn vị
                    </label>
                    <input
                      className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none"
                      value={editForm.unit}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, unit: e.target.value }))
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Mức tối thiểu
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none"
                      value={editForm.minStock}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          minStock: e.target.value.replace(/\D/g, ""),
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={submitEditIngredient}
                    className="rounded-2xl bg-[#4e6b53] px-4 py-3 font-semibold text-white hover:bg-[#3f5845]"
                  >
                    Lưu cấu hình
                  </button>
                  <button
                    onClick={() => {
                      setEditingIngredientId(null);
                      setEditForm(emptyEditForm);
                    }}
                    className="rounded-2xl border border-[#d7e2d5] bg-white px-4 py-3 font-semibold text-slate-700"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}

            {stockModalId && (
              <div className="mt-5 rounded-[24px] border border-[#d7e2d5] bg-[#f8fbf7] p-4">
                <h3 className="text-lg font-bold text-slate-800">Cập nhật tồn kho</h3>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Tồn thực tế mới
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none"
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(e.target.value.replace(/\D/g, ""))}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Ghi chú
                    </label>
                    <input
                      className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none"
                      value={stockNote}
                      onChange={(e) => setStockNote(e.target.value)}
                      placeholder="Ví dụ: Kiểm kho cuối ngày"
                    />
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={submitStockUpdate}
                    className="rounded-2xl bg-[#4e6b53] px-4 py-3 font-semibold text-white hover:bg-[#3f5845]"
                  >
                    Lưu cập nhật
                  </button>
                  <button
                    onClick={() => {
                      setStockModalId(null);
                      setStockQuantity("");
                    }}
                    className="rounded-2xl border border-[#d7e2d5] bg-white px-4 py-3 font-semibold text-slate-700"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}
          </div>
<div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
  <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
    <div>
      <h2 className="text-xl font-bold text-slate-800">Bộ lọc nhập kho</h2>
      <p className="mt-1 text-sm text-slate-500">
        Bộ lọc này áp dụng cho tổng số phiếu nhập, tổng tiền nhập kho, lịch sử nhập kho và báo cáo nhập kho & giá vốn tồn kho.
      </p>
    </div>

    <div className="grid gap-3 md:grid-cols-3">
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Khoảng ngày
        </label>
        <div className="relative">
          <Filter
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <select
            className="w-full rounded-2xl border border-[#d7e2d5] py-3 pl-10 pr-4 outline-none"
            value={receiptFilterPreset}
            onChange={(e) =>
              setReceiptFilterPreset(e.target.value as ReceiptFilterPreset)
            }
          >
            <option value="all">Tất cả</option>
            <option value="today">Hôm nay</option>
            <option value="7days">7 ngày gần đây</option>
            <option value="30days">30 ngày gần đây</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Ngày cụ thể
        </label>
        <input
          type="date"
          className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none"
          value={receiptFilterDate}
          onChange={(e) => setReceiptFilterDate(e.target.value)}
        />
      </div>

      <div className="flex items-end">
        <button
          type="button"
          onClick={() => {
            setReceiptFilterPreset("all");
            setReceiptFilterDate("");
          }}
          className="w-full rounded-2xl border border-[#d7e2d5] bg-[#eef3ee] px-4 py-3 font-semibold text-slate-700"
        >
          Reset lọc
        </button>
      </div>
    </div>
  </div>
</div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Tổng số phiếu nhập</p>
              <h3 className="mt-2 text-3xl font-bold text-slate-800">{totalImportTimes}</h3>
            </div>

            <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Tổng tiền nhập kho</p>
              <h3 className="mt-2 text-3xl font-bold text-slate-800">
                {formatCurrency(totalImportValue)}
              </h3>
            </div>

            <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Nguyên liệu đang quản lý</p>
              <h3 className="mt-2 text-3xl font-bold text-slate-800">{ingredients.length}</h3>
            </div>
          </div>

          <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800">Lịch sử nhập kho</h2>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-[#eff4ef] text-left text-sm text-slate-700">
                    <th className="rounded-l-2xl px-4 py-3">Mã phiếu</th>
                    <th className="px-4 py-3">Nguyên liệu</th>
                    <th className="px-4 py-3">Số lượng nhập</th>
                    <th className="px-4 py-3">Đơn giá nhập</th>
                    <th className="px-4 py-3">Thành tiền</th>
                    <th className="px-4 py-3">Người nhập</th>
                    <th className="px-4 py-3">Thời gian</th>
                    <th className="rounded-r-2xl px-4 py-3">In phiếu</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStockReceipts.map((item) => (
                    <tr key={item.id} className="border-b border-[#edf1ec] text-sm">
                      <td className="px-4 py-3">{item.id.split("-").slice(0, 2).join("-")}</td>
                      <td className="px-4 py-3">{item.ingredient_name}</td>
                      <td className="px-4 py-3">{item.quantity_added}</td>
                      <td className="px-4 py-3">{formatCurrency(item.unit_cost)}</td>
                      <td className="px-4 py-3">{formatCurrency(item.total_cost)}</td>
                      <td className="px-4 py-3">{item.received_by}</td>
                      <td className="px-4 py-3">{formatDateTime(item.created_at)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            setSelectedReceipt(item);
                            printReceipt(item);
                          }}
                          className="inline-flex items-center gap-2 rounded-2xl border border-[#d7e2d5] bg-[#eef3ee] px-3 py-2 text-sm font-semibold text-slate-700"
                        >
                          <Printer size={15} />
                          In phiếu
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredStockReceipts.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                        Chưa có phiếu nhập kho nào theo bộ lọc hiện tại.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800">Lịch sử cập nhật tồn</h2>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-[#eff4ef] text-left text-sm text-slate-700">
                    <th className="rounded-l-2xl px-4 py-3">Nguyên liệu</th>
                    <th className="px-4 py-3">Tồn cũ</th>
                    <th className="px-4 py-3">Tồn mới</th>
                    <th className="px-4 py-3">Chênh lệch</th>
                    <th className="px-4 py-3">Ghi chú</th>
                    <th className="px-4 py-3">Người cập nhật</th>
                    <th className="rounded-r-2xl px-4 py-3">Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryLogs.map((log) => (
                    <tr key={log.id} className="border-b border-[#edf1ec] text-sm">
                      <td className="px-4 py-3">{log.ingredient_name}</td>
                      <td className="px-4 py-3">{log.previous_quantity}</td>
                      <td className="px-4 py-3">{log.new_quantity}</td>
                      <td className="px-4 py-3">{log.difference}</td>
                      <td className="px-4 py-3">{log.note}</td>
                      <td className="px-4 py-3">{log.updated_by}</td>
                      <td className="px-4 py-3">{formatDateTime(log.created_at)}</td>
                    </tr>
                  ))}

                  {inventoryLogs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                        Chưa có lịch sử cập nhật kho.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800">Báo cáo nhập kho & giá vốn tồn kho</h2>
            <p className="mt-1 text-sm text-slate-500">
              Báo cáo tổng hợp số lượng nhập, đơn giá gần nhất, giá trị tồn kho và số lần nhập.
            </p>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-[#eff4ef] text-left text-sm text-slate-700">
                    <th className="rounded-l-2xl px-4 py-3">Nguyên liệu</th>
                    <th className="px-4 py-3">Tồn hiện tại</th>
                    <th className="px-4 py-3">Giá nhập gần nhất</th>
                    <th className="px-4 py-3">Giá trị tồn kho</th>
                    <th className="px-4 py-3">Tổng SL đã nhập</th>
                    <th className="rounded-r-2xl px-4 py-3">Số phiếu nhập</th>
                  </tr>
                </thead>
                <tbody>
                  {ingredients.map((item) => {
                    const receipts = stockReceipts.filter(
                      (receipt) => receipt.ingredient_id === item.id
                    );
                    const totalQtyImported = receipts.reduce(
                      (sum, receipt) => sum + Number(receipt.quantity_added || 0),
                      0
                    );

                    const groupedReceiptCount = new Set(
                      receipts.map((receipt) => receipt.id.split("-").slice(0, 2).join("-"))
                    ).size;

                    return (
                      <tr key={item.id} className="border-b border-[#edf1ec] text-sm">
                        <td className="px-4 py-3">{item.name}</td>
                        <td className="px-4 py-3">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="px-4 py-3">{formatCurrency(item.cost)}</td>
                        <td className="px-4 py-3">
                          {formatCurrency(Number(item.quantity || 0) * Number(item.cost || 0))}
                        </td>
                        <td className="px-4 py-3">{totalQtyImported}</td>
                        <td className="px-4 py-3">{groupedReceiptCount}</td>
                      </tr>
                    );
                  })}

                  {ingredients.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                        Chưa có dữ liệu báo cáo nhập kho.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {selectedReceipt && (
            <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold text-slate-800">Phiếu nhập kho vừa chọn</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-[#d7e2d5] p-4">
                  <p className="text-sm text-slate-500">Mã phiếu</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {selectedReceipt.id.split("-").slice(0, 2).join("-")}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#d7e2d5] p-4">
                  <p className="text-sm text-slate-500">Thời gian</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {formatDateTime(selectedReceipt.created_at)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#d7e2d5] p-4">
                  <p className="text-sm text-slate-500">Người nhập</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {selectedReceipt.received_by}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#d7e2d5] p-4">
                  <p className="text-sm text-slate-500">Ghi chú</p>
                  <p className="mt-1 font-semibold text-slate-800">{selectedReceipt.note}</p>
                </div>

                <div className="rounded-2xl border border-[#d7e2d5] p-4 md:col-span-2">
                  <p className="text-sm text-slate-500">Các nguyên liệu trong phiếu</p>
                  <div className="mt-3 space-y-2">
                    {stockReceipts
                      .filter((item) =>
                        item.id.startsWith(selectedReceipt.id.split("-").slice(0, 2).join("-"))
                      )
                      .map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-xl bg-[#f7faf6] px-3 py-2 text-sm"
                        >
                          <span>
                            {item.ingredient_name} · SL {item.quantity_added}
                          </span>
                          <strong>{formatCurrency(item.total_cost)}</strong>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-[#d7e2d5] bg-[#f7faf6] p-4">
                <div className="flex items-center justify-between text-lg font-bold text-[#3d5643]">
                  <span>Tổng thanh toán</span>
                  <strong>
                    {formatCurrency(
                      stockReceipts
                        .filter((item) =>
                          item.id.startsWith(selectedReceipt.id.split("-").slice(0, 2).join("-"))
                        )
                        .reduce((sum, item) => sum + Number(item.total_cost || 0), 0)
                    )}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}