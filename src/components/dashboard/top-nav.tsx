"use client";

import Image from "next/image";
import { Bell, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
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
    <header className="navbar sticky top-0 z-40 flex h-24 items-center gap-6 border-b bg-gradient-to-r from-background/98 via-background/95 to-background/98 px-8 backdrop-blur-3xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.05)] dark:shadow-[0_0_50px_-12px_rgba(0,0,0,0.25)] supports-[backdrop-filter]:bg-background/85">
      <MobileSidebar>
        <Sidebar collapsed={false} />
      </MobileSidebar>

      <div className="flex items-center gap-4">
        {/* <div className="relative h-12 w-[220px] overflow-hidden rounded-xl bg-white/70 dark:bg-white/80">
        <Image
  src="/brand/lOGO.ai.png"
  alt="Encova Solutions logo"
  fill
  sizes="220px"
  style={{ display: "none" }}
  className="object-contain object-center"
  priority
/>
        </div> */}
        <a
          href="mailto:info@encovasolutions.com"
          className="hidden text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors lg:inline"
        >
          info@encovasolutions.com
        </a>
      </div>

      <div className="hidden lg:block">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-11 rounded-2xl px-5 text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-all duration-500 hover:scale-105",
          )}
          onClick={() => onSidebarCollapsedChange(!sidebarCollapsed)}
        >
          {sidebarCollapsed ? "Expand" : "Collapse"}
        </Button>
      </div>

      <div className="relative ml-0 flex-1 max-w-[600px]">
        <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search employees, reports, settings..."
          className="h-14 rounded-3xl pl-14 pr-6 text-base shadow-xl border-0 bg-gradient-to-r from-accent/60 via-accent/40 to-accent/60 focus-visible:ring-4 focus-visible:ring-primary/25 focus-visible:ring-offset-0 transition-all duration-500"
        />
      </div>

      <div className="ml-auto flex items-center gap-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-2xl hover:bg-accent/80 transition-all duration-500 hover:scale-110 relative"
        >
          <Bell className="h-6 w-6" />
          <span className="absolute top-3.5 right-3.5 h-3 w-3 rounded-full bg-gradient-to-r from-primary to-primary/70 border-[3px] border-white dark:border-background shadow-md"></span>
          <span className="sr-only">Notifications</span>
        </Button>
        <div className="scale-110">
          <ModeToggle />
        </div>
        <div className="scale-110">
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}

