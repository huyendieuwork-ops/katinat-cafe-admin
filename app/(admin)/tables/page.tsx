"use client";

import { useMemo, useState } from "react";
import { useCafeStore } from "@/lib/store";
import { formatDateTime } from "@/lib/utils";

export default function TablesPage() {
  const { data, releaseTable } = useCafeStore();
  const [floorFilter, setFloorFilter] = useState<number | "all">("all");

  const filteredTables = useMemo(() => {
    if (floorFilter === "all") return data.tables;
    return data.tables.filter((table) => table.floor === floorFilter);
  }, [data.tables, floorFilter]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Quản lý bàn</h1>
          <p className="mt-2 text-slate-500">
            Khi khách chọn ở lại trong POS, bàn sẽ tự động chuyển sang trạng thái đang sử dụng.
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Lọc theo tầng
          </label>
          <select
            className="rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none"
            value={floorFilter}
            onChange={(e) =>
              setFloorFilter(e.target.value === "all" ? "all" : Number(e.target.value))
            }
          >
            <option value="all">Tất cả tầng</option>
            <option value="1">Tầng 1</option>
            <option value="2">Tầng 2</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {filteredTables.map((table) => (
          <div
            key={table.id}
            className={`rounded-[24px] border p-5 shadow-sm ${
              table.status === "occupied"
                ? "border-[#c7d8c9] bg-[#edf5ed]"
                : "border-[#d7e2d5] bg-white"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">{table.code}</h3>
                <p className="mt-1 text-sm text-slate-500">Tầng {table.floor}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  table.status === "occupied"
                    ? "bg-[#d7ead8] text-[#36513d]"
                    : "bg-[#eef2ef] text-slate-600"
                }`}
              >
                {table.status === "occupied" ? "Đang có khách" : "Trống"}
              </span>
            </div>

            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>Sức chứa: {table.seats} chỗ</p>
              <p>Khách hiện tại: {table.currentCustomerName || "-"}</p>
              <p>Mã đơn: {table.currentOrderId || "-"}</p>
              <p>
                Giờ vào bàn: {table.occupiedAt ? formatDateTime(table.occupiedAt) : "-"}
              </p>
            </div>

            {table.status === "occupied" && (
              <button
                onClick={() => releaseTable(table.id)}
                className="mt-4 w-full rounded-2xl bg-[#4e6b53] px-4 py-3 font-semibold text-white hover:bg-[#3f5845]"
              >
                Trả bàn / giải phóng bàn
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}