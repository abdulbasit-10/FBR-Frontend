"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronDown, Menu } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { primaryNav, type NavItem } from "@/components/dashboard/nav-data";

export type SidebarProps = {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
};

function NavItemComponent({
  item, collapsed, pathname, depth = 0,
}: {
  item: NavItem; collapsed: boolean; pathname: string; depth?: number;
}) {
  const hasChildren = !!item.children?.length;

  const containsActive = (node: NavItem): boolean =>
    pathname === node.href || !!node.children?.some(containsActive);

  const [isExpanded, setIsExpanded] = useState(() => containsActive(item));
  const isActiveLeaf = !hasChildren && pathname === item.href;
  const isActiveParent = hasChildren && containsActive(item);
  const isActive = isActiveLeaf || isActiveParent;
  const Icon = item.icon;

  const pl = depth === 0 ? "px-3" : depth === 1 ? "pl-5 pr-3" : "pl-8 pr-3";
  const textSize = depth >= 2 ? "text-[12px]" : "text-[13px]";
  const iconSize = depth >= 2 ? "h-3.5 w-3.5" : "h-4 w-4";

  const activeCls =
    isActive && depth === 0 ? "bg-[#d4ad68] text-white" :
      isActive && depth === 1 ? "bg-[#FAF6F0] dark:bg-[#2a2a2a] text-[#1E293B] dark:text-[#f0f0f0]" :
        isActive ? "bg-[#FAF6EE] dark:bg-[#2a2a2a] text-[#A27B3A]" :
          "text-[#4F5967] dark:text-[#9ca3af]";

  const iconCls =
    isActive && depth === 0 ? "text-white" :
      isActive ? "text-[#A27B3A]" :
        "text-[#9CA3AF] dark:text-[#666] group-hover:text-[#a4782d]";

  return (
    <div className="flex flex-col">
      <Link
        href={hasChildren ? "#" : item.href}
        onClick={(e) => { if (hasChildren) { e.preventDefault(); e.stopPropagation(); setIsExpanded((v) => !v); } }}
        className={cn(
          "group flex items-center gap-2.5 py-2 rounded font-medium transition-colors",
          pl, textSize, activeCls,
          !isActive && "hover:bg-[#f7f2e8] dark:hover:bg-[#2a2a2a]",
          collapsed && depth === 0 && "justify-center px-2",
        )}
      >
        <Icon className={cn(iconSize, "shrink-0", iconCls)} />
        {!collapsed && <span className="flex-1 leading-none">{item.title}</span>}
        {!collapsed && hasChildren && (
          <ChevronDown className={cn(
            "ml-auto h-3.5 w-3.5 shrink-0 transition-transform",
            isActive && depth === 0 ? "text-white" : "text-[#9CA3AF]",
            isExpanded && "rotate-180"
          )} />
        )}
        {collapsed && <span className="sr-only">{item.title}</span>}
      </Link>

      {!collapsed && hasChildren && isExpanded && (
        <div className={cn("flex flex-col gap-0.5 mt-0.5", depth === 0 && "border-l border-[#F3EAD8] dark:border-[#3a2a1a] ml-5")}>
          {item.children!.map((child) => (
            <NavItemComponent key={child.href} item={child} collapsed={collapsed} pathname={pathname} depth={depth + 1} />
          ))}
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
        "sidebar flex h-full flex-col bg-white dark:bg-[#1e1e1e] border-r border-[#E5E7EB] dark:border-[#2e2e2e] shadow-[0_1px_3px_rgba(0,0,0,0.02)]",
        collapsed ? "w-[72px]" : "w-[220px]",
      )}
    >
      <div className={cn("flex h-16 shrink-0 items-center px-3", collapsed ? "justify-center" : "justify-start")}>
        {collapsed ? (
          <button
            type="button"
            onClick={() => onCollapsedChange?.(!collapsed)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#1e1e1e] text-[#4F5967] dark:text-[#9ca3af] hover:bg-[#F3F4F6] dark:hover:bg-[#2a2a2a] transition-all"
            title="Expand sidebar"
          >
            <Menu className="h-4 w-4" />
          </button>
        ) : (
          <div className="flex flex-1 items-center gap-2 overflow-hidden">
            <span className="flex-1 truncate text-sm font-semibold text-[#a87827]">BioWorld Traders</span>
            <button
              type="button"
              onClick={() => onCollapsedChange?.(!collapsed)}
              className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#1e1e1e] text-[#4F5967] dark:text-[#9ca3af] hover:bg-[#F3F4F6] dark:hover:bg-[#2a2a2a] transition-all"
              title="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <Separator className="opacity-50 shrink-0" />

      {/* scrollable area — nav pushes Encova Solution down when dropdowns open */}
      <div className="flex flex-1 flex-col overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden">
        <div className="py-5">
          <p className={cn("px-5 pb-3 text-[10px] font-medium tracking-wide text-[#9aa2ac] dark:text-[#555]", collapsed && "sr-only")}>MENU</p>
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

        <div className="mt-auto mb-8 flex h-30 items-center justify-center border-t border-[#eeeeee] shrink-0">
          <div className="relative h-14.5 w-29.5">
            <Image src="/brand/lOGO.ai.svg" alt="Encova Solution" fill sizes="118px" className="object-contain" />
          </div>
        </div>
      </div>
    </aside>
  );
}

