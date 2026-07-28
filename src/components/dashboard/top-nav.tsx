"use client";

import { LogOut, Moon } from "lucide-react";
import { useRouter } from "next/navigation";

import { type UserInfo } from "@/components/dashboard/user-menu";
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";
import { Sidebar } from "@/components/dashboard/sidebar";

export function TopNav({
  user,
  sidebarCollapsed,
  onSidebarCollapsedChange,
}: {
  user: UserInfo;
  sidebarCollapsed: boolean;
  onSidebarCollapsedChange: (collapsed: boolean) => void;
}) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[#e7e7e7] bg-white px-6">
      <MobileSidebar>
        <Sidebar collapsed={false} />
      </MobileSidebar>

      <div className="flex items-center gap-3"></div>

      <div className="flex items-center gap-2">
        <button type="button" onClick={() => router.push("/")} className="flex h-8 items-center gap-1.5 rounded-full border border-[#eee4d4] bg-white px-3 text-[11px] text-[#424b56] shadow-[0_1px_2px_rgba(0,0,0,.03)]">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-[#fff4df] text-[#c39445]"><Moon className="h-3 w-3" /></span> Modes
        </button>
        <button type="button" className="flex h-8 items-center gap-1.5 rounded-full border border-[#eee4d4] bg-white px-3 text-[11px] text-[#424b56] shadow-[0_1px_2px_rgba(0,0,0,.03)]">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-[#fff4df] text-[#c39445]"><LogOut className="h-3 w-3" /></span> Logout
        </button>
        <button type="button" className="flex h-9 items-center gap-2 rounded-full bg-[#c99d54] py-0.5 pl-1 pr-3 text-left text-white shadow-sm">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-[#77583a] text-[9px] font-semibold">KT</span>
          <span className="leading-[1.05]"><b className="block text-[10px] font-medium">Kainat Tajammul</b><small className="block text-[8px] text-white/80">Developer</small></span>
        </button>
      </div>
    </header>
  );
}

