"use client";

import { DollarSign, Receipt, TrendingUp, School, Clock3, Warehouse } from "lucide-react";
import { useCafeStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { RevenueLineChart, UniversityBarChart, CategoryPieChart } from "@/components/charts";

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-[24px] border border-[#d7e2d5] bg-white/90 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <h3 className="mt-2 text-3xl font-bold text-slate-800">{value}</h3>
          {subtitle && <p className="mt-2 text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div className="rounded-2xl bg-[#e4ece3] p-3 text-[#4e6b53]">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const {
    currentUser,
    totalRevenue,
    data,
    revenue7,
    revenue30,
    revenue60,
    revenue90,
    dailyRevenue30,
    universityStats,
    categorySales,
    lowStockIngredients,
  } = useCafeStore();

  if (currentUser?.role !== "admin") {
    return (
      <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-6">
        Chỉ admin mới được truy cập Dashboard.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Dashboard tổng quan</h1>
        <p className="mt-2 text-slate-500">
          Theo dõi doanh thu, đơn hàng, voucher sinh viên và hiệu quả bán hàng theo thời gian thực.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        <StatCard
          title="Tổng doanh thu"
          value={formatCurrency(totalRevenue)}
          subtitle="Toàn bộ đơn hàng"
          icon={DollarSign}
        />
        <StatCard
          title="Tổng đơn hàng"
          value={data.orders.length}
          subtitle="Đơn đã thanh toán"
          icon={Receipt}
        />
        <StatCard
          title="Doanh thu 7 ngày"
          value={formatCurrency(revenue7)}
          subtitle="Cập nhật realtime"
          icon={TrendingUp}
        />
        <StatCard
          title="Trường mua nhiều nhất"
          value={universityStats[0]?.university || "Chưa có dữ liệu"}
          subtitle={`${universityStats[0]?.count || 0} lượt mua`}
          icon={School}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        <StatCard title="Doanh thu 30 ngày" value={formatCurrency(revenue30)} icon={Clock3} />
        <StatCard title="Doanh thu 60 ngày" value={formatCurrency(revenue60)} icon={Clock3} />
        <StatCard title="Doanh thu 90 ngày" value={formatCurrency(revenue90)} icon={Clock3} />
        <StatCard
          title="Nguyên liệu sắp hết"
          value={lowStockIngredients.length}
          subtitle="Cần nhập thêm"
          icon={Warehouse}
        />
      </div>

      <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800">Biểu đồ doanh thu 30 ngày gần nhất</h2>
        <p className="mt-1 text-sm text-slate-500">
          Dữ liệu lấy trực tiếp từ đơn hàng POS theo ngày thực tế.
        </p>
        <div className="mt-4 h-[320px]">
          <RevenueLineChart data={dailyRevenue30} />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
        <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800">Sinh viên theo trường đại học</h2>
          <p className="mt-1 text-sm text-slate-500">
            Số lượt mua có áp dụng voucher sinh viên 10%.
          </p>
          <div className="mt-4 h-[320px]">
            <UniversityBarChart data={universityStats} />
          </div>
        </div>

        <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800">Danh mục bán chạy</h2>
          <p className="mt-1 text-sm text-slate-500">
            Thống kê theo tổng số lượng bán ra.
          </p>
          <div className="mt-4 h-[320px]">
            <CategoryPieChart data={categorySales} />
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800">Bảng thống kê trường đại học</h2>
        <p className="mt-1 text-sm text-slate-500">
          Dashboard liên kết trực tiếp với đơn hàng thực tế.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-[#eff4ef] text-left text-sm text-slate-700">
                <th className="rounded-l-2xl px-4 py-3">Trường đại học</th>
                <th className="px-4 py-3">Số lượt mua</th>
                <th className="rounded-r-2xl px-4 py-3">Doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {universityStats.map((item) => (
                <tr key={item.university} className="border-b border-[#edf1ec] text-sm">
                  <td className="px-4 py-3">{item.university}</td>
                  <td className="px-4 py-3">{item.count}</td>
                  <td className="px-4 py-3">{formatCurrency(item.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}