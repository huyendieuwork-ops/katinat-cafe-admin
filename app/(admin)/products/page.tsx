"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { CATEGORY_OPTIONS } from "@/lib/constants";
import { Product } from "@/lib/types";
import { useCafeStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";

const emptyForm = {
  name: "",
  category: "Tea" as Product["category"],
  price: "",
  stock: "",
  image: "",
  description: "",
  active: true,
};

export default function ProductsPage() {
  const { currentUser, data, addProduct, updateProduct, deleteProduct } = useCafeStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  if (currentUser?.role !== "admin") {
    return (
      <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-6 shadow-sm">
        Chỉ admin mới được quản lý sản phẩm.
      </div>
    );
  }

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...form,
      name: form.name.trim(),
      image:
        form.image.trim() ||
        "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80",
      description: form.description.trim(),
      price: Number(form.price || 0),
      stock: Number(form.stock || 0),
    };

    if (!payload.name) return;

    if (editingId) {
      updateProduct(editingId, payload);
    } else {
      addProduct(payload);
    }

    resetForm();
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      stock: String(product.stock),
      image: product.image,
      description: product.description,
      active: product.active,
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800">
            {editingId ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Sản phẩm thêm ở đây sẽ hiển thị bên POS cho nhân viên bán hàng.
          </p>

          <form onSubmit={submit} className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Tên sản phẩm
              </label>
              <input
                className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ví dụ: Trà sữa matcha"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Danh mục
              </label>
              <select
                className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none"
                value={form.category}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    category: e.target.value as Product["category"],
                  }))
                }
              >
                {CATEGORY_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Giá bán
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none"
                  value={form.price}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      price: e.target.value.replace(/\D/g, ""),
                    }))
                  }
                  placeholder="Ví dụ: 49000"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Tồn kho
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none"
                  value={form.stock}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      stock: e.target.value.replace(/\D/g, ""),
                    }))
                  }
                  placeholder="Ví dụ: 100"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Ảnh sản phẩm (URL)
              </label>
              <input
                className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none"
                value={form.image}
                onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Mô tả
              </label>
              <textarea
                rows={4}
                className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none"
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </div>

            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, active: e.target.checked }))
                }
              />
              Đang kinh doanh
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#4e6b53] px-4 py-3 font-semibold text-white hover:bg-[#3f5845]"
              >
                <Plus size={16} />
                {editingId ? "Cập nhật sản phẩm" : "Thêm sản phẩm"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-2xl border border-[#d7e2d5] bg-[#eef3ee] px-4 py-3 font-semibold text-slate-700"
              >
                Reset form
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800">Danh sách sản phẩm</h2>
          <p className="mt-1 text-sm text-slate-500">
            Admin quản lý sản phẩm tại đây, nhân viên sẽ thấy các món này ở POS.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.products.map((product) => (
              <div
                key={product.id}
                className="overflow-hidden rounded-[22px] border border-[#d7e2d5] bg-white"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-48 w-full object-cover"
                />
                <div className="p-4">
                  <span className="inline-flex rounded-full bg-[#e4ece3] px-3 py-1 text-xs font-semibold text-[#3d5643]">
                    {product.category}
                  </span>

                  <h3 className="mt-3 text-xl font-bold text-slate-800">{product.name}</h3>

                  <p className="mt-2 min-h-[42px] text-sm text-slate-500">
                    {product.description || "Chưa có mô tả"}
                  </p>

                  <div className="mt-3 flex items-center justify-between text-sm">
                    <strong className="text-slate-800">{formatCurrency(product.price)}</strong>
                    <span className="text-slate-500">Tồn: {product.stock}</span>
                  </div>

                  <div className="mt-2 text-sm font-semibold text-[#4e6b53]">
                    {product.active ? "Đang bán" : "Ngưng bán"}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-[#d7e2d5] bg-[#eef3ee] px-3 py-2 text-sm font-semibold text-slate-700"
                    >
                      <Pencil size={15} />
                      Sửa
                    </button>

                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600"
                    >
                      <Trash2 size={15} />
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {data.products.length === 0 && (
              <div className="rounded-[22px] border border-dashed border-[#d7e2d5] p-6 text-slate-500">
                Chưa có sản phẩm nào.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}