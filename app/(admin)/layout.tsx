"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/adminShell";
import { useCafeStore } from "@/lib/store";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { currentUser, hydrated } = useCafeStore();

  useEffect(() => {
    if (!hydrated) return;

    if (!currentUser) {
      router.replace("/login");
    }
  }, [currentUser, hydrated, router]);

  if (!hydrated || !currentUser) return null;

  return <AdminShell>{children}</AdminShell>;
}