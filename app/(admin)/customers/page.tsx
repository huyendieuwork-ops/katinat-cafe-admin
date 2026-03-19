"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, Search, Save, X } from "lucide-react";
import { useCafeStore } from "@/lib/store";
import {
  deleteCustomerInSupabase,
  getCustomers,
  updateCustomerInSupabase,
} from "@/lib/db";
import { formatCurrency, formatDateTime } from "@/lib/utils";

type SupabaseCustomer = {
  id: string;
  name: string;
  phone: string;
  total_orders: number;
  total_spent: number;
  last_order_at: string | null;
  last_order_type: string | null;
  created_at: string;
};

const emptyEditForm = {
  name: "",
  phone: "",
  total_orders: "0",
  total_spent: "0",
  last_order_type: "takeaway",
};

export default function CustomersPage() {
  const { currentUser } = useCafeStore();

  const [customers, setCustomers] = useState<SupabaseCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState(emptyEditForm);

  async function loadCustomers(showAlert = false) {
    try {
      setLoading(true);
      const data = await getCustomers();
      setCustomers(data || []);
    } catch (error) {
      console.error("Lỗi tải khách hàng từ Supabase:", error);
      if (showAlert) {
        const message =
          error instanceof Error ? error.message : JSON.stringify(error);
        alert(`Lỗi tải khách hàng từ Supabase: ${message}`);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers(true);
  }, []);

  if (currentUser?.role !== "admin") {
    return (
      <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-6 shadow-sm">
        Chỉ admin mới được quản lý khách hàng.
      </div>
    );
  }

  const filteredCustomers = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return customers;

    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(q) ||
        customer.phone.toLowerCase().includes(q)
    );
  }, [customers, keyword]);

  const startEdit = (customer: SupabaseCustomer) => {
    setEditingId(customer.id);
    setEditForm({
      name: customer.name,
      phone: customer.phone,
      total_orders: String(customer.total_orders),
      total_spent: String(customer.total_spent),
      last_order_type: customer.last_order_type || "takeaway",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(emptyEditForm);
  };

  const saveEdit = async () => {
    if (!editingId) return;

    if (!editForm.name.trim()) {
      alert("Vui lòng nhập tên khách hàng.");
      return;
    }

    if (!editForm.phone.trim()) {
      alert("Vui lòng nhập số điện thoại.");
      return;
    }

    try {
      setSaving(true);

      await updateCustomerInSupabase(editingId, {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        total_orders: Number(editForm.total_orders || 0),
        total_spent: Number(editForm.total_spent || 0),
        last_order_at: new Date().toISOString(),
        last_order_type: editForm.last_order_type || "takeaway",
      });

      await loadCustomers();
      cancelEdit();
      alert("Cập nhật khách hàng thành công.");
    } catch (error) {
      console.error("Lỗi cập nhật khách hàng:", error);
      const message =
        error instanceof Error ? error.message : JSON.stringify(error);
      alert(`Có lỗi khi cập nhật khách hàng: ${message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = confirm("Bạn có chắc muốn xóa khách hàng này?");
    if (!ok) return;

    try {
      await deleteCustomerInSupabase(id);
      await loadCustomers();
      if (editingId === id) cancelEdit();
      alert("Xóa khách hàng thành công.");
    } catch (error) {
      console.error("Lỗi xóa khách hàng:", error);
      const message =
        error instanceof Error ? error.message : JSON.stringify(error);
      alert(`Có lỗi khi xóa khách hàng: ${message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">Khách hàng</h2>
            <p className="mt-2 text-slate-500">
              Danh sách này được tạo tự động từ POS/đơn hàng khi khách để lại thông tin và đơn đã thanh toán.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:w-[360px]">
            <label className="text-sm font-semibold text-slate-700">
              Tìm theo tên hoặc số điện thoại
            </label>
            <div className="flex items-center gap-2 rounded-2xl border border-[#d7e2d5] px-4 py-3">
              <Search size={18} className="text-slate-400" />
              <input
                className="w-full bg-transparent outline-none"
                placeholder="Nhập tên hoặc số điện thoại"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {editingId && (
        <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
          <h3 className="text-xl font-bold text-slate-800">Chỉnh sửa khách hàng</h3>
          <p className="mt-1 text-sm text-slate-500">
            Chỉ dùng khi cần chỉnh lại thông tin hiển thị, không phải luồng thêm khách chính.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Tên khách hàng
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
                Số điện thoại
              </label>
              <input
                className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none"
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Hình thức mua gần nhất
              </label>
              <select
                className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none"
                value={editForm.last_order_type}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    last_order_type: e.target.value,
                  }))
                }
              >
                <option value="takeaway">Mang về</option>
                <option value="dine-in">Ở lại</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Tổng số đơn
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none"
                value={editForm.total_orders}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    total_orders: e.target.value.replace(/\D/g, ""),
                  }))
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Tổng chi tiêu
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none"
                value={editForm.total_spent}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    total_spent: e.target.value.replace(/\D/g, ""),
                  }))
                }
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={saveEdit}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#4e6b53] px-4 py-3 font-semibold text-white hover:bg-[#3f5845] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Save size={16} />
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>

            <button
              onClick={cancelEdit}
              className="inline-flex items-center gap-2 rounded-2xl border border-[#d7e2d5] bg-[#eef3ee] px-4 py-3 font-semibold text-slate-700"
            >
              <X size={16} />
              Hủy
            </button>
          </div>
        </div>
      )}

      <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Danh sách khách hàng</h3>
            <p className="mt-1 text-sm text-slate-500">
              Dữ liệu đang load trực tiếp từ Supabase.
            </p>
          </div>

          <button
            onClick={() => loadCustomers(true)}
            className="rounded-2xl border border-[#d7e2d5] bg-[#eef3ee] px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Tải lại
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-dashed border-[#d7e2d5] p-6 text-slate-500">
            Đang tải dữ liệu từ Supabase...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d7e2d5] p-6 text-slate-500">
            Chưa có khách hàng nào.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="rounded-[22px] border border-[#d7e2d5] bg-white p-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h4 className="text-xl font-bold text-slate-800">
                      {customer.name || "Khách hàng"}
                    </h4>
                    <p className="mt-1 text-sm text-slate-500">
                      {customer.phone || "Chưa có số điện thoại"}
                    </p>

                    <div className="mt-4 grid gap-2 text-sm text-slate-700 md:grid-cols-2 xl:grid-cols-4">
                      <p>Tổng đơn: {customer.total_orders}</p>
                      <p>Tổng chi tiêu: {formatCurrency(Number(customer.total_spent || 0))}</p>
                      <p>
                        Hình thức gần nhất:{" "}
                        {customer.last_order_type === "dine-in" ? "Ở lại" : "Mang về"}
                      </p>
                      <p>
                        Cập nhật gần nhất:{" "}
                        {customer.last_order_at
                          ? formatDateTime(customer.last_order_at)
                          : "Chưa có"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(customer)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-[#d7e2d5] bg-[#eef3ee] px-3 py-2 text-sm font-semibold text-slate-700"
                    >
                      <Pencil size={15} />
                      Sửa
                    </button>

                    <button
                      onClick={() => handleDelete(customer.id)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600"
                    >
                      <Trash2 size={15} />
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}