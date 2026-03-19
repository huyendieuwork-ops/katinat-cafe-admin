"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Save,
  PackagePlus,
  Printer,
  Settings2,
} from "lucide-react";
import { useCafeStore } from "@/lib/store";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Ingredient, StockReceipt } from "@/lib/types";

const emptyIngredientForm = {
  name: "",
  unit: "",
};

const emptyEditForm = {
  name: "",
  unit: "",
  minStock: "",
};

export default function InventoryPage() {
  const {
    currentUser,
    data,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    updateIngredientStock,
    receiveIngredientStock,
  } = useCafeStore();

  const [ingredientForm, setIngredientForm] = useState(emptyIngredientForm);

  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyEditForm);

  const [stockModalId, setStockModalId] = useState<string | null>(null);
  const [stockQuantity, setStockQuantity] = useState("");
  const [stockNote, setStockNote] = useState("Kiểm kho cuối ngày");

  const [receiptIngredientId, setReceiptIngredientId] = useState("");
  const [receiptQuantity, setReceiptQuantity] = useState("");
  const [receiptUnitCost, setReceiptUnitCost] = useState("");
  const [receiptNote, setReceiptNote] = useState("Nhập hàng");
  const [selectedReceipt, setSelectedReceipt] = useState<StockReceipt | null>(null);

  if (currentUser?.role !== "admin") {
    return (
      <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-6">
        Chỉ admin mới được quản lý kho.
      </div>
    );
  }

  const submitIngredient = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: ingredientForm.name.trim(),
      unit: ingredientForm.unit.trim(),
      quantity: 0,
      cost: 0,
      minStock: 0,
    };

    if (!payload.name || !payload.unit) return;

    addIngredient(payload);
    setIngredientForm(emptyIngredientForm);
  };

  const openEditIngredient = (item: Ingredient) => {
    setEditingIngredientId(item.id);
    setEditForm({
      name: item.name,
      unit: item.unit,
      minStock: String(item.minStock),
    });
  };

  const submitEditIngredient = () => {
    if (!editingIngredientId) return;

    const oldItem = data.ingredients.find((item) => item.id === editingIngredientId);
    if (!oldItem) return;

    updateIngredient(editingIngredientId, {
      name: editForm.name.trim(),
      unit: editForm.unit.trim(),
      minStock: Number(editForm.minStock || 0),
      quantity: oldItem.quantity,
      cost: oldItem.cost,
    });

    setEditingIngredientId(null);
    setEditForm(emptyEditForm);
  };

  const openStockUpdate = (item: Ingredient) => {
    setStockModalId(item.id);
    setStockQuantity(String(item.quantity));
    setStockNote("Kiểm kho cuối ngày");
  };

  const submitStockUpdate = () => {
    if (!stockModalId) return;

    updateIngredientStock({
      ingredientId: stockModalId,
      newQuantity: Number(stockQuantity || 0),
      note: stockNote,
    });

    setStockModalId(null);
    setStockQuantity("");
    setStockNote("Kiểm kho cuối ngày");
  };

  const submitReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptIngredientId) return;

    receiveIngredientStock({
      ingredientId: receiptIngredientId,
      quantityAdded: Number(receiptQuantity || 0),
      unitCost: Number(receiptUnitCost || 0),
      note: receiptNote,
    });

    setReceiptIngredientId("");
    setReceiptQuantity("");
    setReceiptUnitCost("");
    setReceiptNote("Nhập hàng");
  };

  const totalImportValue = useMemo(
    () => data.stockReceipts.reduce((sum, item) => sum + item.totalCost, 0),
    [data.stockReceipts]
  );

  const totalImportTimes = data.stockReceipts.length;

  const printReceipt = (receipt: StockReceipt) => {
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Phieu nhap kho - ${receipt.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #1f2937; }
            .wrap { max-width: 800px; margin: 0 auto; }
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
                  <div class="value">${receipt.id}</div>
                </div>
                <div>
                  <div class="label">Thoi gian</div>
                  <div class="value">${formatDateTime(receipt.createdAt)}</div>
                </div>
              </div>

              <div class="row">
                <div>
                  <div class="label">Nguoi nhap</div>
                  <div class="value">${receipt.receivedBy}</div>
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
                <tr>
                  <td>${receipt.ingredientName}</td>
                  <td>${receipt.quantityAdded}</td>
                  <td>${formatCurrency(receipt.unitCost)}</td>
                  <td>${formatCurrency(receipt.totalCost)}</td>
                </tr>
              </tbody>
            </table>

            <div class="total">Tong thanh toan: ${formatCurrency(receipt.totalCost)}</div>
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
      <div className="grid gap-6 xl:grid-cols-[430px_1fr]">
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
                Sau khi thêm nguyên liệu, bạn hãy qua phần <strong>Nhập kho</strong> để ghi nhận
                số lượng nhập và đơn giá nhập. Chỉ lúc đó tồn kho hiện tại mới tăng lên.
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
            <h2 className="text-xl font-bold text-slate-800">Nhập kho</h2>
            <p className="mt-1 text-sm text-slate-500">
              Chọn nguyên liệu đã thêm, nhập số lượng và đơn giá. Hệ thống sẽ tự tính thành tiền
              và cập nhật sang tồn kho hiện tại.
            </p>

            <form onSubmit={submitReceipt} className="mt-4 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Nguyên liệu nhập kho
                </label>
                <select
                  className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none"
                  value={receiptIngredientId}
                  onChange={(e) => setReceiptIngredientId(e.target.value)}
                >
                  <option value="">-- Chọn nguyên liệu --</option>
                  {data.ingredients.map((item) => (
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
                    value={receiptQuantity}
                    onChange={(e) => setReceiptQuantity(e.target.value.replace(/\D/g, ""))}
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
                    value={receiptUnitCost}
                    onChange={(e) => setReceiptUnitCost(e.target.value.replace(/\D/g, ""))}
                    placeholder="Ví dụ: 30000"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-[#d7e2d5] bg-[#f7faf6] p-4">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Thành tiền</span>
                  <strong className="text-slate-800">
                    {formatCurrency(Number(receiptQuantity || 0) * Number(receiptUnitCost || 0))}
                  </strong>
                </div>
                <div className="mt-2 flex items-center justify-between text-lg font-bold text-[#3d5643]">
                  <span>Tổng thanh toán</span>
                  <strong>
                    {formatCurrency(Number(receiptQuantity || 0) * Number(receiptUnitCost || 0))}
                  </strong>
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
                className="inline-flex items-center gap-2 rounded-2xl bg-[#4e6b53] px-4 py-3 font-semibold text-white hover:bg-[#3f5845]"
              >
                <PackagePlus size={16} />
                Ghi nhận nhập kho
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800">Tồn kho hiện tại</h2>
            <p className="mt-1 text-sm text-slate-500">
              Chỉ cập nhật ở đây khi đã nhập kho hoặc khi quản lý kiểm kho thực tế cuối ngày.
            </p>

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
                  {data.ingredients.map((item) => (
                    <tr key={item.id} className="border-b border-[#edf1ec] text-sm">
                      <td className="px-4 py-3">{item.name}</td>
                      <td className="px-4 py-3">{item.unit}</td>
                      <td className="px-4 py-3">{item.quantity}</td>
                      <td className="px-4 py-3">{formatCurrency(item.cost)}</td>
                      <td className="px-4 py-3">{item.minStock}</td>
                      <td className="px-4 py-3">
                        {item.quantity <= item.minStock ? "Sắp hết" : "Ổn định"}
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
                            onClick={() => deleteIngredient(item.id)}
                            className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600"
                          >
                            <Trash2 size={15} />
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {data.ingredients.length === 0 && (
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
              <h3 className="mt-2 text-3xl font-bold text-slate-800">{data.ingredients.length}</h3>
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
                  {data.stockReceipts.map((item) => (
                    <tr key={item.id} className="border-b border-[#edf1ec] text-sm">
                      <td className="px-4 py-3">{item.id}</td>
                      <td className="px-4 py-3">{item.ingredientName}</td>
                      <td className="px-4 py-3">{item.quantityAdded}</td>
                      <td className="px-4 py-3">{formatCurrency(item.unitCost)}</td>
                      <td className="px-4 py-3">{formatCurrency(item.totalCost)}</td>
                      <td className="px-4 py-3">{item.receivedBy}</td>
                      <td className="px-4 py-3">{formatDateTime(item.createdAt)}</td>
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

                  {data.stockReceipts.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                        Chưa có phiếu nhập kho nào.
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
                  {data.inventoryLogs.map((log) => (
                    <tr key={log.id} className="border-b border-[#edf1ec] text-sm">
                      <td className="px-4 py-3">{log.ingredientName}</td>
                      <td className="px-4 py-3">{log.previousQuantity}</td>
                      <td className="px-4 py-3">{log.newQuantity}</td>
                      <td className="px-4 py-3">{log.difference}</td>
                      <td className="px-4 py-3">{log.note}</td>
                      <td className="px-4 py-3">{log.updatedBy}</td>
                      <td className="px-4 py-3">{formatDateTime(log.createdAt)}</td>
                    </tr>
                  ))}

                  {data.inventoryLogs.length === 0 && (
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
                  {data.ingredients.map((item) => {
                    const receipts = data.stockReceipts.filter(
                      (receipt) => receipt.ingredientId === item.id
                    );
                    const totalQtyImported = receipts.reduce(
                      (sum, receipt) => sum + receipt.quantityAdded,
                      0
                    );

                    return (
                      <tr key={item.id} className="border-b border-[#edf1ec] text-sm">
                        <td className="px-4 py-3">{item.name}</td>
                        <td className="px-4 py-3">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="px-4 py-3">{formatCurrency(item.cost)}</td>
                        <td className="px-4 py-3">
                          {formatCurrency(item.quantity * item.cost)}
                        </td>
                        <td className="px-4 py-3">{totalQtyImported}</td>
                        <td className="px-4 py-3">{receipts.length}</td>
                      </tr>
                    );
                  })}

                  {data.ingredients.length === 0 && (
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
                  <p className="mt-1 font-semibold text-slate-800">{selectedReceipt.id}</p>
                </div>
                <div className="rounded-2xl border border-[#d7e2d5] p-4">
                  <p className="text-sm text-slate-500">Thời gian</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {formatDateTime(selectedReceipt.createdAt)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#d7e2d5] p-4">
                  <p className="text-sm text-slate-500">Nguyên liệu</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {selectedReceipt.ingredientName}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#d7e2d5] p-4">
                  <p className="text-sm text-slate-500">Người nhập</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {selectedReceipt.receivedBy}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#d7e2d5] p-4">
                  <p className="text-sm text-slate-500">Số lượng nhập</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {selectedReceipt.quantityAdded}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#d7e2d5] p-4">
                  <p className="text-sm text-slate-500">Đơn giá nhập</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {formatCurrency(selectedReceipt.unitCost)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#d7e2d5] p-4 md:col-span-2">
                  <p className="text-sm text-slate-500">Ghi chú</p>
                  <p className="mt-1 font-semibold text-slate-800">{selectedReceipt.note}</p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-[#d7e2d5] bg-[#f7faf6] p-4">
                <div className="flex items-center justify-between text-lg font-bold text-[#3d5643]">
                  <span>Tổng thanh toán</span>
                  <strong>{formatCurrency(selectedReceipt.totalCost)}</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}