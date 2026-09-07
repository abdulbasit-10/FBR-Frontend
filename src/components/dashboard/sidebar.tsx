"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronDown, Menu } from "lucide-react";
import { useState, useEffect } from "react";

import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { primaryNav, type NavItem } from "@/components/dashboard/nav-data";

export type SidebarProps = {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
};

function collectLeafHrefs(items: NavItem[], out = new Set<string>()): Set<string> {
  for (const item of items) {
    if (!item.children?.length) out.add(item.href);
    else collectLeafHrefs(item.children, out);
  }
  return out;
}

const ALL_LEAF_HREFS = collectLeafHrefs(primaryNav);

function NavItemComponent({
  item, collapsed, pathname, depth = 0, openTopLevel, onTopLevelToggle,
  controlledExpanded, onControlledToggle,
}: {
  item: NavItem; collapsed: boolean; pathname: string; depth?: number;
  openTopLevel?: string | null; onTopLevelToggle?: (href: string) => void;
  controlledExpanded?: boolean; onControlledToggle?: () => void;
}) {
  const hasChildren = !!item.children?.length;

  const nodeMatches = (node: NavItem, d: number): boolean =>
    pathname === node.href ||
    (d > 0 && !node.children?.length && pathname.startsWith(node.href + "/") && !ALL_LEAF_HREFS.has(pathname)) ||
    !!node.matchPaths?.includes(pathname);

  const containsActive = (node: NavItem, d = 0): boolean =>
    nodeMatches(node, d) || !!node.children?.some((c) => containsActive(c, d + 1));

  // depth-0: accordion controlled by Sidebar; depth-1 with children: controlled by parent; else local
  const [localExpanded, setLocalExpanded] = useState(() => containsActive(item, depth));
  const isExpanded =
    depth === 0 && hasChildren ? openTopLevel === item.href :
      controlledExpanded !== undefined ? controlledExpanded :
        localExpanded;

  // Accordion state for depth-1 children (controls which depth-1 sub-dropdown is open)
  const initialOpenChild = item.children?.find(c => c.children?.length && containsActive(c, depth + 1))?.href ?? null;
  const [openChild, setOpenChild] = useState<string | null>(initialOpenChild);

  const isActiveLeaf = !hasChildren && nodeMatches(item, depth);
  const isActiveParent = hasChildren && containsActive(item, depth);
  const isActive = isActiveLeaf || isActiveParent;
  const Icon = item.icon;

  const pl = depth === 0 ? "px-2.5" : depth === 1 ? "pl-4 pr-2.5" : "pl-7 pr-2.5";
  const textSize = depth >= 2 ? "text-[11.5px]" : "text-[12.5px]";
  const iconSize = depth >= 1 ? "h-3.5 w-3.5" : "h-4 w-4";

  const activeCls =
    isActive && depth === 0 ? "bg-[#d4ad68] text-white" :
      isActive && depth === 1 ? "bg-[#FAF6F0] dark:bg-[#2a2a2a] text-[#1E293B] dark:text-[#f0f0f0]" :
        isActive ? "bg-[#FAF6EE] dark:bg-[#2a2a2a] text-[#A27B3A]" :
          "text-[#4F5967] dark:text-[#9ca3af]";

  const iconCls =
    isActive && depth === 0 ? "text-white" :
      isActive ? "text-[#A27B3A]" :
        "text-[#9CA3AF] dark:text-[#666] group-hover:text-[#a4782d]";

  const handleClick = (e: React.MouseEvent) => {
    if (!hasChildren) return;
    e.preventDefault(); e.stopPropagation();
    if (depth === 0 && onTopLevelToggle) {
      onTopLevelToggle(item.href);
    } else if (onControlledToggle) {
      onControlledToggle();
    } else {
      setLocalExpanded((v) => !v);
    }
  };

  return (
    <div className="flex flex-col">
      <Link
        href={hasChildren ? "#" : item.href}
        onClick={handleClick}
        className={cn(
          "group flex items-center gap-2 py-1.5 rounded font-medium transition-colors",
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
        <div className={cn("flex flex-col gap-0.5 mt-0.5", depth === 0 && "border-l border-[#F3EAD8] dark:border-[#3a2a1a] ml-4")}>
          {item.children!.map((child) => {
            const childHasChildren = !!child.children?.length;
            return (
              <NavItemComponent
                key={child.href}
                item={child}
                collapsed={collapsed}
                pathname={pathname}
                depth={depth + 1}
                controlledExpanded={childHasChildren ? openChild === child.href : undefined}
                onControlledToggle={childHasChildren ? () => setOpenChild(prev => prev === child.href ? null : child.href) : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ collapsed = false, onCollapsedChange }: SidebarProps) {
  const pathname = usePathname();

  // Accordion: only one top-level dropdown open at a time
  const matchingTopLevel = (path: string): string | null =>
    primaryNav.find(item =>
      item.children?.length && item.children.some(c =>
        path === c.href || path.startsWith(c.href + "/") ||
        c.children?.some(cc => path === cc.href || path.startsWith(cc.href + "/"))
      )
    )?.href ?? null;
  const [openTopLevel, setOpenTopLevel] = useState<string | null>(() => matchingTopLevel(pathname));

  // Re-derive which dropdown should be open whenever the route changes, so navigating to a
  // page outside any submenu (e.g. Dashboard) collapses whatever was previously expanded.
  useEffect(() => {
    setOpenTopLevel(matchingTopLevel(pathname));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleTopLevelToggle = (href: string) => {
    setOpenTopLevel(prev => prev === href ? null : href);
  };

  return (
    <aside
      style={{ fontFamily: "var(--font-inter), 'Inter', sans-serif" }}
      className={cn(
        "sidebar flex h-full flex-col bg-white dark:bg-[#1e1e1e] border-r border-[#E5E7EB] dark:border-[#2e2e2e] shadow-[0_1px_3px_rgba(0,0,0,0.02)]",
        collapsed ? "w-18" : "w-55",
      )}
    >
      {/* Header â€” matches navbar h-12 */}
      <div className={cn("flex h-12 shrink-0 items-center px-3", collapsed ? "justify-center" : "justify-start")}>
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

      {/* Scrollable nav area */}
      <div className="flex flex-1 flex-col overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden">
        <div className="py-2.5">
          <p className={cn("px-4 pb-1.5 text-[10px] font-medium tracking-wide text-[#9aa2ac] dark:text-[#555]", collapsed && "sr-only")}>MENU</p>
          <nav className={cn("flex flex-col gap-1 px-3", collapsed && "px-2")}>
            {primaryNav.map((item) => (
              <NavItemComponent
                key={item.href}
                item={item}
                collapsed={collapsed}
                pathname={pathname}
                openTopLevel={openTopLevel}
                onTopLevelToggle={handleTopLevelToggle}
              />
            ))}
          </nav>
        </div>

        {/* Bottom logo â€” anchored to bottom with mt-auto */}
        <div className="mt-auto shrink-0 border-t border-[#eeeeee] dark:border-[#2e2e2e] px-3 py-2.5">
          <div className="relative h-9 w-full">
            <Image src="/brand/lOGO.ai.svg" alt="Encova Solutions" fill sizes="180px" className="object-contain object-left" />
          </div>
        </div>
      </div>
    </aside>
  );
}