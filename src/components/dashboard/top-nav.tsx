"use client";

import { Bell, LogOut, Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

import { auth, type AuthUser } from "@/lib/auth";
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";
import { Sidebar } from "@/components/dashboard/sidebar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "react-toastify";
import { notificationsService } from "@/lib/services";

// Poll the unread-count endpoint on this cadence — cheap query, safe to run often.
const UNREAD_POLL_MS = 60_000;

export function TopNav() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    setMounted(true);
    setAuthUser(auth.getUser());
  }, []);

  useEffect(() => {
    if (!authUser) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await notificationsService.unreadCount();
        if (!cancelled) setUnread(res.data.count);
      } catch {
        // Silently ignore — badge stays at last known value.
      }
    };
    tick();
    const t = setInterval(tick, UNREAD_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [authUser]);

  const displayName = authUser?.name ?? "User";
  const displayRole = authUser?.role.name ?? "";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await auth.logout();
    toast.success("Logged out successfully.");
    router.push("/");
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex h-12 items-center justify-between border-b border-[#e7e7e7] dark:border-[#2e2e2e] bg-white dark:bg-[#1a1a1a] px-4 lg:px-6">
        <div className="flex items-center gap-2">
          {/* Mobile hamburger */}
          <MobileSidebar>
            <Sidebar collapsed={false} />
          </MobileSidebar>
        </div>

        <div className="flex items-center gap-3" />

        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle theme" className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e5d5b0] dark:border-[#3d3d3d] bg-transparent dark:bg-[#252525] text-[#c39445] hover:bg-[#fff4df] hover:border-[#c9a96e] dark:hover:bg-[#2f2b22] dark:hover:border-[#c39445]/40 transition-colors cursor-pointer">
            {/* render Moon as default to match SSR; swap to Sun only after mount */}
            {mounted && theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {/* Notifications */}
          <button type="button" aria-label="Notifications" className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-[#e5d5b0] dark:border-[#3d3d3d] bg-transparent dark:bg-[#252525] text-[#c39445] hover:bg-[#fff4df] hover:border-[#c9a96e] dark:hover:bg-[#2f2b22] dark:hover:border-[#c39445]/40 transition-colors cursor-pointer">
            <Bell className="h-3.5 w-3.5 text-[#c39445]" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[9px] font-semibold text-white">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </button>
          <button type="button" onClick={() => setShowConfirm(true)} aria-label="Logout" className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e5d5b0] dark:border-[#3d3d3d] bg-transparent dark:bg-[#252525] text-[#c39445] hover:bg-red-50 hover:text-red-500 hover:border-red-200 dark:hover:bg-red-950/40 dark:hover:text-red-400 dark:hover:border-red-800/50 transition-colors cursor-pointer">
            <LogOut className="h-3.5 w-3.5" />
          </button>
          <button type="button" className="flex h-8 items-center gap-2 rounded-full bg-[#c99d54] hover:bg-[#b8893d] active:bg-[#a57830] py-0.5 pl-1 sm:pr-3 pr-1 text-left text-white transition-colors cursor-pointer">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-[#77583a] text-[10px] font-bold">{initials}</span>
            <span className="hidden sm:block leading-tight">
              <b className="block text-[12px] font-semibold">{displayName}</b>
              <small className="block text-[10px] text-white/90">{displayRole}</small>
            </span>
          </button>
        </div>
      </header>


      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleLogout}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmLabel="Logout"
        cancelLabel="Cancel"
        isLoading={isLoggingOut}
        loadingLabel="Logging out…"
      />
    </>
  );
}