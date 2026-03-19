"use client";

import { useEffect, useState } from "react";
import { Coffee } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCafeStore } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const { login, currentUser, hydrated } = useCafeStore();

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hydrated) return;
    if (currentUser?.role === "admin") {
      router.replace("/dashboard");
    } else if (currentUser?.role === "staff") {
      router.replace("/pos");
    }
  }, [currentUser, hydrated, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = login(username, password);

    if (!result.ok) {
      setError(result.message || "Đăng nhập thất bại");
      return;
    }

    if (username === "admin") {
      router.replace("/dashboard");
    } else {
      router.replace("/pos");
    }
  };

  if (!hydrated) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f4f7f2] to-[#eaf1e8] p-6">
      <div className="w-full max-w-md rounded-[28px] border border-[#d7e2d5] bg-white/95 p-8 shadow-[0_20px_60px_rgba(44,62,47,0.1)]">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#e3ece3] text-[#4e6b53]">
          <Coffee size={28} />
        </div>

        <h1 className="text-3xl font-bold text-slate-800">KATINAT Cafe Admin</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Đăng nhập vào hệ thống quản lý quán cafe.
        </p>

        <div className="mt-5 rounded-2xl border border-[#d7e2d5] bg-[#f2f6f1] p-4 text-sm text-slate-700">
          <p><strong>Admin:</strong> admin / 123456</p>
          <p className="mt-1"><strong>Nhân viên:</strong> staff / 123456</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Tài khoản
            </label>
            <input
              className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none transition focus:border-[#4e6b53]"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tài khoản"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Mật khẩu
            </label>
            <input
              type="password"
              className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none transition focus:border-[#4e6b53]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-2xl bg-[#4e6b53] px-4 py-3 font-semibold text-white transition hover:bg-[#3f5845]"
          >
            Đăng nhập
          </button>
        </form>
      </div>
    </div>
  );
}