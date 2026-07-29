"use client";

import { LogOut, Moon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import { auth, type AuthUser } from "@/lib/auth";
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";
import { Sidebar } from "@/components/dashboard/sidebar";

export function TopNav({
  sidebarCollapsed,
  onSidebarCollapsedChange,
}: {
  sidebarCollapsed: boolean;
  onSidebarCollapsedChange: (collapsed: boolean) => void;
}) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setAuthUser(auth.getUser());
  }, []);

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
    router.push("/");
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[#e7e7e7] bg-white px-6">
        <MobileSidebar>
          <Sidebar collapsed={false} />
        </MobileSidebar>

        <div className="flex items-center gap-3" />

        <div className="flex items-center gap-2">
          <button type="button" onClick={() => router.push("/")} className="flex h-8 items-center gap-1.5 rounded-full border border-[#eee4d4] bg-white px-3 text-[11px] text-[#424b56] shadow-[0_1px_2px_rgba(0,0,0,.03)]">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-[#fff4df] text-[#c39445]"><Moon className="h-3 w-3" /></span> Modes
          </button>
          <button type="button" onClick={() => setShowConfirm(true)} className="flex h-8 items-center gap-1.5 rounded-full border border-[#eee4d4] bg-white px-3 text-[11px] text-[#424b56] shadow-[0_1px_2px_rgba(0,0,0,.03)]">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-[#fff4df] text-[#c39445]"><LogOut className="h-3 w-3" /></span> Logout
          </button>
          <button type="button" className="flex h-9 items-center gap-2 rounded-full bg-[#c99d54] py-0.5 pl-1 pr-3 text-left text-white shadow-sm">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[#77583a] text-[9px] font-semibold">{initials}</span>
            <span className="leading-[1.05]">
              <b className="block text-[10px] font-medium">{displayName}</b>
              <small className="block text-[8px] text-white/80">{displayRole}</small>
            </span>
          </button>
        </div>
      </header>


      {/* Figma-Exact Logout Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4 backdrop-blur-[2px] font-sans">
          <div className="absolute inset-0" onClick={() => !isLoggingOut && setShowConfirm(false)} />

          <div className="relative flex w-[635px] min-h-[117.73px] flex-col justify-between rounded-[10.64px] border-[1.06px] border-[#D4D4D4] bg-white px-[21.27px] py-[14.89px] shadow-xl">
            {/* Top Left Text Content */}
            <div className="text-left">
              <h2 className="text-[15px] font-bold leading-tight text-[#111827]">Logout</h2>
              <p className="mt-1 text-[12px] font-normal leading-snug text-[#8E95A2]">
                Are you sure you want to logout?
              </p>
            </div>

            {/* Bottom Right Action Buttons */}
            <div className="flex justify-end items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={isLoggingOut}
                className="rounded-[8px] border border-[#94D8D5] bg-[#F1F8F8] px-5 py-1.5 text-[12px] font-medium text-[#2C3E50] transition hover:bg-[#e4f3f3] disabled:opacity-50"
              >
                Cancle
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="rounded-[8px] border border-[#FCA5A5] bg-[#FFF5F5] px-5 py-1.5 text-[12px] font-medium text-[#2C3E50] transition hover:bg-[#fee2e2] disabled:opacity-60"
              >
                {isLoggingOut ? "Logging out…" : "Logout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}