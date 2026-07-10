import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Receipt,
  BarChart3,
  Download,
  LifeBuoy,
  FileText,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  FileBarChart,
  TrendingUp,
  Boxes,
  ChevronDown,
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
      { title: "Sales", href: "/dashboard/transactions/sales", icon: ArrowUpRight },
      { title: "Purchases", href: "/dashboard/transactions/purchases", icon: ArrowDownRight },
      { title: "Returns", href: "/dashboard/transactions/returns", icon: Receipt },
      { title: "Payments", href: "/dashboard/transactions/payments", icon: CreditCard },
    ]
  },
  { 
    title: "Reports", 
    href: "/dashboard/reports", 
    icon: BarChart3,
    children: [
      { title: "Financial Reports", href: "/dashboard/reports/financial", icon: FileBarChart },
      { title: "Sales Reports", href: "/dashboard/reports/sales", icon: TrendingUp },
      { title: "Inventory Reports", href: "/dashboard/reports/inventory", icon: Boxes },
    ]
  },
  { title: "Inventory", href: "/dashboard/inventory", icon: Package },
  { title: "Import/Export", href: "/dashboard/import-export", icon: Download },
  { title: "Support", href: "/dashboard/support", icon: LifeBuoy },
  { title: "Audit Logs", href: "/dashboard/audit-logs", icon: FileText },
];

