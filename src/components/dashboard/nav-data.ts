import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  CalendarCheck2,
  BadgeDollarSign,
  BarChart3,
  Settings,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export const primaryNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Employees", href: "/dashboard/employees", icon: Users },
  { title: "Attendance", href: "/dashboard/attendance", icon: CalendarCheck2 },
  { title: "Payroll", href: "/dashboard/payroll", icon: BadgeDollarSign },
  { title: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
];

