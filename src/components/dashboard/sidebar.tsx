"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { primaryNav } from "@/components/dashboard/nav-data";

export type SidebarProps = {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
};

export function Sidebar({ collapsed = false, onCollapsedChange }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "sidebar flex h-full flex-col border-r bg-gradient-to-b from-sidebar via-sidebar to-muted/30 dark:from-sidebar dark:via-sidebar dark:to-accent/30 text-sidebar-foreground shadow-[0_0_50px_-12px_rgba(0,0,0,0.05)] dark:shadow-[0_0_50px_-12px_rgba(0,0,0,0.3)]",
        collapsed ? "w-[80px]" : "w-[280px]",
      )}
    >
      <div className={cn("flex h-24 items-center gap-4 px-6", collapsed && "px-4 justify-center")}>
        <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-white shadow-xl shadow-primary/10">
          <Image
            src="/brand/lOGO.ai.png"
            alt="Encova Solutions logo"
            fill
            sizes="56px"
            className="object-contain object-center"
            priority
          />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="truncate text-lg font-bold tracking-tight">
              FBR Dashboard
            </div>
            <div className="truncate text-sm text-muted-foreground font-medium">
              HR & Payroll
            </div>
          </div>
        )}

        {!collapsed && (
          <div className="ml-auto">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-2xl hover:bg-sidebar-accent transition-all duration-300 hover:scale-105"
              onClick={() => onCollapsedChange?.(!collapsed)}
            >
              <ChevronLeft className="h-5 w-5 transition-transform duration-300" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
          </div>
        )}
      </div>

      <Separator className="opacity-30 mx-4" />

      <ScrollArea className="flex-1 py-8">
        <nav className={cn("nav flex flex-col gap-3 px-5", collapsed && "px-4")}>
          {primaryNav.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 rounded-2xl px-5 py-4 text-sm font-bold transition-all duration-500 ease-out",
                  "hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground hover:scale-[1.01] hover:shadow-md",
                  active
                    ? "bg-gradient-to-r from-primary via-primary/85 to-primary/70 text-white shadow-xl shadow-primary/20"
                    : "",
                  collapsed && "justify-center px-4 py-5",
                )}
              >
                <Icon className={cn("h-[22px] w-[22px]", active ? "" : "text-muted-foreground")} />
                {!collapsed && <span className="truncate tracking-tight">{item.title}</span>}
                {collapsed && <span className="sr-only">{item.title}</span>}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className={cn("p-6", collapsed && "p-5")}>
        <div className="rounded-3xl border bg-gradient-to-br from-card to-muted/60 dark:from-card dark:to-accent/40 p-5 shadow-xl">
          <div className="text-sm font-bold flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 animate-pulse" />
            Pro Tip
          </div>
          {!collapsed && (
            <div className="mt-3 text-sm text-muted-foreground leading-relaxed font-medium">
              Use the search to quickly jump between sections and manage your team efficiently.
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

