"use client";

import { LogOut, Moon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import { auth, type AuthUser } from "@/lib/auth";
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";
import { Sidebar } from "@/components/dashboard/sidebar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function TopNav() {
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
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[#e7e7e7] bg-white px-4 lg:px-6">
        <div className="flex items-center gap-2">
          {/* Mobile hamburger */}
          <MobileSidebar>
            <Sidebar collapsed={false} />
          </MobileSidebar>
        </div>

        <div className="flex items-center gap-3" />

        <div className="flex items-center gap-2">
          <button type="button" onClick={() => router.push("/")} className="flex h-8 items-center gap-1.5 rounded-full border border-[#eee4d4] bg-white px-2 sm:px-3 text-[11px] text-[#424b56] shadow-[0_1px_2px_rgba(0,0,0,.03)]">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-[#fff4df] text-[#c39445]"><Moon className="h-3 w-3" /></span>
            <span className="hidden sm:inline">Modes</span>
          </button>
          <button type="button" onClick={() => setShowConfirm(true)} className="flex h-8 items-center gap-1.5 rounded-full border border-[#eee4d4] bg-white px-2 sm:px-3 text-[11px] text-[#424b56] shadow-[0_1px_2px_rgba(0,0,0,.03)]">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-[#fff4df] text-[#c39445]"><LogOut className="h-3 w-3" /></span>
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