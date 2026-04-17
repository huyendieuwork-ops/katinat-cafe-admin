"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ReceiptText,
  Armchair,
  ShoppingCart,
  Users,
  LogOut,
  Coffee,
  ShieldCheck,
} from "lucide-react";
import { useCafeStore } from "@/lib/store";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  roles: Array<"admin" | "staff">;
};

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["admin"],
  },
  {
    href: "/products",
    label: "Sản phẩm",
    icon: Package,
    roles: ["admin"],
  },
  {
    href: "/inventory",
    label: "Kho",
    icon: Warehouse,
    roles: ["admin"],
  },
  {
    href: "/orders",
    label: "Đơn hàng",
    icon: ReceiptText,
    roles: ["admin", "staff"],
  },
  {
    href: "/tables",
    label: "Bàn",
    icon: Armchair,
    roles: ["admin", "staff"],
  },
  {
    href: "/pos",
    label: "POS",
    icon: ShoppingCart,
    roles: ["admin", "staff"],
  },
  {
    href: "/customers",
    label: "Khách hàng",
    icon: Users,
    roles: ["admin"],
  },
];

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useCafeStore();

  const role = currentUser?.role || "staff";

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-[#f5f7f3]">
      <aside className="sticky top-0 h-screen w-[280px] xl:w-[300px] shrink-0 overflow-y-auto border-r border-[#d7e2d5] bg-[linear-gradient(180deg,#1f3527_0%,#2d4833_45%,#44604a_100%)] p-5 xl:p-6 text-white flex flex-col">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-white/12 backdrop-blur">
              <Coffee size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Katinat Admin</h1>
              <p className="text-white/80">Cafe Management</p>
            </div>
          </div>

          <div className="mt-8 rounded-[24px] border border-white/10 bg-white/10 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                <ShieldCheck size={22} />
              </div>
              <div>
                <p className="text-xl font-bold">
                  {currentUser?.fullName || "Người dùng"}
                </p>
                <p className="text-white/80">
                  {role === "admin" ? "Quản trị viên" : "Nhân viên bán hàng"} •{" "}
                  {currentUser?.username || ""}
                </p>
              </div>
            </div>
          </div>

          <nav className="mt-8 space-y-2">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-[20px] px-4 py-4 text-lg font-semibold transition ${
                    active
                      ? "bg-white/18 text-white"
                      : "text-white/90 hover:bg-white/10"
                  }`}
                >
                  <Icon size={22} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-8">
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-[20px] bg-[#6f8f70] px-4 py-4 text-lg font-semibold text-white hover:bg-[#628263]"
            >
              <LogOut size={20} />
              Đăng xuất
            </button>
          </div>
        </aside>

        <main className="flex-1 w-full min-w-0 p-6 xl:p-8">{children}</main>
      </div>
  );
}