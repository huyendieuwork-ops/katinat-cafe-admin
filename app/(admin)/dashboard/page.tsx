"use client";

import { useEffect, useMemo, useState } from "react";
import { useCafeStore } from "@/lib/store";
import { getCafeTables, getCustomers, getOrders, getProducts } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import {
  RevenueLineChart,
  UniversityBarChart,
  CategoryPieChart,
} from "@/components/charts";

type OrderItem = {
  id: string;
  customer_name: string;
  customer_phone: string;
  is_student: boolean;
  university: string;
  voucher_name: string;
  discount_rate: number;
  subtotal: number;
  discount: number;
  final_total: number;
  items: {
    id: string;
    name: string;
    category: string;
    price: number;
    quantity: number;
  }[];
  created_at: string;
  created_by: string;
  order_type: "dine-in" | "takeaway";
  floor: number | null;
  table_id: string | null;
  table_code: string | null;
  status: "ordering" | "preparing" | "served" | "paid" | "cancelled";
  paid_at: string | null;
};

type CustomerItem = {
  id: string;
  name: string;
  phone: string;
  total_orders: number;
  total_spent: number;
  last_order_at: string | null;
  last_order_type: string | null;
  created_at: string;
};

type CafeTableItem = {
  id: string;
  code: string;
  floor: number;
  seats: number;
  status: string;
  current_order_id: string | null;
  current_customer_name: string | null;
  occupied_at: string | null;
};

type ProductItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image: string;
  description: string;
  active: boolean;
};

function getDateKey(input: string | Date) {
  const d = new Date(input);
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getStartDateByDays(days: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (days - 1));
  return d;
}

