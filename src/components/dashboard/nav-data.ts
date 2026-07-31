import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Receipt,
  BarChart3,
  Download,
  LifeBuoy,
  FileText,
  FileX,
  RotateCcw,
  ShoppingCart,
  BookOpen,
  PackagePlus,
  ArrowUpRight,
  ArrowDownRight,
  FileBarChart,
  TrendingUp,
  Boxes,
  Users,
  Building2,
  Package,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  children?: NavItem[];
};

export const primaryNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    title: "Transactions",
    href: "/dashboard/transactions",
    icon: Receipt,
    children: [
      {
        title: "Sales",
        href: "/dashboard/transactions/sales",
        icon: ArrowUpRight,
        children: [
          { title: "Sales Invoice", href: "/dashboard/transactions/sales", icon: FileText },
          { title: "FBR Deleted Invoices", href: "/dashboard/transactions/sales/fbr-deleted", icon: FileX },
          { title: "Sales Return", href: "/dashboard/transactions/sales/returns", icon: RotateCcw },
        ],
      },
      {
        title: "Purchase",
        href: "/dashboard/transactions/purchases",
        icon: ArrowDownRight,
        children: [
          { title: "Purchase Invoice", href: "/dashboard/transactions/purchases", icon: FileText },
          { title: "Purchase Return", href: "/dashboard/transactions/purchases/returns", icon: RotateCcw },
        ],
      },
      {
        title: "Ledger",
        href: "/dashboard/transactions/ledger",
        icon: BookOpen,
        children: [
          { title: "Customer Ledger", href: "/dashboard/transactions/ledger/customer-ledger", icon: Users },
          { title: "Vendor Ledger", href: "/dashboard/transactions/ledger/vendor-ledger", icon: Building2 },
          { title: "Item Ledger", href: "/dashboard/transactions/ledger/item-ledger", icon: Package },
        ],
      },
      { title: "Inventory Adjustment", href: "/dashboard/transactions/inventory-adjustment", icon: PackagePlus },
    ],
  },
  {
    title: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
    children: [
      { title: "Financial Reports", href: "/dashboard/reports/financial", icon: FileBarChart },
      { title: "Sales Reports", href: "/dashboard/reports/sales", icon: TrendingUp },
      { title: "Inventory Reports", href: "/dashboard/reports/inventory", icon: Boxes },
    ],
  },
  { title: "Import/Export", href: "/dashboard/import-export", icon: Download },
  { title: "Support", href: "/dashboard/support", icon: LifeBuoy },
  { title: "Audit Logs", href: "/dashboard/audit-logs", icon: FileText },
];

