import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Receipt,
  BarChart3,
  LifeBuoy,
  FileText,
  FileX,
  RotateCcw,
  BookOpen,
  PackagePlus,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Building2,
  Package,
  Download,
  Upload,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  Boxes,
  BarChart2,
  Archive,
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
      { title: "Sales Detail", href: "/dashboard/reports/sales-detail", icon: BarChart2 },
      { title: "Sales Summary", href: "/dashboard/reports/sales-summary", icon: TrendingUp },
      { title: "Purchase Detail", href: "/dashboard/reports/purchase-detail", icon: BarChart2 },
      { title: "Purchase Summary", href: "/dashboard/reports/purchase-summary", icon: TrendingDown },
      { title: "Inventory Movement", href: "/dashboard/reports/inventory-movement", icon: Boxes },
    ],
  },
  {
    title: "Import/Export",
    href: "/dashboard/import-export",
    icon: Download,
    children: [
      { title: "Master Import", href: "/dashboard/import-export/master-import", icon: Upload },
      { title: "Customers", href: "/dashboard/import-export/customers", icon: Users },
      { title: "Vendors", href: "/dashboard/import-export/vendors", icon: Building2 },
      { title: "Items", href: "/dashboard/import-export/items", icon: Package },
      { title: "Sales Invoice", href: "/dashboard/import-export/sales-invoices", icon: ShoppingBag },
    ],
  },
  { title: "Items", href: "/dashboard/items", icon: Archive },
  { title: "Support", href: "/dashboard/support", icon: LifeBuoy },
  { title: "Audit Logs", href: "/dashboard/audit-logs", icon: FileText },
];

