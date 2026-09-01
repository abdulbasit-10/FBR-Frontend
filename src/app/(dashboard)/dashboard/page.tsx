"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bell,
  Box,
  Building2,
  Calendar,
  CircleHelp,
  FileText,
  Globe,
  Hash,
  MapPin,
  Package,
  RefreshCw,
  Shield,
} from "lucide-react";
import { toast } from "react-toastify";
import { auth, type AuthUser } from "@/lib/auth";
import {
  customersService,
  dashboardService,
  productsService,
  type DashboardResponse,
} from "@/lib/services";

const gold = "#c99d54";

interface SideCounts {
  customers: number | null;
  items: number | null;
}

export default function DashboardPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [side, setSide] = useState<SideCounts>({ customers: null, items: null });
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setAuthUser(auth.getUser());
  }, []);

  const load = useCallback(async (showToast = false) => {
    try {
      const [dash, cust, prod] = await Promise.all([
        dashboardService.get(),
        // We only need the total count; `limit: 1` keeps the payload tiny.
        customersService.list({ limit: 1 }),
        productsService.list({ limit: 1 }),
      ]);
      setData(dash.data);
      setSide({ customers: cust.data.meta.total, items: prod.data.meta.total });
      if (showToast) toast.success("Dashboard refreshed.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load dashboard.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    await load(true);
    setIsRefreshing(false);
  };

  const cards = data?.cards;
  const totalDocs = cards?.totalInvoices ?? 0;
  const awaiting = cards?.pendingInvoices ?? 0;
  const salesInvoicesCount = String(cards?.totalInvoices ?? "—");
  const postedCount = String(cards?.acceptedInvoices ?? "0");
  const unpostedCount = String(cards?.pendingInvoices ?? "0");
  const rejectedCount = String(cards?.rejectedInvoices ?? "0");

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  return (
    <div
      className="mx-auto max-w-[1440px] font-sans text-[#4f5967]"
      style={{ fontFamily: 'var(--font-inter), sans-serif' }}
    >
      {/* Top Banner */}
      <section className="relative overflow-hidden rounded-lg bg-[linear-gradient(110deg,#c99d54,#a6782d)] px-6 py-5 text-white">
        <div className="absolute -right-6 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-white/10" />
        <p className="relative text-[10px] font-medium uppercase tracking-widest text-white/65">{today}</p>
        <h1 className="relative mt-1 text-[21px] font-semibold leading-snug tracking-tight">Welcome Back{authUser?.name ? `, ${authUser.name.split(" ")[0]}` : ""}!</h1>
        <p className="relative mt-1 text-[11px] text-white/70">{totalDocs} documents · {awaiting} awaiting post</p>
        <div className="relative mt-4 flex flex-wrap gap-1.5 md:absolute md:right-5 md:top-1/2 md:mt-0 md:-translate-y-1/2">
          <Link href="/dashboard/sales/create-invoice" className="flex h-[28px] items-center gap-1 rounded-md bg-white/95 px-3 text-[12px] font-medium text-[#5d5750] hover:bg-white transition-colors">
            New Sales Invoice <ArrowUpRight className="inline h-3 w-3" />
          </Link>
          <Link href="/dashboard/reports/sales" className="flex h-[28px] items-center rounded-md bg-white/95 px-3 text-[12px] font-medium text-[#5d5750] hover:bg-white transition-colors">
            View Reports
          </Link>
          <button onClick={handleRefresh} disabled={isRefreshing} className="flex h-[28px] items-center gap-1 rounded-md bg-white/95 px-3 text-[12px] font-medium text-[#5d5750] hover:bg-white transition-colors disabled:opacity-60 cursor-pointer">
            <RefreshCw className={`inline h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} /> {isRefreshing ? "Refreshing..." : "Refresh data"}
          </button>
        </div>
      </section>

      {/* Main Grid: Standard top alignment */}
      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[1fr_272px]">
        {/* Left Column */}
        <div className="space-y-4">
          <DashboardSection title="Sales">
            <div className="grid gap-2 sm:grid-cols-2">
              <SummaryCard title="Sales Invoices" count={salesInvoicesCount} postedCount={postedCount} unpostedCount={unpostedCount} postedHref="/dashboard/transactions/sales?status=Posted" unpostedHref="/dashboard/transactions/sales?status=UnPosted" />
              <SummaryCard title="Sales Returns" count={rejectedCount} postedCount={rejectedCount} unpostedCount="0" returnCard postedHref="/dashboard/transactions/sales/returns?status=Posted" unpostedHref="/dashboard/transactions/sales/returns?status=UnPosted" />
            </div>
          </DashboardSection>

          <DashboardSection title="Purchases">
            <div className="grid gap-2 sm:grid-cols-2">
              <SummaryCard title="Purchase Invoices" count="0" postedCount="0" unpostedCount="0" postedHref="/dashboard/transactions/purchases?status=Posted" unpostedHref="/dashboard/transactions/purchases?status=UnPosted" />
              <SummaryCard title="Purchase Returns" count="0" postedCount="0" unpostedCount="0" returnCard postedHref="/dashboard/transactions/purchases/returns?status=Posted" unpostedHref="/dashboard/transactions/purchases/returns?status=UnPosted" />
            </div>
          </DashboardSection>

          <DashboardSection title="Inventory">
            <div className="grid gap-2 sm:grid-cols-2">
              <SummaryCard title="Posted Adjustments" count="0" postedCount="0" unpostedCount="0" inventory postedHref="/dashboard/transactions/inventory-adjustment?status=Posted" unpostedHref="/dashboard/transactions/inventory-adjustment?status=UnPosted" />
              <SummaryCard title="Unposted Adjustments" count="0" postedCount="0" unpostedCount="0" inventory postedHref="/dashboard/transactions/inventory-adjustment?status=Posted" unpostedHref="/dashboard/transactions/inventory-adjustment?status=UnPosted" />
            </div>
          </DashboardSection>

          {/* ── COMPANY PROFILE SECTION ── */}
          <DashboardSection title="Company Profile">
            <div className="rounded-xl border border-[#e8e9eb] dark:border-[#3a3a3a] bg-white dark:bg-[#242424] p-4">
              {/* Header */}
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#a37934] text-xs font-bold text-white">
                  ES
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1f2937] dark:text-[#f0f0f0]">BIO Encova Solution</h3>
                  <p className="text-[11px] text-[#9ca3af]">Enterprise Resource Planning Account</p>
                </div>
              </div>

              {/* Rows Block */}
              <div className="space-y-3">
                <ProfileRow
                  left={{ icon: Hash, label: "Company ID", value: "BWTR" }}
                  right={{ icon: Globe, label: "NTN", value: "AT73964" }}
                />
                <ProfileRow
                  left={{ icon: MapPin, label: "Province", value: "KPK" }}
                  right={{ icon: Building2, label: "City", value: "Khyber Pakhtunkhwa" }}
                />
                <ProfileRow
                  left={{ icon: Shield, label: "Sandbox", value: "Yes" }}
                  right={{ icon: Calendar, label: "License Expiry", value: "2026-11-19" }}
                />
              </div>
              <div className="mt-4 border-t border-[#e8e9eb] dark:border-[#3a3a3a] pt-3">
                <Link href="/dashboard/company-profile" className="flex items-center gap-1 text-[12px] font-medium text-[#c99d54] hover:text-[#a07830] transition-colors cursor-pointer">
                  Open company profile <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </DashboardSection>
        </div>

        {/* Right Sidebar Column */}
        <aside className="w-[272px] flex flex-col gap-2.5">
          <SideStat title="Customers" value={side.customers?.toString() ?? "—"} label="Total registered customers" href="/dashboard/customers" />
          <SideStat title="Items in Inventory" value={side.items?.toString() ?? "—"} label={`Products: ${side.items ?? 0}  ·  Services: 0`} href="/dashboard/items" />
          <Workload />
          <Activity />
          <MasterData />
          <Tips />
        </aside>
      </div>
    </div>
  );
}

function DashboardSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <span className="h-4 w-[3px] rounded-full bg-[#c99d54]" />
        <p className="text-sm font-bold text-[#1f2937] dark:text-[#f0f0f0]">{title}</p>
      </div>
      {children}
    </section>
  );
}

function SummaryCard({ title, count, postedCount = "0", unpostedCount = "0", returnCard, inventory, postedHref, unpostedHref }: { title: string; count: string; postedCount?: string; unpostedCount?: string; returnCard?: boolean; inventory?: boolean; postedHref?: string; unpostedHref?: string }) {
  return (
    <div className="flex w-full flex-col gap-2.5 rounded-xl border border-[#e8e9eb] dark:border-[#3a3a3a] bg-white dark:bg-[#242424] px-4 py-3.5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[12px] font-medium text-[#374151] dark:text-[#f0f0f0]">
          <span className="grid h-5 w-5 place-items-center rounded-md bg-[#f5ead7] dark:bg-[#2a2a2a] text-[#b88735]">
            {inventory ? <Box className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
          </span>
          {title}
        </span>
        <b className="text-[12px] text-[#374151] dark:text-[#f0f0f0]">{count}</b>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <Status title="Posted" value={postedCount} active={Number(postedCount) > 0} href={postedHref} />
        <Status title="Unposted" value={unpostedCount} href={unpostedHref} />
      </div>
    </div>
  );
}

function Status({ title, value, active, href }: { title: string; value: string; active?: boolean; href?: string }) {
  const inner = (
    <div className={`flex items-center justify-between rounded-lg bg-[#c99d54]/[0.13] dark:bg-[#c99d54]/[0.1] px-3 py-2.5${href ? " cursor-pointer hover:bg-[#c99d54]/25 dark:hover:bg-[#c99d54]/20 transition-colors" : ""}`}>
      <span className="text-[11px] font-medium text-[#7a5520] dark:text-[#c99d54]">{title}</span>
      <b className="text-[13px] font-bold text-[#5d3d0d] dark:text-[#e0b870]">{value}</b>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

/* ── PROFILE ROW COMPONENT ── */
interface ItemProps {
  icon: any;
  label: string;
  value: string;
}

function ProfileRow({ left, right }: { left: ItemProps; right: ItemProps }) {
  return (
    <div className="grid grid-cols-2 items-center rounded-lg bg-[#fdf8f0] dark:bg-[#2a2110] px-3 py-2.5">
      <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#A37934] text-white">
          <left.icon className="h-3.5 w-3.5 stroke-[2]" />
        </div>
        <div>
          <p className="text-[10px] font-medium leading-none text-[#6B7280] dark:text-[#9ca3af]">{left.label}</p>
          <p className="mt-0.5 text-[12px] font-semibold leading-none text-[#B88735] dark:text-[#c99d54]">{left.value}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 justify-self-start pl-8 md:pl-16">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#A37934] text-white">
          <right.icon className="h-3.5 w-3.5 stroke-[2]" />
        </div>
        <div>
          <p className="text-[10px] font-medium leading-none text-[#6B7280] dark:text-[#9ca3af]">{right.label}</p>
          <p className="mt-0.5 text-[12px] font-semibold leading-none text-[#B88735] dark:text-[#c99d54]">{right.value}</p>
        </div>
      </div>
    </div>
  );
}

/* ── SIDEBAR STAT CARD ── */
function SideStat({ title, value, label, href }: { title: string; value: string; label: string; href?: string }) {
  const inner = (
    <div className={`rounded-lg border border-[#e8e9eb] dark:border-[#3a3a3a] bg-white dark:bg-[#242424] px-4 py-3.5${href ? " cursor-pointer hover:border-[#d4b88a] dark:hover:border-[#5a3e1a] transition-colors" : ""}`}>
      <div className="flex justify-between text-[12px] font-medium text-[#4B5563] dark:text-[#9ca3af]">
        <span>{title}</span>
        <ArrowUpRight className="h-3.5 w-3.5 text-[#9CA3AF]" />
      </div>
      <b className="mt-1.5 block text-[26px] font-bold leading-none text-[#111827] dark:text-[#f0f0f0]">{value}</b>
      <p className="mt-1.5 text-[10px] text-[#9CA3AF]">{label}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

/* ── WORKLOAD SPLIT CARD ── */
function Workload() {
  return (
    <div className="rounded-lg border border-[#e8e9eb] dark:border-[#3a3a3a] bg-white dark:bg-[#242424] px-4 py-3.5">
      <p className="text-[12px] font-semibold text-[#1F2937] dark:text-[#f0f0f0]">Workload Split</p>
      <div className="mt-3 flex items-center justify-between">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-[6px] border-[#C69856] bg-white dark:bg-[#242424] text-xs font-bold text-[#1F2937] dark:text-[#f0f0f0]">
          859
        </div>

        <div className="flex-1 space-y-3 pl-4 text-xs font-medium text-[#4B5563] dark:text-[#9ca3af]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#C69856]" />
              Posted docs
            </span>
            <b className="font-semibold text-[#1F2937] dark:text-[#f0f0f0]">812</b>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#E5E7EB] dark:bg-[#555]" />
              Unposted docs
            </span>
            <b className="font-semibold text-[#1F2937] dark:text-[#f0f0f0]">47</b>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── ACTIVITY TREND CARD ── */
function Activity() {
  return (
    <div className="rounded-lg border border-[#e8e9eb] dark:border-[#3a3a3a] bg-white dark:bg-[#242424] px-4 py-3.5">
      <p className="text-[12px] font-semibold text-[#1F2937] dark:text-[#f0f0f0]">Activity Trend</p>

      <div className="relative mt-4 h-32 w-full">
        <div className="absolute left-0 top-0 flex h-24 flex-col justify-between text-[10px] font-medium text-[#9CA3AF]">
          <span>32</span>
          <span>16</span>
          <span>8</span>
          <span>0</span>
        </div>

        <div className="ml-5 h-24 w-[calc(100%-20px)]">
          <svg className="h-full w-full overflow-visible" viewBox="0 0 250 80" preserveAspectRatio="none">
            <defs>
              <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C69856" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#C69856" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path
              d="M0,70 Q 30,65 50,55 T 100,60 T 150,35 T 200,30 T 250,55 L 250,80 L 0,80 Z"
              fill="url(#activityGradient)"
            />
            <path
              d="M0,70 Q 30,65 50,55 T 100,60 T 150,35 T 200,30 T 250,55"
              fill="none"
              stroke="#C69856"
              strokeWidth="2.5"
            />
          </svg>
        </div>

        <div className="ml-5 mt-1 flex justify-between text-[9px] text-[#9CA3AF]">
          <span>Jan</span>
          <span>Feb</span>
          <span>Mar</span>
          <span>Apr</span>
          <span>May</span>
          <span>Jun</span>
          <span>Jul</span>
        </div>
      </div>

      <div className="mt-3 flex justify-between text-[10px] font-medium text-[#9CA3AF]">
        <span>Sales Invoices</span>
        <span>Purchase Invoices</span>
        <span>Returns</span>
      </div>
    </div>
  );
}

/* ── MASTER DATA CARD ── */
function MasterData() {
  return (
    <div className="rounded-lg border border-[#e8e9eb] dark:border-[#3a3a3a] bg-white dark:bg-[#242424] px-4 py-3.5">
      <p className="text-[12px] font-semibold text-[#1F2937] dark:text-[#f0f0f0]">Master Data</p>
      <div className="mt-4 space-y-3.5">
        {[
          ["Customer", "45%", "/dashboard/customers"],
          ["Vendors", "82%", "/dashboard/vendors"],
          ["Items", "56%", "/dashboard/items"],
        ].map(([name, val, href]) => (
          <Link key={name} href={href} className="block text-xs font-medium rounded-lg px-1 py-0.5 -mx-1 hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a] transition-colors">
            <div className="flex justify-between text-[#4B5563] dark:text-[#9ca3af]">
              <span>{name}</span>
              <b className="font-bold text-[#1F2937] dark:text-[#f0f0f0]">{val}</b>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#F3F4F6] dark:bg-[#333]">
              <div
                className="h-full rounded-full bg-[#C69856] transition-all duration-300"
                style={{ width: val }}
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ── QUICK TIPS CARD ── */
const ALL_TIPS = [
  "Use bulk actions on list pages to post or delete multiple documents.",
  "Run detail and summary reports from the Reports section.",
  "Keep your ERP data updated under Company Profile.",
  "Use Master Import to upload customers, items, and invoices at once.",
  "Use the customer picker on invoices to link records quickly.",
  "Post sales invoices to submit them to FBR.",
  "Add customers, vendors, and items before invoicing.",
  "Keep your company FBR token updated under Company Profile.",
  "Open Transactions from the sidebar to create and post invoices.",
];
const SHOW = 4;
const ITEM_H = 46; // px — fits 2 lines of wrapped text at 11px

function Tips() {
  const [offset, setOffset] = useState(0);
  const [sliding, setSliding] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const id = setInterval(() => setSliding(true), 5000);
    return () => clearInterval(id);
  }, []);

  const handleTransitionEnd = () => {
    if (!sliding) return;
    setSliding(false);
    setOffset(o => (o + 1) % ALL_TIPS.length);
  };

  // Render SHOW visible + 1 peeking below so the slide reveals it
  const shown = Array.from({ length: SHOW + 1 }, (_, i) =>
    ALL_TIPS[(offset + i) % ALL_TIPS.length]
  );

  return (
    <div className="rounded-lg border border-[#e8e9eb] dark:border-[#3a3a3a] bg-white dark:bg-[#242424] px-4 py-3.5">
      <div className="mb-2.5 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[12px] font-semibold text-[#1F2937] dark:text-[#f0f0f0]">
          <CircleHelp className="h-3.5 w-3.5 text-[#4B5563] dark:text-[#9ca3af]" /> Quick Tips
        </p>
        <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-500">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
        </span>
      </div>
      <div className="overflow-hidden" style={{ height: SHOW * ITEM_H }}>
        <ul
          ref={listRef}
          className="text-[11px] text-[#6B7280] dark:text-[#9ca3af]"
          style={{
            transform: sliding ? `translateY(-${ITEM_H}px)` : "translateY(0)",
            transition: sliding ? "transform 0.45s ease-in-out" : "none",
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {shown.map((tip, i) => (
            <li
              key={`${offset}-${i}`}
              className="flex items-start gap-1.5 leading-snug"
              style={{ height: ITEM_H, paddingTop: 2 }}
            >
              <span className="mt-[3px] h-1 w-1 shrink-0 rounded-full bg-[#c39445]" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}