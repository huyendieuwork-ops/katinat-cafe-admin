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
import { CalendarDays, Printer, RefreshCcw } from "lucide-react";

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

type RevenueGrouping = "day" | "week" | "month";
type QuickRange = "7days" | "30days" | "thisMonth" | "custom";

type RevenueSummaryRow = {
  label: string;
  startDate: string;
  endDate: string;
  orderCount: number;
  revenue: number;
};

function getDateKey(input: string | Date) {
  const d = new Date(input);
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getStartDateByDays(days: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (days - 1));
  return d;
}

function getStartOfWeek(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function getEndOfWeek(date: Date) {
  const d = getStartOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

function getStartOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function getEndOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function formatDisplayDate(dateString: string) {
  const d = new Date(dateString);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function formatDisplayMonth(date: Date) {
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}

function formatDisplayWeek(start: Date, end: Date) {
  return `${formatDisplayDate(start.toISOString())} - ${formatDisplayDate(end.toISOString())}`;
}

function safePaidDate(order: OrderItem) {
  return order.paid_at ? new Date(order.paid_at) : null;
}

export default function DashboardPage() {
  const { currentUser } = useCafeStore();

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [tables, setTables] = useState<CafeTableItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [quickRange, setQuickRange] = useState<QuickRange>("30days");
  const [reportGrouping, setReportGrouping] = useState<RevenueGrouping>("day");
  const [reportFromDate, setReportFromDate] = useState(getDateInputValue(getStartDateByDays(30)));
  const [reportToDate, setReportToDate] = useState(getDateInputValue(new Date()));

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
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        alert(`Lỗi tải dashboard: ${message}`);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard(true);
  }, []);

  useEffect(() => {
    const now = new Date();

    if (quickRange === "7days") {
      setReportFromDate(getDateInputValue(getStartDateByDays(7)));
      setReportToDate(getDateInputValue(now));
    }

    if (quickRange === "30days") {
      setReportFromDate(getDateInputValue(getStartDateByDays(30)));
      setReportToDate(getDateInputValue(now));
    }

    if (quickRange === "thisMonth") {
      setReportFromDate(getDateInputValue(getStartOfMonth(now)));
      setReportToDate(getDateInputValue(now));
    }
  }, [quickRange]);

  const paidOrders = useMemo(
    () => orders.filter((order) => order.status === "paid" && order.paid_at),
    [orders]
  );

  const totalRevenue = useMemo(
    () => paidOrders.reduce((sum, order) => sum + Number(order.final_total || 0), 0),
    [paidOrders]
  );

  const customerSpendFromPaidOrders = useMemo(() => {
    const byPhone = new Map<string, number>();

    paidOrders.forEach((order) => {
      const phone = String(order.customer_phone || "").trim();
      if (!phone) return;
      byPhone.set(phone, (byPhone.get(phone) || 0) + Number(order.final_total || 0));
    });

    return Array.from(byPhone.values()).reduce((sum, value) => sum + value, 0);
  }, [paidOrders]);

  const storedCustomerTotalSpent = useMemo(
    () => customers.reduce((sum, customer) => sum + Number(customer.total_spent || 0), 0),
    [customers]
  );

  const customerSpendDelta = Math.abs(storedCustomerTotalSpent - customerSpendFromPaidOrders);

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
        date: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
        revenue,
      });
    }
    return list;
  }, [paidOrders]);

  const monthlyRevenueRows = useMemo(() => {
    const now = new Date();
    const rows: {
      label: string;
      monthKey: string;
      revenue: number;
      orderCount: number;
    }[] = [];

    for (let i = 5; i >= 0; i--) {
      const current = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = getStartOfMonth(current);
      const end = getEndOfMonth(current);
      const monthKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;

      const rowsOfMonth = paidOrders.filter((order) => {
        const paidDate = safePaidDate(order);
        if (!paidDate) return false;
        return paidDate >= start && paidDate <= end;
      });

      rows.push({
        label: formatDisplayMonth(start),
        monthKey,
        revenue: rowsOfMonth.reduce((sum, order) => sum + Number(order.final_total || 0), 0),
        orderCount: rowsOfMonth.length,
      });
    }

    return rows;
  }, [paidOrders]);

  const monthlyRevenueChartData = useMemo(
    () => monthlyRevenueRows.map((item) => ({ date: item.label, revenue: item.revenue })),
    [monthlyRevenueRows]
  );

  const currentMonthRevenue = monthlyRevenueRows[monthlyRevenueRows.length - 1]?.revenue || 0;
  const previousMonthRevenue = monthlyRevenueRows[monthlyRevenueRows.length - 2]?.revenue || 0;
  const monthlyRevenueGrowth =
    previousMonthRevenue > 0
      ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
      : currentMonthRevenue > 0
      ? 100
      : 0;

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

  const filteredPaidOrders = useMemo(() => {
    const from = new Date(`${reportFromDate}T00:00:00`);
    const to = new Date(`${reportToDate}T23:59:59`);

    return paidOrders.filter((order) => {
      const paidDate = safePaidDate(order);
      if (!paidDate) return false;
      return paidDate >= from && paidDate <= to;
    });
  }, [paidOrders, reportFromDate, reportToDate]);

  const revenueReportRows = useMemo<RevenueSummaryRow[]>(() => {
    const map = new Map<string, RevenueSummaryRow>();

    filteredPaidOrders.forEach((order) => {
      const paidDate = safePaidDate(order);
      if (!paidDate) return;

      let key = "";
      let label = "";
      let startDate = "";
      let endDate = "";

      if (reportGrouping === "day") {
        key = getDateKey(paidDate);
        label = formatDisplayDate(paidDate.toISOString());
        startDate = key;
        endDate = key;
      }

      if (reportGrouping === "week") {
        const start = getStartOfWeek(paidDate);
        const end = getEndOfWeek(paidDate);
        key = `${getDateKey(start)}_${getDateKey(end)}`;
        label = formatDisplayWeek(start, end);
        startDate = getDateKey(start);
        endDate = getDateKey(end);
      }

      if (reportGrouping === "month") {
        const start = getStartOfMonth(paidDate);
        const end = getEndOfMonth(paidDate);
        key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
        label = formatDisplayMonth(start);
        startDate = getDateKey(start);
        endDate = getDateKey(end);
      }

      const existing = map.get(key) || {
        label,
        startDate,
        endDate,
        orderCount: 0,
        revenue: 0,
      };

      existing.orderCount += 1;
      existing.revenue += Number(order.final_total || 0);
      map.set(key, existing);
    });

    return Array.from(map.values()).sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [filteredPaidOrders, reportGrouping]);

  const reportRevenueTotal = useMemo(
    () => revenueReportRows.reduce((sum, row) => sum + row.revenue, 0),
    [revenueReportRows]
  );

  const reportOrderCount = useMemo(
    () => revenueReportRows.reduce((sum, row) => sum + row.orderCount, 0),
    [revenueReportRows]
  );

  const printRevenueReport = () => {
    const printWindow = window.open("", "_blank", "width=1100,height=800");
    if (!printWindow) return;

    const rangeLabel = `${formatDisplayDate(`${reportFromDate}T00:00:00`)} - ${formatDisplayDate(`${reportToDate}T00:00:00`)}`;
    const groupingLabel =
      reportGrouping === "day"
        ? "Theo ngày"
        : reportGrouping === "week"
        ? "Theo tuần"
        : "Theo tháng";

    const rowsHtml = revenueReportRows
      .map(
        (row, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${row.label}</td>
            <td>${formatDisplayDate(`${row.startDate}T00:00:00`)}</td>
            <td>${formatDisplayDate(`${row.endDate}T00:00:00`)}</td>
            <td>${row.orderCount}</td>
            <td>${formatCurrency(row.revenue)}</td>
          </tr>
        `
      )
      .join("");

    const monthlyRowsHtml = monthlyRevenueRows
      .map(
        (row, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${row.label}</td>
            <td>${row.orderCount}</td>
            <td>${formatCurrency(row.revenue)}</td>
          </tr>
        `
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Bao cao doanh thu</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #1f2937; }
            .wrap { max-width: 1100px; margin: 0 auto; }
            h1 { margin-bottom: 8px; }
            h2 { margin-top: 28px; }
            .muted { color: #64748b; margin-bottom: 20px; }
            .grid { display:grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap:16px; margin-bottom:20px; }
            .box { border: 1px solid #d7e2d5; border-radius: 16px; padding: 16px; }
            .label { color: #64748b; font-size: 12px; text-transform: uppercase; }
            .value { font-size: 22px; font-weight: 700; margin-top: 6px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #d7e2d5; padding: 10px 12px; text-align: left; }
            th { background: #eef4ee; }
            .footer-total { margin-top:20px; text-align:right; font-size:22px; font-weight:700; }
          </style>
        </head>
        <body>
          <div class="wrap">
            <h1>BÁO CÁO DOANH THU</h1>
            <div class="muted">Chỉ tính các đơn hàng có trạng thái đã thanh toán (paid).</div>

            <div class="grid">
              <div class="box"><div class="label">Từ ngày - đến ngày</div><div class="value">${rangeLabel}</div></div>
              <div class="box"><div class="label">Kiểu gom nhóm</div><div class="value">${groupingLabel}</div></div>
              <div class="box"><div class="label">Số đơn đã thanh toán</div><div class="value">${reportOrderCount}</div></div>
              <div class="box"><div class="label">Tổng doanh thu</div><div class="value">${formatCurrency(reportRevenueTotal)}</div></div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Kỳ báo cáo</th>
                  <th>Từ ngày</th>
                  <th>Đến ngày</th>
                  <th>Số đơn paid</th>
                  <th>Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml || `<tr><td colspan="6">Không có dữ liệu doanh thu trong khoảng thời gian đã chọn.</td></tr>`}
              </tbody>
            </table>

            <h2>SO SÁNH DOANH THU CÁC THÁNG</h2>
            <table>
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Tháng</th>
                  <th>Số đơn paid</th>
                  <th>Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                ${monthlyRowsHtml}
              </tbody>
            </table>

            <div class="footer-total">Tổng doanh thu: ${formatCurrency(reportRevenueTotal)}</div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

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
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">Dashboard</h2>
            <p className="mt-2 text-slate-500">
              Doanh thu chỉ tính từ đơn hàng đã thanh toán. Tổng chi tiêu khách hàng ở dưới cũng tính lại từ cùng nguồn để tránh lệch.
            </p>
          </div>

          <button
            onClick={() => loadDashboard(true)}
            className="inline-flex items-center gap-2 rounded-2xl border border-[#d7e2d5] bg-[#eef3ee] px-4 py-2 text-sm font-semibold text-slate-700"
          >
            <RefreshCcw size={16} />
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
              <p className="text-sm text-slate-500">Tổng chi tiêu KH (từ đơn paid)</p>
              <h3 className="mt-2 text-3xl font-bold text-slate-800">
                {formatCurrency(customerSpendFromPaidOrders)}
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

          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Doanh thu 7 ngày</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-800">
                {formatCurrency(revenue7)}
              </h3>
            </div>

            <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Doanh thu 30 ngày</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-800">
                {formatCurrency(revenue30)}
              </h3>
            </div>

            <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Doanh thu tháng này</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-800">
                {formatCurrency(currentMonthRevenue)}
              </h3>
            </div>

            <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">So với tháng trước</p>
              <h3 className={`mt-2 text-2xl font-bold ${monthlyRevenueGrowth >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {monthlyRevenueGrowth >= 0 ? "+" : ""}{monthlyRevenueGrowth.toFixed(1)}%
              </h3>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
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

            <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Lệch dữ liệu KH đã lưu</p>
              <h3 className={`mt-2 text-2xl font-bold ${customerSpendDelta === 0 ? "text-emerald-600" : "text-amber-600"}`}>
                {formatCurrency(customerSpendDelta)}
              </h3>
              <p className="mt-2 text-xs text-slate-500">
                So sánh giữa bảng customers và tổng tính lại từ orders paid.
              </p>
            </div>
          </div>

          <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Báo cáo doanh thu để in</h3>
                <p className="mt-1 text-sm text-slate-500">
                  In báo cáo theo ngày, tuần, tháng hoặc theo khoảng thời gian tùy chọn.
                </p>
              </div>

              <button
                onClick={printRevenueReport}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#4e6b53] px-4 py-3 font-semibold text-white hover:bg-[#3f5845]"
              >
                <Printer size={16} />
                In báo cáo doanh thu
              </button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Mẫu nhanh</label>
                <select
                  className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none"
                  value={quickRange}
                  onChange={(e) => setQuickRange(e.target.value as QuickRange)}
                >
                  <option value="7days">7 ngày gần đây</option>
                  <option value="30days">30 ngày gần đây</option>
                  <option value="thisMonth">Tháng này</option>
                  <option value="custom">Tùy chọn</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Gom theo</label>
                <select
                  className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none"
                  value={reportGrouping}
                  onChange={(e) => setReportGrouping(e.target.value as RevenueGrouping)}
                >
                  <option value="day">Ngày</option>
                  <option value="week">Tuần</option>
                  <option value="month">Tháng</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Từ ngày</label>
                <div className="relative">
                  <CalendarDays size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    className="w-full rounded-2xl border border-[#d7e2d5] py-3 pl-10 pr-4 outline-none"
                    value={reportFromDate}
                    onChange={(e) => {
                      setQuickRange("custom");
                      setReportFromDate(e.target.value);
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Đến ngày</label>
                <div className="relative">
                  <CalendarDays size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    className="w-full rounded-2xl border border-[#d7e2d5] py-3 pl-10 pr-4 outline-none"
                    value={reportToDate}
                    onChange={(e) => {
                      setQuickRange("custom");
                      setReportToDate(e.target.value);
                    }}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-[#d7e2d5] bg-[#f7faf6] p-4">
                <p className="text-sm text-slate-500">Tổng doanh thu kỳ chọn</p>
                <h4 className="mt-2 text-xl font-bold text-slate-800">{formatCurrency(reportRevenueTotal)}</h4>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl border border-[#d7e2d5] p-4">
                <p className="text-sm text-slate-500">Số dòng báo cáo</p>
                <p className="mt-1 text-2xl font-bold text-slate-800">{revenueReportRows.length}</p>
              </div>
              <div className="rounded-2xl border border-[#d7e2d5] p-4">
                <p className="text-sm text-slate-500">Số đơn paid</p>
                <p className="mt-1 text-2xl font-bold text-slate-800">{reportOrderCount}</p>
              </div>
              <div className="rounded-2xl border border-[#d7e2d5] p-4">
                <p className="text-sm text-slate-500">Khoảng báo cáo</p>
                <p className="mt-1 text-base font-semibold text-slate-800">
                  {formatDisplayDate(`${reportFromDate}T00:00:00`)} - {formatDisplayDate(`${reportToDate}T00:00:00`)}
                </p>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-[#eff4ef] text-left text-sm text-slate-700">
                    <th className="rounded-l-2xl px-4 py-3">Kỳ báo cáo</th>
                    <th className="px-4 py-3">Từ ngày</th>
                    <th className="px-4 py-3">Đến ngày</th>
                    <th className="px-4 py-3">Số đơn paid</th>
                    <th className="rounded-r-2xl px-4 py-3">Doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueReportRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                        Không có dữ liệu doanh thu trong khoảng thời gian đã chọn.
                      </td>
                    </tr>
                  ) : (
                    revenueReportRows.map((row) => (
                      <tr key={`${row.label}-${row.startDate}`} className="border-b border-[#edf1ec] text-sm">
                        <td className="px-4 py-3 font-semibold text-slate-800">{row.label}</td>
                        <td className="px-4 py-3">{formatDisplayDate(`${row.startDate}T00:00:00`)}</td>
                        <td className="px-4 py-3">{formatDisplayDate(`${row.endDate}T00:00:00`)}</td>
                        <td className="px-4 py-3">{row.orderCount}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{formatCurrency(row.revenue)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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
              <h3 className="text-xl font-bold text-slate-800">So sánh doanh thu các tháng</h3>
              <div className="mt-4">
                <RevenueLineChart data={monthlyRevenueChartData} />
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
            <h3 className="text-xl font-bold text-slate-800">Bảng doanh thu theo tháng (6 tháng gần nhất)</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-[#eff4ef] text-left text-sm text-slate-700">
                    <th className="rounded-l-2xl px-4 py-3">Tháng</th>
                    <th className="px-4 py-3">Số đơn paid</th>
                    <th className="rounded-r-2xl px-4 py-3">Doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyRevenueRows.map((row) => (
                    <tr key={row.monthKey} className="border-b border-[#edf1ec] text-sm">
                      <td className="px-4 py-3 font-semibold text-slate-800">{row.label}</td>
                      <td className="px-4 py-3">{row.orderCount}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{formatCurrency(row.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
              <h3 className="text-xl font-bold text-slate-800">
                Sinh viên đến từ trường nào nhiều nhất
              </h3>
              <div className="mt-4">
                <UniversityBarChart data={universityStats} />
              </div>
            </div>

            <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
              <h3 className="text-xl font-bold text-slate-800">Tỷ trọng danh mục bán chạy</h3>
              <div className="mt-4">
                <CategoryPieChart data={categorySales} />
              </div>
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
        </>
      )}
    </div>
  );
}