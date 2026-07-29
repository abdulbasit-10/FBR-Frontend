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

const gold = "#c99d54";

export default function DashboardPage() {
  return (
    <div
      className="mx-auto max-w-[1440px] font-sans text-[#4f5967]"
      style={{ fontFamily: 'var(--font-inter), sans-serif' }}
    >
      {/* Top Banner */}
      <section className="relative overflow-hidden rounded-xl bg-[linear-gradient(110deg,#c99d54,#a6782d)] px-6 py-7 text-white shadow-sm">
        <div className="absolute -right-10 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-white/15" />
        <p className="relative text-xs">Fri, 17 July 2026</p>
        <h1 className="relative mt-1 text-[28px] font-semibold leading-none">Welcome Back!</h1>
        <p className="relative mt-3 text-xs">BIO WORLD TRADERS — 873 documents · 41 awaiting post</p>
        <div className="relative mt-4 flex flex-wrap gap-2 md:absolute md:right-5 md:top-1/2 md:mt-0 md:-translate-y-1/2">
          <Link href="/dashboard/sales/create-invoice" className="flex h-[33px] items-center gap-1 rounded-[8px] bg-white px-3 py-2 text-center text-[14px] font-medium leading-none tracking-normal text-[#5d5750]">
            New Sales Invoice <ArrowUpRight className="inline h-3 w-3" />
          </Link>
          <button className="flex h-[33px] items-center rounded-[8px] bg-white px-3 py-2 text-center text-[14px] font-medium leading-none tracking-normal text-[#5d5750]">
            View Reports
          </button>
          <button className="flex h-[33px] items-center gap-1 rounded-[8px] bg-white px-3 py-2 text-center text-[14px] font-medium leading-none tracking-normal text-[#5d5750]">
            <RefreshCw className="inline h-3 w-3" /> Refresh data
          </button>
        </div>
      </section>

      {/* Main Grid: Standard top alignment */}
      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[1fr_307px]">
        {/* Left Column */}
        <div className="space-y-4">
          <DashboardSection title="Sales">
            <div className="grid gap-2 sm:grid-cols-2">
              <SummaryCard title="Sales Invoices" count="11" />
              <SummaryCard title="Sales Returns" count="0" returnCard />
            </div>
          </DashboardSection>

          <DashboardSection title="Purchases">
            <div className="grid gap-2 sm:grid-cols-2">
              <SummaryCard title="Sales Invoices" count="11" />
              <SummaryCard title="Purchase Returns" count="0" returnCard />
            </div>
          </DashboardSection>

          <DashboardSection title="Inventory">
            <div className="grid gap-2 sm:grid-cols-2">
              <SummaryCard title="Posted Adjustments" count="11" inventory />
              <SummaryCard title="Unposted Adjustments" count="11" inventory />
            </div>
          </DashboardSection>

          {/* ── COMPANY PROFILE SECTION ── */}
          <DashboardSection title="Company Profile">
            <div className="rounded-[16px] border border-[#e8e9eb] bg-white p-6 shadow-sm">
              {/* Header */}
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#a37934] text-xs font-bold text-white">
                  ES
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1f2937]">BIO Encova Solution</h3>
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
            </div>
          </DashboardSection>
        </div>

        {/* Right Sidebar Column */}
        <aside className="w-[307px] space-y-3">
          <SideStat title="Customers" value="209" label="Total registered customers" />
          <SideStat title="Items in Inventory" value="237" label="Products: 9  ·  Services: 228" />
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
      <p className="mb-2 text-sm font-semibold text-[#3f4854]">{title}</p>
      {children}
    </section>
  );
}

