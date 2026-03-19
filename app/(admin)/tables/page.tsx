"use client";

import { useEffect, useMemo, useState } from "react";
import { useCafeStore } from "@/lib/store";
import { getCafeTables } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";

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

export default function TablesPage() {
  const { currentUser } = useCafeStore();
  const [tables, setTables] = useState<CafeTableItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadTables(showAlert = false) {
    try {
      setLoading(true);
      const data = await getCafeTables();
      setTables((data || []) as CafeTableItem[]);
    } catch (error) {
      console.error("Lỗi tải bàn:", error);
      if (showAlert) {
        const message =
          error instanceof Error ? error.message : JSON.stringify(error);
        alert(`Lỗi tải bàn: ${message}`);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTables(true);
  }, []);

  const floor1 = useMemo(() => tables.filter((table) => table.floor === 1), [tables]);
  const floor2 = useMemo(() => tables.filter((table) => table.floor === 2), [tables]);

  if (currentUser?.role !== "admin" && currentUser?.role !== "staff") {
    return (
      <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-6 shadow-sm">
        Bạn không có quyền truy cập quản lý bàn.
      </div>
    );
  }

  const renderTableCard = (table: CafeTableItem) => {
    const isOccupied = table.status === "occupied";

    return (
      <div
        key={table.id}
        className={`rounded-[24px] border p-5 shadow-sm ${
          isOccupied
            ? "border-[#d9c69f] bg-[#fff8e8]"
            : "border-[#d7e2d5] bg-white"
        }`}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-800">{table.code}</h3>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              isOccupied
                ? "bg-[#f6dca6] text-[#7a5a17]"
                : "bg-[#e4ece3] text-[#3d5643]"
            }`}
          >
            {isOccupied ? "Đang có khách" : "Bàn trống"}
          </span>
        </div>

        <div className="mt-4 space-y-2 text-sm text-slate-700">
          <p>Tầng: {table.floor}</p>
          <p>Số ghế: {table.seats}</p>
          <p>Mã đơn hiện tại: {table.current_order_id || "-"}</p>
          <p>Khách hiện tại: {table.current_customer_name || "-"}</p>
          <p>
            Thời gian chiếm bàn:{" "}
            {table.occupied_at ? formatDateTime(table.occupied_at) : "-"}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">Quản lý bàn</h2>
            <p className="mt-2 text-slate-500">
              POS chọn bàn nào thì tab này cập nhật đúng bàn đó. Khi đơn được thanh toán
              hoặc hủy thì bàn tự về trạng thái trống.
            </p>
          </div>

          <button
            onClick={() => loadTables(true)}
            className="rounded-2xl border border-[#d7e2d5] bg-[#eef3ee] px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Tải lại
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-[24px] border border-dashed border-[#d7e2d5] bg-white p-6 text-slate-500">
          Đang tải dữ liệu bàn từ Supabase...
        </div>
      ) : (
        <>
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-800">Tầng 1</h3>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {floor1.map(renderTableCard)}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-800">Tầng 2</h3>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {floor2.map(renderTableCard)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}