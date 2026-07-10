"use client";

import { Bell, Settings, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { UserMenu, type UserInfo } from "@/components/dashboard/user-menu";
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
  return (
    <header className="sticky top-0 z-40 flex h-[72px] items-center justify-between bg-white dark:bg-[#020617] border-b border-[#E5E7EB] dark:border-[#1F2937] px-6">
      <MobileSidebar>
        <Sidebar collapsed={false} />
      </MobileSidebar>

      <div className="flex items-center gap-3">
        {/* <div className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] dark:border-[#1F2937] px-4 py-2 hover:bg-[#F9FAFB] dark:hover:bg-[#111827] transition-colors cursor-pointer">
          <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <span className="text-white font-semibold text-sm">BW</span>
          </div>
          <div className="hidden sm:block"> */}
            <div className="text-lg font-semibold text-foreground">Dashboard</div>
            {/* <div className="text-xs text-muted-foreground">Company</div>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div> */}
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-lg hover:bg-[#F3F4F6] dark:hover:bg-[#111827] relative"
        >
          <Bell className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF]" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
          <span className="sr-only">Notifications</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-lg hover:bg-[#F3F4F6] dark:hover:bg-[#111827]"
        >
          <Settings className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF]" />
          <span className="sr-only">Settings</span>
        </Button>
        <ModeToggle />
        <UserMenu user={user} />
      </div>
    </header>
  );
}

