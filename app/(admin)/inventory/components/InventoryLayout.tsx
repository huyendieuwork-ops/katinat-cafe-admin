"use client";

import { useState } from "react";
import { 
  PackageSearch,
  Plus, 
  Building2, 
  PackagePlus, 
  Truck, 
  Wallet,
  ArrowUpRight,
  ClipboardCheck,
  ScrollText,
  FileText
} from "lucide-react";
import { useInventory } from "./InventoryContext";
import { formatCurrency } from "@/lib/utils";

import { OverviewTab, InventoryLogsTab } from "./MiscTabs";
import IngredientsTab from "./IngredientsTab";
import SuppliersTab from "./SuppliersTab";
import StockReceiptsTab from "./StockReceiptsTab";
import DeliveryAndPaymentsTab from "./DeliveryAndPaymentsTab";
import StockExportsTab from "./StockExportsTab";
import InventoryChecksTab from "./InventoryChecksTab";
import ReportsTab from "./ReportsTab";

type TabKey = 
  | "overview" 
  | "ingredients" 
  | "suppliers" 
  | "receipts" 
  | "deliveries_payments" 
  | "exports" 
  | "checks" 
  | "logs" 
  | "reports";

export default function InventoryLayout() {
  const { currentUser, loading, stockReceipts, ingredients } = useInventory();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  if (currentUser?.role !== "admin") {
    return <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-6">Chỉ admin mới được quản lý kho.</div>;
  }

  if (loading) {
    return <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-6 text-slate-500">Đang tải dữ liệu bộ nhớ kho...</div>;
  }

  const tabs = [
    { key: "overview", label: "Tổng quan", icon: PackageSearch },
    { key: "ingredients", label: "Nguyên vật liệu", icon: Plus },
    { key: "suppliers", label: "Nhà cung cấp", icon: Building2 },
    { key: "receipts", label: "Phiếu Nhập", icon: PackagePlus },
    { key: "exports", label: "Xuất Kho", icon: ArrowUpRight },
    { key: "checks", label: "Kiểm Kê Kho", icon: ClipboardCheck },
    { key: "deliveries_payments", label: "Giao & Thanh Toán", icon: Truck },
    { key: "logs", label: "Nhật Ký (Log)", icon: ScrollText },
    { key: "reports", label: "Báo Cáo (In)", icon: FileText },
  ] as const;

  // Header Metrics
  const totalImportTimes = new Set(stockReceipts.map(r => r.receipt_group_code)).size;
  const totalImportValue = stockReceipts.reduce((sum, item) => sum + Number(item.total_cost || 0), 0);
  const totalInventoryValue = ingredients.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.cost || 0)), 0);

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-[#d7e2d5] bg-gradient-to-br from-[#f7faf6] to-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Quản lý Kho Hiện Đại</h1>
            <p className="mt-1 text-sm text-slate-500">
              Cung cấp các công cụ đầy đủ để Nhập, Xuất, Kiểm Kê, và theo dõi dòng tiền Kho.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-4 xl:w-[760px]">
            <div className="rounded-2xl border border-[#d7e2d5] bg-white p-3 xl:p-4">
              <p className="text-xs xl:text-sm text-slate-500">Tổng phiếu nhập</p>
              <h3 className="mt-2 text-xl xl:text-2xl font-bold text-slate-800">{totalImportTimes}</h3>
            </div>
            <div className="rounded-2xl border border-[#d7e2d5] bg-white p-3 xl:p-4">
              <p className="text-xs xl:text-sm text-slate-500">Tổng tiền đã nhập</p>
              <h3 className="mt-2 text-xl xl:text-2xl font-bold text-amber-700">{formatCurrency(totalImportValue)}</h3>
            </div>
            <div className="rounded-2xl border border-[#d7e2d5] bg-white p-3 xl:p-4">
              <p className="text-xs xl:text-sm text-slate-500">Tổng nguyên liệu</p>
              <h3 className="mt-2 text-xl xl:text-2xl font-bold text-slate-800">{ingredients.length}</h3>
            </div>
            <div className="rounded-2xl border border-[#d7e2d5] bg-white p-3 xl:p-4">
              <p className="text-xs xl:text-sm text-slate-500">Giá trị lưu kho (BQGQ)</p>
              <h3 className="mt-2 text-xl xl:text-2xl font-bold text-emerald-700">{formatCurrency(totalInventoryValue)}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 xl:gap-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2.5 xl:px-4 xl:py-3 text-sm font-semibold transition ${
                active
                  ? "border-[#4e6b53] bg-[#4e6b53] text-white shadow-md"
                  : "border-[#d7e2d5] bg-white text-slate-700 hover:bg-[#f7faf6]"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="transition-all animate-in fade-in duration-300">
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "ingredients" && <IngredientsTab />}
        {activeTab === "suppliers" && <SuppliersTab />}
        {activeTab === "receipts" && <StockReceiptsTab />}
        {activeTab === "exports" && <StockExportsTab />}
        {activeTab === "checks" && <InventoryChecksTab />}
        {activeTab === "deliveries_payments" && <DeliveryAndPaymentsTab />}
        {activeTab === "logs" && <InventoryLogsTab />}
        {activeTab === "reports" && <ReportsTab />}
      </div>
    </div>
  );
}