function SummaryCard({ title, count, returnCard, inventory }: { title: string; count: string; returnCard?: boolean; inventory?: boolean }) {
  return (
    <div className="flex w-full flex-col gap-[10px] rounded-[14px] border border-[#e8e9eb] bg-white pb-[22px] pl-[14px] pr-[14px] pt-[22px] shadow-[0_1px_3px_rgba(0,0,0,.04)]">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-[#f5ead7] text-[#b88735]">
            {inventory ? <Box className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
          </span>
          {title}
        </span>
        <b className="text-sm">{count}</b>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Status title="Posted" value={returnCard ? "11" : "11"} active />
        <Status title="Unposted" value="0" />
      </div>
    </div>
  );
}

function Status({ title, value, active }: { title: string; value: string; active?: boolean }) {
  return (
    <div className="flex w-full flex-col gap-[10px] rounded-[8px] border border-[#c8a060]/40 bg-[#C69856]/90 p-[10px] text-[10px] text-[#4d422f]">
      <div className="flex justify-between">
        <span>{title}</span>
        <b>{value}</b>
      </div>
      <span className="inline-block self-start rounded-full bg-white px-2 py-0.5 text-[9px]">
        {active ? "Active" : "Pending"}
      </span>
    </div>
  );
}

/* ── PROFILE ROW COMPONENT ── */
interface ItemProps {
  icon: any;
  label: string;
  value: string;
}

function ProfileRow({ left, right }: { left: ItemProps; right: ItemProps }) {
  return (
    <div className="grid grid-cols-2 items-center rounded-[8px] bg-[#FBF7F0] px-4 py-3.5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#A37934] text-white">
          <left.icon className="h-4 w-4 stroke-[2]" />
        </div>
        <div>
          <p className="text-[13px] font-medium leading-none text-[#6B7280]">{left.label}</p>
          <p className="mt-1 text-[13px] font-semibold leading-none text-[#B88735]">{left.value}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 justify-self-start pl-8 md:pl-16">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#A37934] text-white">
          <right.icon className="h-4 w-4 stroke-[2]" />
        </div>
        <div>
          <p className="text-[13px] font-medium leading-none text-[#6B7280]">{right.label}</p>
          <p className="mt-1 text-[13px] font-semibold leading-none text-[#B88735]">{right.value}</p>
        </div>
      </div>
    </div>
  );
}

/* ── SIDEBAR STAT CARD ── */
function SideStat({ title, value, label }: { title: string; value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-[#e8e9eb] bg-white p-[16.5px] shadow-[0_1px_3px_rgba(0,0,0,.04)]">
      <div className="flex justify-between text-[13px] font-medium text-[#4B5563]">
        <span>{title}</span>
        <ArrowUpRight className="h-4 w-4 text-[#9CA3AF]" />
      </div>
      <b className="mt-2 block text-[32px] font-bold leading-none text-[#111827]">{value}</b>
      <p className="mt-2 text-[11px] text-[#9CA3AF]">{label}</p>
    </div>
  );
}

/* ── WORKLOAD SPLIT CARD ── */
function Workload() {
  return (
    <div className="rounded-2xl border border-[#e8e9eb] bg-white p-[16.5px] shadow-[0_1px_3px_rgba(0,0,0,.04)]">
      <p className="text-sm font-bold text-[#1F2937]">Workload Split</p>
      <div className="mt-4 flex items-center justify-between">
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-[7px] border-[#C69856] bg-white text-xs font-bold text-[#1F2937]">
          859
        </div>

        <div className="flex-1 space-y-3 pl-4 text-xs font-medium text-[#4B5563]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#C69856]" />
              Posted docs
            </span>
            <b className="font-semibold text-[#1F2937]">812</b>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#E5E7EB]" />
              Unposted docs
            </span>
            <b className="font-semibold text-[#1F2937]">47</b>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── ACTIVITY TREND CARD ── */
function Activity() {
  return (
    <div className="rounded-2xl border border-[#e8e9eb] bg-white p-[16.5px] shadow-[0_1px_3px_rgba(0,0,0,.04)]">
      <p className="text-sm font-bold text-[#1F2937]">Activity Trend</p>

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
    <div className="rounded-2xl border border-[#e8e9eb] bg-white p-[16.5px] shadow-[0_1px_3px_rgba(0,0,0,.04)]">
      <p className="text-sm font-bold text-[#1F2937]">Master Data</p>
      <div className="mt-4 space-y-3.5">
        {[
          ["Customer", "45%"],
          ["Vendors", "82%"],
          ["Items", "56%"],
        ].map(([name, val]) => (
          <div key={name} className="text-xs font-medium">
            <div className="flex justify-between text-[#4B5563]">
              <span>{name}</span>
              <b className="font-bold text-[#1F2937]">{val}</b>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
              <div
                className="h-full rounded-full bg-[#C69856] transition-all duration-300"
                style={{ width: val }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── QUICK TIPS CARD ── */
function Tips() {
  return (
    <div className="rounded-2xl border border-[#e8e9eb] bg-white p-[16.5px] shadow-[0_1px_3px_rgba(0,0,0,.04)]">
      <p className="flex items-center gap-2 text-sm font-bold text-[#1F2937]">
        <CircleHelp className="h-4 w-4 text-[#4B5563]" /> Quick Tips
      </p>
      <ul className="mt-4 space-y-3 text-[11px] leading-relaxed text-[#6B7280]">
        <li>Use bulk Actions list pages to post or delete multiple documents.</li>
        <li>Run detail and summary reports from the Reports section.</li>
        <li>Keep your company ERP data updated under Company Profile.</li>
        <li>Use Master Import to upload customers, items, and sales invoices in one go.</li>
      </ul>
    </div>
  );
}