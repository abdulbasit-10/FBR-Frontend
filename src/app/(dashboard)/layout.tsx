"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/auth";
import { SidebarShell } from "@/components/dashboard/sidebar-shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.replace("/");
    }
  }, [router]);

  // Don't render until we know the user is authenticated (prevents flash).
  if (typeof window !== "undefined" && !auth.isAuthenticated()) {
    return null;
  }

  return <SidebarShell>{children}</SidebarShell>;
}
