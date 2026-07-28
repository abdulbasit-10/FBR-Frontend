"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronDown, Menu } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { primaryNav, type NavItem } from "@/components/dashboard/nav-data";

export type SidebarProps = {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
};

function NavItemComponent({ item, collapsed, pathname }: { item: NavItem; collapsed: boolean; pathname: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
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
          "group flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
          "hover:bg-[#f7f2e8] dark:hover:bg-[#111827] rounded-[4px]",
          isActive
            ? "bg-[#d4ad68] text-white"
            : "text-gray-600 dark:text-gray-300",
          collapsed && "justify-center px-2 py-2.5",
        )}
      >
        <Icon className={cn("h-4 w-4", isActive ? "text-white" : "text-gray-400 dark:text-gray-500 group-hover:text-[#a4782d]")} />
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
        collapsed ? "w-[72px]" : "w-[220px]",
      )}
    >
      <div className={cn("flex h-[64px] items-center px-5", collapsed ? "px-2 justify-center" : "justify-start")}>
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
          <div className="flex flex-1 items-center">
            <span className="text-sm font-semibold text-[#a87827]">BioWorld Traders</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="ml-auto h-8 w-8 rounded-lg hover:bg-[#F3F4F6] dark:hover:bg-[#111827] transition-all"
              onClick={() => onCollapsedChange?.(!collapsed)}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
          </div>
        )}
      </div>

      <Separator className="opacity-50" />

      <div className="flex-1 py-5">
        <p className={cn("px-5 pb-3 text-[10px] font-medium tracking-wide text-[#9aa2ac]", collapsed && "sr-only")}>MENU</p>
        <nav className={cn("flex flex-col gap-1.5 px-4", collapsed && "px-2")}>
          {primaryNav.map((item) => (
            <NavItemComponent 
              key={item.href} 
              item={item} 
              collapsed={collapsed} 
              pathname={pathname} 
            />
          ))}
        </nav>
      </div>

      <div className="mb-8 flex h-[120px] items-center justify-center border-t border-[#eeeeee]">
        <div className="relative h-[58px] w-[118px]">
          <Image src="/brand/lOGO.ai.svg" alt="Encova Solution" fill sizes="118px" className="object-contain" />
        </div>
      </div>
    </aside>
  );
}

