"use client";

import { useMemo, useState } from "react";
import { useCafeStore } from "@/lib/store";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default function CustomersPage() {
  const { data } = useCafeStore();
  const [keyword, setKeyword] = useState("");

  const filteredCustomers = useMemo(() => {
    return data.customers.filter((customer) => {
      const q = keyword.toLowerCase();
      return (
        customer.name.toLowerCase().includes(q) ||
        customer.phone.toLowerCase().includes(q)
      );
    });
  }, [data.customers, keyword]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Khách hàng</h1>
          <p className="mt-2 text-slate-500">
            Thông tin khách hàng được cập nhật tự động từ POS sau khi thanh toán.
          </p>
        </div>

        <input
          className="w-full max-w-md rounded-2xl border border-[#d7e2d5] bg-white px-4 py-3 outline-none"
          placeholder="Tìm tên hoặc số điện thoại"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>

      <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
        {filteredCustomers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d7e2d5] p-6 text-slate-500">
            Chưa có khách hàng nào
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-[#eff4ef] text-left text-sm text-slate-700">
                  <th className="rounded-l-2xl px-4 py-3">Tên khách</th>
                  <th className="px-4 py-3">SĐT</th>
                  <th className="px-4 py-3">Số lần mua</th>
                  <th className="px-4 py-3">Tổng chi tiêu</th>
                  <th className="px-4 py-3">Loại đơn gần nhất</th>
                  <th className="rounded-r-2xl px-4 py-3">Lần mua gần nhất</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b border-[#edf1ec] text-sm">
                    <td className="px-4 py-3 font-medium text-slate-800">{customer.name}</td>
                    <td className="px-4 py-3">{customer.phone}</td>
                    <td className="px-4 py-3">{customer.totalOrders}</td>
                    <td className="px-4 py-3">{formatCurrency(customer.totalSpent)}</td>
                    <td className="px-4 py-3">
                      {customer.lastOrderType === "dine-in" ? "Ở lại" : "Mang về"}
                    </td>
                    <td className="px-4 py-3">{formatDateTime(customer.lastOrderAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}