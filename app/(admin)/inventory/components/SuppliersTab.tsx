"use client";

import { useState } from "react";
import { Edit2, Trash2 } from "lucide-react";
import { useInventory } from "./InventoryContext";
import {
  addSupplierToSupabase,
  updateSupplierInSupabase,
  deleteSupplierInSupabase,
} from "@/lib/db";

type SupplierForm = {
  name: string;
  contact_name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
};

const emptySupplierForm: SupplierForm = {
  name: "",
  contact_name: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
};

export default function SuppliersTab() {
  const { suppliers, stockReceipts, loadInventory } = useInventory();
  const [supplierForm, setSupplierForm] = useState<SupplierForm>(emptySupplierForm);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [supplierSearch, setSupplierSearch] = useState("");

  const filteredSuppliers = suppliers.filter((item) => {
    if (!supplierSearch.trim()) return true;
    const keyword = supplierSearch.trim().toLowerCase();
    return (
      item.name.toLowerCase().includes(keyword) ||
      (item.contact_name || "").toLowerCase().includes(keyword) ||
      (item.phone || "").toLowerCase().includes(keyword) ||
      (item.email || "").toLowerCase().includes(keyword)
    );
  });

  const submitSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.name.trim()) {
      alert("Vui lòng nhập tên nhà cung cấp.");
      return;
    }

    try {
      if (editingSupplierId) {
        await updateSupplierInSupabase(editingSupplierId, {
          ...supplierForm,
          active: true,
        });
        alert("Đã cập nhật nhà cung cấp.");
      } else {
        await addSupplierToSupabase({
          id: `supplier-${Date.now()}`,
          ...supplierForm,
          active: true,
          created_at: new Date().toISOString(),
        });
        alert("Đã thêm nhà cung cấp mới.");
      }

      setSupplierForm(emptySupplierForm);
      setEditingSupplierId(null);
      await loadInventory(false);
    } catch (error) {
      alert(`Có lỗi khi lưu nhà cung cấp: ${error}`);
    }
  };

  const editSupplier = (supplier: any) => {
    setEditingSupplierId(supplier.id);
    setSupplierForm({
      name: supplier.name,
      contact_name: supplier.contact_name || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      notes: supplier.notes || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteSupplier = async (supplier: any) => {
    const hasLinkedReceipt = stockReceipts.some((item) => item.supplier_id === supplier.id);
    if (hasLinkedReceipt) {
      alert("Không thể xóa nhà cung cấp này vì đang có phiếu nhập liên kết. Hãy chuyển dữ liệu hoặc xóa các phiếu liên quan trước.");
      return;
    }

    const ok = confirm(`Bạn có chắc muốn xóa nhà cung cấp ${supplier.name}?`);
    if (!ok) return;

    try {
      await deleteSupplierInSupabase(supplier.id);
      await loadInventory(false);
      alert("Đã xóa nhà cung cấp.");
    } catch (error) {
      alert(`Có lỗi khi xóa nhà cung cấp: ${error}`);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800">Quản lý nhà cung cấp</h2>
        <p className="mt-1 text-sm text-slate-500">Nhà cung cấp được liên kết trực tiếp với phiếu nhập, phiếu giao hàng và chứng từ thanh toán.</p>
        
        <form onSubmit={submitSupplier} className="mt-4 space-y-4">
          <input className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none" value={supplierForm.name} onChange={(e) => setSupplierForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Tên nhà cung cấp" />
          <input className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none" value={supplierForm.contact_name} onChange={(e) => setSupplierForm((prev) => ({ ...prev, contact_name: e.target.value }))} placeholder="Người liên hệ" />
          
          <div className="grid grid-cols-2 gap-3">
            <input className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none" value={supplierForm.phone} onChange={(e) => setSupplierForm((prev) => ({ ...prev, phone: e.target.value }))} placeholder="Số điện thoại" />
            <input className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none" value={supplierForm.email} onChange={(e) => setSupplierForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="Email" />
          </div>
          
          <input className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none" value={supplierForm.address} onChange={(e) => setSupplierForm((prev) => ({ ...prev, address: e.target.value }))} placeholder="Địa chỉ" />
          <textarea className="min-h-[96px] w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none" value={supplierForm.notes} onChange={(e) => setSupplierForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Ghi chú hợp đồng / thời gian giao hàng / công nợ" />
          
          <div className="flex gap-3">
            <button type="submit" className="rounded-2xl bg-[#4e6b53] px-4 py-3 font-semibold text-white hover:bg-[#3f5845]">
              {editingSupplierId ? "Cập nhật NCC" : "Thêm NCC"}
            </button>
            <button type="button" onClick={() => { setSupplierForm(emptySupplierForm); setEditingSupplierId(null); }} className="rounded-2xl border border-[#d7e2d5] bg-[#eef3ee] px-4 py-3 font-semibold text-slate-700">
              Reset
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800">Danh sách nhà cung cấp</h2>
        <div className="mt-4">
          <input className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none" value={supplierSearch} onChange={(e) => setSupplierSearch(e.target.value)} placeholder="Tìm kiếm theo Tên, SĐT, Email..." />
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-[#eff4ef] text-left text-sm text-slate-700">
                <th className="rounded-l-2xl px-4 py-3">Tên & Người liên hệ</th>
                <th className="px-4 py-3">Liên lạc</th>
                <th className="px-4 py-3">Ghi chú</th>
                <th className="rounded-r-2xl px-4 py-3">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map((item) => (
                <tr key={item.id} className="border-b border-[#edf1ec] text-sm md:text-base">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{item.name}</p>
                    {item.contact_name && <p className="text-sm text-slate-500">{item.contact_name}</p>}
                  </td>
                  <td className="px-4 py-3">
                    {item.phone && <p>{item.phone}</p>}
                    {item.email && <p className="text-slate-500">{item.email}</p>}
                  </td>
                  <td className="px-4 py-3 max-w-[200px] truncate">{item.notes || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => editSupplier(item)} className="inline-flex items-center gap-2 rounded-2xl border border-[#d7e2d5] bg-[#eef3ee] px-3 py-2 text-sm font-semibold text-slate-700"><Edit2 size={15} />Sửa</button>
                      <button onClick={() => handleDeleteSupplier(item)} className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600"><Trash2 size={15} />Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredSuppliers.length === 0 && (
            <div className="mt-4 text-center text-slate-500">Không tìm thấy nhà cung cấp nào.</div>
          )}
        </div>
      </div>
    </div>
  );
}
