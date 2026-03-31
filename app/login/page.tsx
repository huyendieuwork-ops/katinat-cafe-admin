"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Coffee, Lock, User2 } from "lucide-react";
import { useCafeStore } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useCafeStore();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("Login attempt at:", typeof window !== "undefined" ? window.location.origin : "SSR");
      const result = login(username, password);

      if (!result.ok) {
        alert(result.message || "Đăng nhập thất bại.");
        return;
      }

      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f4f7f2_0%,#e8efe6_100%)] px-4 py-10">
      <div className="mx-auto flex min-h-[85vh] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[32px] border border-[#d7e2d5] bg-white shadow-[0_20px_80px_rgba(61,86,67,0.10)] lg:grid-cols-2">
          <div className="hidden bg-[linear-gradient(135deg,#1f3527_0%,#2f4935_45%,#4e6b53_100%)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/12 backdrop-blur">
                <Coffee size={30} />
              </div>
              <h1 className="mt-6 text-4xl font-bold leading-tight">
                KATINAT
                <br />
                Cafe Admin
              </h1>
              <p className="mt-4 max-w-md text-sm leading-7 text-white/80">
                Hệ thống quản lý quán cafe đồng bộ sản phẩm, POS, bàn, khách hàng,
                đơn hàng, kho và dashboard theo thời gian thực.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/8 p-6 backdrop-blur">
              <p className="text-sm uppercase tracking-[0.25em] text-white/60">
                Olive green concept
              </p>
              <p className="mt-3 text-xl font-semibold">
                Giao diện tối giản, thực tế, dễ dùng cho admin và nhân viên.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center p-6 sm:p-10">
            <div className="w-full max-w-md">
              <div className="mb-8">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#4e6b53]">
                  Đăng nhập hệ thống
                </p>
                <h2 className="mt-3 text-4xl font-bold text-slate-800">
                  Chào mừng quay lại
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-500">
                  Nhập tài khoản để truy cập hệ thống quản lý quán cafe.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Username
                  </label>
                  <div className="flex items-center gap-3 rounded-2xl border border-[#d7e2d5] px-4 py-3">
                    <User2 size={18} className="text-slate-400" />
                    <input
                      className="w-full bg-transparent outline-none"
                      placeholder="Nhập username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Password
                  </label>
                  <div className="flex items-center gap-3 rounded-2xl border border-[#d7e2d5] px-4 py-3">
                    <Lock size={18} className="text-slate-400" />
                    <input
                      type="password"
                      className="w-full bg-transparent outline-none"
                      placeholder="Nhập password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-[#4e6b53] px-4 py-3 font-semibold text-white transition hover:bg-[#3f5845] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}