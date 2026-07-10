"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronDown, Menu } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { primaryNav, type NavItem } from "@/components/dashboard/nav-data";

export type SidebarProps = {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
};

function NavItemComponent({ item, collapsed, pathname }: { item: NavItem; collapsed: boolean; pathname: string }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const isActive = pathname === item.href;
  const Icon = item.icon;
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div className="flex flex-col">
      <Link
        href={item.href}
        onClick={(e) => {
          if (hasChildren) {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
        className={cn(
          "group flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200",
          "hover:bg-[#F3F4F6] dark:hover:bg-[#111827] rounded-xl",
          isActive
            ? "bg-[#6B7280]/10 text-[#6B7280] dark:bg-[#9CA3AF]/10 dark:text-[#9CA3AF]"
            : "text-gray-600 dark:text-gray-300",
          collapsed && "justify-center px-3 py-3",
        )}
      >
        <Icon className={cn("h-5 w-5", isActive ? "text-[#6B7280] dark:text-[#9CA3AF]" : "text-gray-400 dark:text-gray-500 group-hover:text-[#6B7280] dark:group-hover:text-[#9CA3AF]")} />
        {!collapsed && <span>{item.title}</span>}
        {!collapsed && hasChildren && (
          <ChevronDown 
            className={cn("ml-auto h-4 w-4 transition-transform", isExpanded && "rotate-180")} 
          />
        )}
        {collapsed && <span className="sr-only">{item.title}</span>}
      </Link>
      {!collapsed && hasChildren && isExpanded && (
        <div className="flex flex-col ml-4">
          {item.children?.map((child) => {
            const ChildIcon = child.icon;
            const isChildActive = pathname === child.href;
            return (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-2 text-sm font-medium transition-all duration-200",
                  "hover:bg-[#F3F4F6] dark:hover:bg-[#111827] rounded-lg",
                  isChildActive
                    ? "bg-[#6B7280]/10 text-[#6B7280] dark:bg-[#9CA3AF]/10 dark:text-[#9CA3AF]"
                    : "text-gray-500 dark:text-gray-400",
                )}
              >
                <ChildIcon className="h-4 w-4" />
                <span>{child.title}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ collapsed = false, onCollapsedChange }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "sidebar flex h-full flex-col bg-white dark:bg-[#020617] border-r border-[#E5E7EB] dark:border-[#1F2937] shadow-[0_1px_3px_rgba(0,0,0,0.02)]",
        collapsed ? "w-[72px]" : "w-[280px]",
      )}
    >
      <div className={cn("flex h-[72px] items-center px-6", collapsed ? "px-3 justify-center" : "justify-start")}>
        {collapsed ? (
          // Collapsed: Only show menu toggle button
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg hover:bg-[#F3F4F6] dark:hover:bg-[#111827] transition-all"
            onClick={() => onCollapsedChange?.(!collapsed)}
          >
            <Menu className="h-4 w-4" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        ) : (
          // Expanded: Show logo + text + toggle button
          <div className="flex items-center gap-4 flex-1">
            <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-gradient-to-br from-[#6B7280] to-[#4B5563] shadow-lg">
              <Image
                src="/brand/lOGO.ai.png"
                alt="FBR Logo"
                fill
                sizes="40px"
                className="object-contain object-center"
                priority
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-base font-semibold text-foreground">
                ENCOVA ERP
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg hover:bg-[#F3F4F6] dark:hover:bg-[#111827] transition-all"
              onClick={() => onCollapsedChange?.(!collapsed)}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
          </div>
        )}
      </div>

      <Separator className="opacity-50" />

      <ScrollArea className="flex-1 py-6">
        <nav className={cn("flex flex-col gap-1 px-3", collapsed && "px-2")}>
          {primaryNav.map((item) => (
            <NavItemComponent 
              key={item.href} 
              item={item} 
              collapsed={collapsed} 
              pathname={pathname} 
            />
          ))}
        </nav>
      </ScrollArea>

      <div className={cn("p-4", collapsed && "p-3")}>
        <div className="rounded-xl border border-[#E5E7EB] dark:border-[#1F2937] bg-[#F9FAFB] dark:bg-[#020617] p-4 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            {!collapsed && <span className="text-xs font-semibold text-foreground">System Status: Online</span>}
            {collapsed && <span className="sr-only">System Status: Online</span>}
          </div>
        </div>
      </div>
    </aside>
  );
}

