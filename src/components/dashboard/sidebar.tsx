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
  const Icon = item.icon;

  const pl = depth === 0 ? "px-3" : depth === 1 ? "pl-5 pr-3" : "pl-8 pr-3";
  const textSize = depth >= 2 ? "text-[12px]" : "text-[13px]";
  const iconSize = depth >= 2 ? "h-3.5 w-3.5" : "h-4 w-4";

  // active state differs by depth — matches Figma exactly
  const activeCls =
    isActiveLeaf && depth >= 2 ? "bg-[#FAF6EE] text-[#A27B3A]" :
      isActiveParent && depth === 0 ? "bg-[#d4ad68] text-white" :
        isActiveParent && depth === 1 ? "bg-[#FAF6F0] text-[#1E293B]" :
          "text-[#4F5967]";

  const iconCls =
    isActiveLeaf && depth >= 2 ? "text-[#A27B3A]" :
      isActiveParent && depth === 0 ? "text-white" :
        "text-[#9CA3AF] group-hover:text-[#a4782d]";

  return (
    <div className="flex flex-col">
      <Link
        href={hasChildren ? "#" : item.href}
        onClick={(e) => { if (hasChildren) { e.preventDefault(); setIsExpanded((v) => !v); } }}
        className={cn(
          "group flex items-center gap-2.5 py-2 rounded font-medium transition-colors",
          pl, textSize, activeCls,
          !isActiveLeaf && !isActiveParent && "hover:bg-[#f7f2e8]",
          collapsed && depth === 0 && "justify-center px-2",
        )}
      >
        <Icon className={cn(iconSize, "shrink-0", iconCls)} />
        {!collapsed && <span className="flex-1 leading-none">{item.title}</span>}
        {!collapsed && hasChildren && (
          <ChevronDown className={cn(
            "ml-auto h-3.5 w-3.5 shrink-0 transition-transform",
            isActiveParent && depth === 0 ? "text-white" : "text-[#9CA3AF]",
            isExpanded && "rotate-180"
          )} />
        )}
        {collapsed && <span className="sr-only">{item.title}</span>}
      </Link>

      {!collapsed && hasChildren && isExpanded && (
        <div className={cn("flex flex-col gap-0.5 mt-0.5", depth === 0 && "border-l border-[#F3EAD8] ml-5")}>
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
        "sidebar flex h-full flex-col bg-white border-r border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.02)]",
        collapsed ? "w-[72px]" : "w-[220px]",
      )}
    >
      <div className={cn("flex h-[64px] items-center px-5", collapsed ? "px-2 justify-center" : "justify-start")}>
        {collapsed ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg hover:bg-[#F3F4F6] transition-all"
            onClick={() => onCollapsedChange?.(!collapsed)}
          >
            <Menu className="h-4 w-4" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        ) : (
          <div className="flex flex-1 items-center">
            <span className="text-sm font-semibold text-[#a87827]">BioWorld Traders</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="ml-auto h-8 w-8 rounded-lg hover:bg-[#F3F4F6] transition-all"
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

