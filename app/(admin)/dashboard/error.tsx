"use client";

import { useEffect } from "react";
import { RefreshCcw, Home } from "lucide-react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Dashboard Runtime Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-[32px] border border-[#d7e2d5] bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 text-red-600">
        <RefreshCcw size={40} className="animate-spin-once" />
      </div>
      
      <h2 className="mt-6 text-2xl font-bold text-slate-800">Đã xảy ra lỗi ứng dụng</h2>
      <p className="mt-2 text-slate-500 max-w-md mx-auto">
        Ứng dụng gặp sự cố khi tải trang Dashboard. Điều này có thể do lỗi dữ liệu hoặc vấn đề định dạng trên trình duyệt.
      </p>
      
      <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left overflow-auto max-w-lg w-full">
        <p className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">Error Detail</p>
        <p className="text-sm font-mono text-red-600 break-all">{error.message || "Unknown error"}</p>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#4e6b53] px-6 py-3 font-semibold text-white hover:bg-[#3f5845] transition"
        >
          <RefreshCcw size={18} />
          Thử lại
        </button>
        
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-2xl border border-[#d7e2d5] px-6 py-3 font-semibold text-slate-600 hover:bg-slate-50 transition"
        >
          <Home size={18} />
          Quay lại Đăng nhập
        </Link>
      </div>
    </div>
  );
}
