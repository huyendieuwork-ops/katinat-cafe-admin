"use client";

import { useState } from "react";
import { Truck, Wallet } from "lucide-react";
import { useInventory } from "./InventoryContext";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default function DeliveryAndPaymentsTab() {
  const { deliveryNotes, paymentDocuments } = useInventory();
  const [deliverySearch, setDeliverySearch] = useState("");
  const [paymentSearch, setPaymentSearch] = useState("");

  const filteredDeliveries = deliveryNotes.filter((item) => {
    if (!deliverySearch.trim()) return true;
    const keyword = deliverySearch.trim().toLowerCase();
    return (
      (item.delivery_code || "").toLowerCase().includes(keyword) ||
      (item.receipt_group_code || "").toLowerCase().includes(keyword) ||
      (item.supplier_name || "").toLowerCase().includes(keyword) ||
      (item.delivered_by || "").toLowerCase().includes(keyword)
    );
  });

  const filteredPayments = paymentDocuments.filter((item) => {
    if (!paymentSearch.trim()) return true;
    const keyword = paymentSearch.trim().toLowerCase();
    return (
      (item.payment_code || "").toLowerCase().includes(keyword) ||
      (item.receipt_group_code || "").toLowerCase().includes(keyword) ||
      (item.supplier_name || "").toLowerCase().includes(keyword) ||
      (item.payment_method || "").toLowerCase().includes(keyword)
    );
  });

  return (
    <div className="space-y-6">
      <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800"><Truck size={24} /> Danh sách phiếu giao hàng</h2>
        <div className="mt-4 mb-4">
          <input className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none" value={deliverySearch} onChange={(e) => setDeliverySearch(e.target.value)} placeholder="Tìm kiếm theo mã, người giao, nhà cung cấp..." />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-[#eff4ef] text-left text-sm text-slate-700">
                <th className="rounded-l-2xl px-4 py-3">Mã phiếu giao</th>
                <th className="px-4 py-3">Phiếu nhập l.kết</th>
                <th className="px-4 py-3">Nhà cung cấp</th>
                <th className="px-4 py-3">Người giao</th>
                <th className="px-4 py-3">Biển số xe</th>
                <th className="px-4 py-3">Thời gian giao</th>
                <th className="rounded-r-2xl px-4 py-3">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeliveries.map((item) => (
                <tr key={item.id} className="border-b border-[#edf1ec] text-sm">
                  <td className="px-4 py-3 font-semibold text-slate-800">{item.delivery_code}</td>
                  <td className="px-4 py-3 text-emerald-700">{item.receipt_group_code}</td>
                  <td className="px-4 py-3">{item.supplier_name || "-"}</td>
                  <td className="px-4 py-3">{item.delivered_by || "-"}</td>
                  <td className="px-4 py-3">{item.vehicle_number || "-"}</td>
                  <td className="px-4 py-3">{formatDateTime(item.delivered_at)}</td>
                  <td className="px-4 py-3">{item.note || "-"}</td>
                </tr>
              ))}
              {filteredDeliveries.length === 0 && (
                <tr><td colSpan={7} className="py-6 text-center text-slate-500">Không có phiếu giao hàng nào</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800"><Wallet size={24} /> Danh sách chứng từ thanh toán</h2>
        <div className="mt-4 mb-4">
          <input className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none" value={paymentSearch} onChange={(e) => setPaymentSearch(e.target.value)} placeholder="Tìm kiếm theo mã, hình thức, nhà cung cấp..." />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-[#eff4ef] text-left text-sm text-slate-700">
                <th className="rounded-l-2xl px-4 py-3">Mã chứng từ</th>
                <th className="px-4 py-3">Phiếu nhập l.kết</th>
                <th className="px-4 py-3">Nhà cung cấp</th>
                <th className="px-4 py-3">Hình thức</th>
                <th className="px-4 py-3">Số tiền</th>
                <th className="px-4 py-3">Ngày thanh toán</th>
                <th className="rounded-r-2xl px-4 py-3">Tham chiếu</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((item) => (
                <tr key={item.id} className="border-b border-[#edf1ec] text-sm">
                  <td className="px-4 py-3 font-semibold text-slate-800">{item.payment_code}</td>
                  <td className="px-4 py-3 text-emerald-700">{item.receipt_group_code}</td>
                  <td className="px-4 py-3">{item.supplier_name || "-"}</td>
                  <td className="px-4 py-3 uppercase text-xs">{item.payment_method}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{formatCurrency(item.amount)}</td>
                  <td className="px-4 py-3">{item.payment_date}</td>
                  <td className="px-4 py-3">{item.reference_number || "-"}</td>
                </tr>
              ))}
              {filteredPayments.length === 0 && (
                <tr><td colSpan={7} className="py-6 text-center text-slate-500">Không có chứng từ thanh toán nào</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