export default function DashboardPage() {
  const { currentUser } = useCafeStore();

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [tables, setTables] = useState<CafeTableItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadDashboard(showAlert = false) {
    try {
      setLoading(true);
      const [ordersData, customersData, tablesData, productsData] = await Promise.all([
        getOrders(),
        getCustomers(),
        getCafeTables(),
        getProducts(),
      ]);

      setOrders((ordersData || []) as OrderItem[]);
      setCustomers((customersData || []) as CustomerItem[]);
      setTables((tablesData || []) as CafeTableItem[]);
      setProducts((productsData || []) as ProductItem[]);
    } catch (error) {
      console.error("Lỗi tải dashboard:", error);
      if (showAlert) {
        const message =
          error instanceof Error ? error.message : JSON.stringify(error);
        alert(`Lỗi tải dashboard: ${message}`);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard(true);
  }, []);

  const paidOrders = useMemo(
    () => orders.filter((order) => order.status === "paid"),
    [orders]
  );

  const totalRevenue = useMemo(
    () => paidOrders.reduce((sum, order) => sum + Number(order.final_total || 0), 0),
    [paidOrders]
  );

  function revenueByDays(days: number) {
    const start = getStartDateByDays(days);
    return paidOrders
      .filter((order) => order.paid_at && new Date(order.paid_at) >= start)
      .reduce((sum, order) => sum + Number(order.final_total || 0), 0);
  }

  const revenue7 = revenueByDays(7);
  const revenue30 = revenueByDays(30);
  const revenue60 = revenueByDays(60);
  const revenue90 = revenueByDays(90);

  const occupiedTables = useMemo(
    () => tables.filter((table) => table.status === "occupied").length,
    [tables]
  );

  const availableTables = useMemo(
    () => tables.filter((table) => table.status === "available").length,
    [tables]
  );

  const dailyRevenue30 = useMemo(() => {
    const list: { date: string; revenue: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = getDateKey(d);

      const revenue = paidOrders
        .filter((order) => order.paid_at && getDateKey(order.paid_at) === key)
        .reduce((sum, order) => sum + Number(order.final_total || 0), 0);

      list.push({
        date: `${String(d.getDate()).padStart(2, "0")}/${String(
          d.getMonth() + 1
        ).padStart(2, "0")}`,
        revenue,
      });
    }
    return list;
  }, [paidOrders]);

  const universityStats = useMemo(() => {
    const map = new Map<string, { university: string; count: number; revenue: number }>();

    paidOrders.forEach((order) => {
      if (order.is_student && order.university) {
        const key = order.university;
        const existing = map.get(key) || { university: key, count: 0, revenue: 0 };
        existing.count += 1;
        existing.revenue += Number(order.final_total || 0);
        map.set(key, existing);
      }
    });

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [paidOrders]);

  const categorySales = useMemo(() => {
    const map = new Map<string, number>();

    paidOrders.forEach((order) => {
      order.items.forEach((item) => {
        map.set(item.category, (map.get(item.category) || 0) + Number(item.quantity || 0));
      });
    });

    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [paidOrders]);

  const lowStockProducts = useMemo(
    () => products.filter((product) => Number(product.stock || 0) <= 10),
    [products]
  );

  if (currentUser?.role !== "admin") {
    return (
      <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-6 shadow-sm">
        Chỉ admin mới được truy cập Dashboard.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">Dashboard</h2>
            <p className="mt-2 text-slate-500">
              POS, Bàn, Đơn hàng, Khách hàng và Dashboard đang liên kết qua Supabase.
              Doanh thu chỉ tính khi đơn hàng đã thanh toán.
            </p>
          </div>

          <button
            onClick={() => loadDashboard(true)}
            className="rounded-2xl border border-[#d7e2d5] bg-[#eef3ee] px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Tải lại
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-[24px] border border-dashed border-[#d7e2d5] bg-white p-6 text-slate-500">
          Đang tải dữ liệu dashboard từ Supabase...
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Tổng doanh thu</p>
              <h3 className="mt-2 text-3xl font-bold text-slate-800">
                {formatCurrency(totalRevenue)}
              </h3>
            </div>

            <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Doanh thu 7 ngày</p>
              <h3 className="mt-2 text-3xl font-bold text-slate-800">
                {formatCurrency(revenue7)}
              </h3>
            </div>

            <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Bàn đang có khách</p>
              <h3 className="mt-2 text-3xl font-bold text-slate-800">{occupiedTables}</h3>
            </div>

            <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Bàn trống</p>
              <h3 className="mt-2 text-3xl font-bold text-slate-800">{availableTables}</h3>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Doanh thu 30 ngày</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-800">
                {formatCurrency(revenue30)}
              </h3>
            </div>

            <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Doanh thu 60 ngày</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-800">
                {formatCurrency(revenue60)}
              </h3>
            </div>

            <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Doanh thu 90 ngày</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-800">
                {formatCurrency(revenue90)}
              </h3>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
              <h3 className="text-xl font-bold text-slate-800">Biểu đồ doanh thu 30 ngày</h3>
              <div className="mt-4">
                <RevenueLineChart data={dailyRevenue30} />
              </div>
            </div>

            <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
              <h3 className="text-xl font-bold text-slate-800">
                Sinh viên đến từ trường nào nhiều nhất
              </h3>
              <div className="mt-4">
                <UniversityBarChart data={universityStats} />
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
              <h3 className="text-xl font-bold text-slate-800">Tỷ trọng danh mục bán chạy</h3>
              <div className="mt-4">
                <CategoryPieChart data={categorySales} />
              </div>
            </div>

            <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
              <h3 className="text-xl font-bold text-slate-800">Sản phẩm sắp hết hàng</h3>
              <div className="mt-4 space-y-3">
                {lowStockProducts.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#d7e2d5] p-4 text-slate-500">
                    Hiện chưa có sản phẩm nào sắp hết.
                  </div>
                ) : (
                  lowStockProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between rounded-2xl border border-[#d7e2d5] p-4"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">{product.name}</p>
                        <p className="text-sm text-slate-500">{product.category}</p>
                      </div>
                      <strong className="text-red-600">Tồn: {product.stock}</strong>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}