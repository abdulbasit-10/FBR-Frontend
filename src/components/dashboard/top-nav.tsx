"use client";

import { Bell, LogOut, Moon, Sun, CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";

import { auth, type AuthUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";
import { Sidebar } from "@/components/dashboard/sidebar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "react-toastify";
import { notificationsService, NOTIF_REFRESH_EVENT, type Notification } from "@/lib/services";

// Poll the unread-count endpoint on this cadence — cheap query, safe to run often.
const UNREAD_POLL_MS = 60_000;

const timeAgo = (iso: string): string => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const TYPE_DOT: Record<string, string> = {
  success: "bg-green-500",
  error: "bg-red-500",
  warning: "bg-amber-500",
  info: "bg-blue-500",
};

// Dropdown shows this many by default; "See more" reveals the rest of the fetched batch.
const NOTIF_PREVIEW_COUNT = 5;
const NOTIF_FETCH_LIMIT = 20;

export function TopNav() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [unread, setUnread] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifExpanded, setNotifExpanded] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setAuthUser(auth.getUser());
  }, []);

  useEffect(() => {
    if (!notifOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [notifOpen]);

  useEffect(() => {
    if (!notifOpen) return;
    const refreshList = async () => {
      try {
        const res = await notificationsService.list({ limit: NOTIF_FETCH_LIMIT });
        setNotifications(res.data.rows);
      } catch {
        // Keep showing the last known list.
      }
    };
    window.addEventListener(NOTIF_REFRESH_EVENT, refreshList);
    return () => window.removeEventListener(NOTIF_REFRESH_EVENT, refreshList);
  }, [notifOpen]);

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
    // Also refresh immediately whenever some other part of the app just performed an
    // action that creates a notification (invoice submit, purchase post, ticket resolve)
    // — otherwise the badge would only catch up on the next 60s poll or a page refresh.
    window.addEventListener(NOTIF_REFRESH_EVENT, tick);
    return () => {
      cancelled = true;
      clearInterval(t);
      window.removeEventListener(NOTIF_REFRESH_EVENT, tick);
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

  const toggleNotifications = async () => {
    const opening = !notifOpen;
    setNotifOpen(opening);
    if (!opening) return;
    setNotifExpanded(false);
    setNotifLoading(true);
    try {
      const res = await notificationsService.list({ limit: NOTIF_FETCH_LIMIT });
      setNotifications(res.data.rows);
    } catch {
      toast.error("Failed to load notifications.");
    } finally {
      setNotifLoading(false);
    }
  };

  const handleNotifClick = async (n: Notification) => {
    if (!n.isRead) {
      setNotifications((prev) => prev.map((x) => (x.uuid === n.uuid ? { ...x, isRead: true } : x)));
      setUnread((c) => Math.max(0, c - 1));
      notificationsService.markRead(n.uuid).catch(() => { });
    }
    setNotifOpen(false);
    if (n.link) router.push(n.link);
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((x) => ({ ...x, isRead: true })));
    setUnread(0);
    try {
      await notificationsService.markAllRead();
    } catch {
      toast.error("Failed to mark all as read.");
    }
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
          <div className="relative" ref={notifRef}>
            <button type="button" onClick={toggleNotifications} aria-label="Notifications" className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-[#e5d5b0] dark:border-[#3d3d3d] bg-transparent dark:bg-[#252525] text-[#c39445] hover:bg-[#fff4df] hover:border-[#c9a96e] dark:hover:bg-[#2f2b22] dark:hover:border-[#c39445]/40 transition-colors cursor-pointer">
              <Bell className="h-3.5 w-3.5 text-[#c39445]" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[9px] font-semibold text-white">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-10 z-50 w-80 rounded-xl border border-[#e5d5b0] dark:border-[#3d3d3d] bg-white dark:bg-[#1f1f1f] shadow-lg overflow-hidden">
                <div className="flex items-center justify-between border-b border-[#e7e7e7] dark:border-[#2e2e2e] px-3 py-2">
                  <span className="text-[12px] font-semibold text-[#1E293B] dark:text-[#f0f0f0]">Notifications</span>
                  {notifications.some((n) => !n.isRead) && (
                    <button type="button" onClick={handleMarkAllRead} className="flex items-center gap-1 text-[10px] font-medium text-[#c39445] hover:underline cursor-pointer">
                      <CheckCheck className="h-3 w-3" /> Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifLoading ? (
                    <div className="py-8 text-center text-[11px] text-[#9CA3AF]">Loading…</div>
                  ) : notifications.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-[#9CA3AF]">No notifications yet.</div>
                  ) : (
                    (notifExpanded ? notifications : notifications.slice(0, NOTIF_PREVIEW_COUNT)).map((n) => (
                      <button
                        key={n.uuid}
                        type="button"
                        onClick={() => handleNotifClick(n)}
                        className={cn(
                          "flex w-full items-start gap-2 border-b border-[#f3f4f6] dark:border-[#2a2a2a] px-3 py-2.5 text-left hover:bg-[#FAF6F0] dark:hover:bg-[#262626] transition-colors cursor-pointer",
                          !n.isRead && "bg-[#FBF7F0] dark:bg-[#241f14]",
                        )}
                      >
                        <span className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", TYPE_DOT[n.type] ?? "bg-neutral-400")} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[11px] font-semibold text-[#1E293B] dark:text-[#f0f0f0] truncate">{n.title}</span>
                          <span className="block text-[10px] text-[#4F5967] dark:text-[#9ca3af] line-clamp-2">{n.message}</span>
                          <span className="block text-[9px] text-[#9CA3AF] mt-0.5">{timeAgo(n.createdAt)}</span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
                {!notifLoading && notifications.length > NOTIF_PREVIEW_COUNT && (
                  <button
                    type="button"
                    onClick={() => setNotifExpanded((v) => !v)}
                    className="block w-full border-t border-[#e7e7e7] dark:border-[#2e2e2e] py-2 text-center text-[11px] font-medium text-[#c39445] hover:bg-[#FAF6F0] dark:hover:bg-[#262626] transition-colors cursor-pointer"
                  >
                    {notifExpanded ? "See less" : `See more (${notifications.length - NOTIF_PREVIEW_COUNT})`}
                  </button>
                )}
              </div>
            )}
          </div>
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