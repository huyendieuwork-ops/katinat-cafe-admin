"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Coffee,
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  Receipt,
  LogOut,
  ShieldCheck,
  User,
  Users,
  Table2,
  Menu,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useCafeStore } from "@/lib/store";

const adminNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Sản phẩm", icon: Package },
  { href: "/inventory", label: "Kho", icon: Warehouse },
  { href: "/orders", label: "Đơn hàng", icon: Receipt },
  { href: "/customers", label: "Khách hàng", icon: Users },
  { href: "/tables", label: "Bàn", icon: Table2 },
];

const staffNav = [
  { href: "/pos", label: "POS", icon: ShoppingCart },
  { href: "/orders", label: "Đơn hàng", icon: Receipt },
  { href: "/customers", label: "Khách hàng", icon: Users },
  { href: "/tables", label: "Bàn", icon: Table2 },
];

function getPageTitle(pathname: string) {
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname === "/products") return "Sản phẩm";
  if (pathname === "/inventory") return "Kho";
  if (pathname === "/orders") return "Đơn hàng";
  if (pathname === "/customers") return "Khách hàng";
  if (pathname === "/tables") return "Bàn";
  if (pathname === "/pos") return "POS";
  return "Katinat Admin";
}

function getPageDescription(pathname: string) {
  if (pathname === "/dashboard") return "Theo dõi tổng quan doanh thu, đơn hàng và vận hành quán.";
  if (pathname === "/products") return "Quản lý sản phẩm hiển thị tại cửa hàng và POS.";
  if (pathname === "/inventory") return "Theo dõi nguyên liệu, tồn kho và nhập hàng.";
  if (pathname === "/orders") return "Danh sách đơn hàng được tạo từ POS.";
  if (pathname === "/customers") return "Thông tin khách hàng được cập nhật từ giao dịch.";
  if (pathname === "/tables") return "Quản lý bàn, tầng và trạng thái sử dụng.";
  if (pathname === "/pos") return "Thanh toán cho khách, chọn món và tạo đơn hàng.";
  return "Hệ thống quản lý quán cafe KATINAT";
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout, hydrated } = useCafeStore();
  const [openMobileMenu, setOpenMobileMenu] = useState(false);

  const navItems = useMemo(() => {
    if (!currentUser) return [];
    return currentUser.role === "admin" ? adminNav : staffNav;
  }, [currentUser]);

  if (!hydrated || !currentUser) return null;

  const pageTitle = getPageTitle(pathname);
  const pageDescription = getPageDescription(pathname);

  return (
    <div className="min-h-screen bg-[#f4f7f2] text-slate-800">
      <div className="flex min-h-screen">
        <aside className="hidden w-[280px] border-r border-[#d8e3d8] bg-[linear-gradient(180deg,#2f4539_0%,#24362c_100%)] p-5 text-white lg:flex lg:flex-col">
          <div>
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 shadow-sm">
                <Coffee size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold leading-tight">Katinat Admin</h1>
                <p className="text-sm text-white/70">Cafe Management</p>
              </div>
            </div>

            <div className="mb-6 rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10">
                  {currentUser.role === "admin" ? (
                    <ShieldCheck size={20} />
                  ) : (
                    <User size={20} />
                  )}
                </div>
                <div>
                  <p className="text-lg font-semibold">{currentUser.fullName}</p>
                  <p className="text-sm text-white/70">
                    {currentUser.role === "admin" ? "Admin" : "Nhân viên"} • {currentUser.username}
                  </p>
                </div>
              </div>
            </div>

            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-[17px] font-medium transition ${
                      active
                        ? "bg-white/15 shadow-sm"
                        : "text-white/90 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon size={19} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {openMobileMenu && (
          <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setOpenMobileMenu(false)}>
            <aside
              className="h-full w-[280px] bg-[linear-gradient(180deg,#2f4539_0%,#24362c_100%)] p-5 text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10">
                  <Coffee size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold leading-tight">Katinat Admin</h1>
                  <p className="text-sm text-white/70">Cafe Management</p>
                </div>
              </div>

              <div className="mb-6 rounded-[24px] border border-white/10 bg-white/8 p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10">
                    {currentUser.role === "admin" ? (
                      <ShieldCheck size={20} />
                    ) : (
                      <User size={20} />
                    )}
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{currentUser.fullName}</p>
                    <p className="text-sm text-white/70">
                      {currentUser.role === "admin" ? "Admin" : "Nhân viên"} • {currentUser.username}
                    </p>
                  </div>
                </div>
              </div>

              <nav className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpenMobileMenu(false)}
                      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-[17px] font-medium transition ${
                        active ? "bg-white/15" : "hover:bg-white/10"
                      }`}
                    >
                      <Icon size={19} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </aside>
          </div>
        )}

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-[#d8e3d8] bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-4 md:px-6 lg:px-8">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setOpenMobileMenu(true)}
                  className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#d8e3d8] bg-white text-slate-700 lg:hidden"
                >
                  <Menu size={18} />
                </button>

                <div>
                  <h2 className="text-2xl font-bold text-slate-800 md:text-3xl">{pageTitle}</h2>
                  <p className="mt-1 text-sm text-slate-500">{pageDescription}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden rounded-2xl border border-[#d8e3d8] bg-white px-4 py-3 md:block">
                  <p className="font-semibold text-slate-800">{currentUser.fullName}</p>
                  <p className="text-sm text-slate-500">
                    {currentUser.role === "admin" ? "Admin" : "Nhân viên"} • {currentUser.username}
                  </p>
                </div>

                <button
                  onClick={() => {
                    logout();
                    router.replace("/login");
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#56735a] px-4 py-3 font-semibold text-white transition hover:bg-[#47614a]"
                >
                  <LogOut size={16} />
                  Đăng xuất
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-5 md:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}