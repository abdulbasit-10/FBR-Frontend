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
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[#e7e7e7] dark:border-[#2e2e2e] bg-white dark:bg-[#1a1a1a] px-4 lg:px-6">
        <div className="flex items-center gap-2">
          {/* Mobile hamburger */}
          <MobileSidebar>
            <Sidebar collapsed={false} />
          </MobileSidebar>
        </div>

        <div className="flex items-center gap-3" />

        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="flex h-8 items-center gap-1.5 rounded-full border border-[#eee4d4] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] px-2 sm:px-3 text-[11px] text-[#424b56] dark:text-[#9ca3af] shadow-[0_1px_2px_rgba(0,0,0,.03)]">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-[#fff4df] dark:bg-[#2a2a2a] text-[#c39445]">
              {/* render Moon as default to match SSR; swap to Sun only after mount */}
              {mounted && theme === "dark" ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
            </span>
            <span className="hidden sm:inline">{mounted && theme === "dark" ? "Light" : "Dark"}</span>
          </button>
          {/* Notifications */}
          <button type="button" aria-label="Notifications" className="relative flex h-8 w-8 items-center justify-center rounded-full border border-[#eee4d4] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] text-[#424b56] dark:text-[#9ca3af] shadow-[0_1px_2px_rgba(0,0,0,.03)]">
            <Bell className="h-3.5 w-3.5 text-[#c39445]" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[9px] font-semibold text-white">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </button>
          <button type="button" onClick={() => setShowConfirm(true)} className="flex h-8 items-center gap-1.5 rounded-full border border-[#eee4d4] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] px-2 sm:px-3 text-[11px] text-[#424b56] dark:text-[#9ca3af] shadow-[0_1px_2px_rgba(0,0,0,.03)]">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-[#fff4df] dark:bg-[#2a2a2a] text-[#c39445]"><LogOut className="h-3 w-3" /></span>
            <span className="hidden sm:inline">Logout</span>
          </button>
          <button type="button" className="flex h-9 items-center gap-2 rounded-full bg-[#c99d54] py-0.5 pl-1 sm:pr-3 pr-1 text-left text-white shadow-sm">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[#77583a] text-[9px] font-semibold">{initials}</span>
            <span className="hidden sm:block leading-[1.05]">
              <b className="block text-[10px] font-medium">{displayName}</b>
              <small className="block text-[8px] text-white/80">{displayRole}</small>
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