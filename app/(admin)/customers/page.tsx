"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Trophy, Wallet, Users } from "lucide-react";
import { useCafeStore } from "@/lib/store";
import { getCustomers } from "@/lib/db";
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

export default function CustomersPage() {
  const { currentUser } = useCafeStore();

  const [customers, setCustomers] = useState<SupabaseCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");

  async function loadCustomers(showAlert = false) {
    try {
      setLoading(true);
      const data = await getCustomers();
      setCustomers((data || []) as SupabaseCustomer[]);
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
        (customer.name || "").toLowerCase().includes(q) ||
        (customer.phone || "").toLowerCase().includes(q)
    );
  }, [customers, keyword]);

  const topByOrders = useMemo(() => {
    return [...customers]
      .sort((a, b) => Number(b.total_orders || 0) - Number(a.total_orders || 0))
      .slice(0, 5);
  }, [customers]);

  const topBySpent = useMemo(() => {
    return [...customers]
      .sort((a, b) => Number(b.total_spent || 0) - Number(a.total_spent || 0))
      .slice(0, 5);
  }, [customers]);

  const totalCustomers = customers.length;
  const totalVisits = customers.reduce(
    (sum, item) => sum + Number(item.total_orders || 0),
    0
  );
  const totalCustomerRevenue = customers.reduce(
    (sum, item) => sum + Number(item.total_spent || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">Khách hàng</h2>
            <p className="mt-2 text-slate-500">
              Danh sách này được cập nhật tự động khi đơn hàng đã thanh toán và khách có để lại số điện thoại.
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

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Users className="text-[#4e6b53]" />
            <div>
              <p className="text-sm text-slate-500">Tổng khách hàng</p>
              <h3 className="text-3xl font-bold text-slate-800">{totalCustomers}</h3>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Trophy className="text-[#4e6b53]" />
            <div>
              <p className="text-sm text-slate-500">Tổng lượt ghé</p>
              <h3 className="text-3xl font-bold text-slate-800">{totalVisits}</h3>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Wallet className="text-[#4e6b53]" />
            <div>
              <p className="text-sm text-slate-500">Tổng chi tiêu khách hàng</p>
              <h3 className="text-3xl font-bold text-slate-800">
                {formatCurrency(totalCustomerRevenue)}
              </h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
          <h3 className="text-xl font-bold text-slate-800">Top khách ghé nhiều nhất</h3>
          <div className="mt-4 space-y-3">
            {topByOrders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#d7e2d5] p-4 text-slate-500">
                Chưa có dữ liệu khách hàng.
              </div>
            ) : (
              topByOrders.map((customer, index) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between rounded-2xl border border-[#d7e2d5] p-4"
                >
                  <div>
                    <p className="font-semibold text-slate-800">
                      #{index + 1} - {customer.name || "Khách hàng"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {customer.phone || "Không có số điện thoại"}
                    </p>
                  </div>
                  <strong className="text-[#3d5643]">
                    {customer.total_orders} lượt
                  </strong>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
          <h3 className="text-xl font-bold text-slate-800">Top khách chi nhiều nhất</h3>
          <div className="mt-4 space-y-3">
            {topBySpent.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#d7e2d5] p-4 text-slate-500">
                Chưa có dữ liệu khách hàng.
              </div>
            ) : (
              topBySpent.map((customer, index) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between rounded-2xl border border-[#d7e2d5] p-4"
                >
                  <div>
                    <p className="font-semibold text-slate-800">
                      #{index + 1} - {customer.name || "Khách hàng"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {customer.phone || "Không có số điện thoại"}
                    </p>
                  </div>
                  <strong className="text-[#3d5643]">
                    {formatCurrency(Number(customer.total_spent || 0))}
                  </strong>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Danh sách khách hàng</h3>
            <p className="mt-1 text-sm text-slate-500">
              Dữ liệu đang load trực tiếp từ Supabase. Tab này chỉ xem, không chỉnh sửa.
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
                      <p>Số lần ghé: {customer.total_orders}</p>
                      <p>Tổng chi tiêu: {formatCurrency(Number(customer.total_spent || 0))}</p>
                      <p>
                        Lần mua gần nhất:{" "}
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

                  <div className="rounded-2xl bg-[#eef4ee] px-4 py-2 text-sm font-semibold text-[#3d5643]">
                    Khách đã đồng bộ từ đơn thanh toán
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