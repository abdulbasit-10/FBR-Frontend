"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, CreditCard, FileText, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";

type Metric = {
  label: string;
  value: string;
  delta: string;
  icon: React.ComponentType<{ className?: string }>;
};

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const from = display;
    const durationMs = 650;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(from + (value - from) * eased);
      setDisplay(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span className="tabular-nums">{display.toLocaleString("en-US")}</span>;
}

export function InvoiceAnalyticsIllustration({ className }: { className?: string }) {
  const metrics = useMemo<Metric[]>(
    () => [
      { label: "Total invoices", value: "12,480", delta: "+8.2%", icon: FileText },
      { label: "Paid amount", value: "PKR 18.3M", delta: "+3.1%", icon: CreditCard },
      { label: "Pending payments", value: "284", delta: "-1.4%", icon: Activity },
      { label: "Monthly revenue", value: "PKR 4.9M", delta: "+5.6%", icon: TrendingUp },
    ],
    [],
  );

  return (
    <div
      className={cn(
        "group relative w-full overflow-hidden rounded-[28px] border border-primary/20 bg-gradient-to-br from-[#111827] via-[#0b1220] to-[#0f172a] shadow-[0_28px_80px_-30px_rgba(17,24,39,0.65)]",
        "transition-transform duration-500 will-change-transform hover:-translate-y-0.5",
        className,
      )}
    >
      {/* soft glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl"
      />

      {/* glass overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.10] via-white/[0.06] to-white/[0.02]" />

      <div className="relative p-6 sm:p-7">
        {/* header */}
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-1">
            <div className="text-sm font-semibold text-white/90">Invoice Analytics</div>
            <div className="text-xs text-white/60">Overview of your invoicing performance</div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/80 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-400/90 shadow-[0_0_0_3px_rgba(16,185,129,0.18)]" />
              Live
            </span>
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-white/20 to-white/5 ring-1 ring-white/10" />
          </div>
        </div>

        {/* stats */}
        {/* <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.label}
                className={cn(
                  "rounded-2xl border border-white/10 bg-white/95 p-3 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.45)]",
                  "transition-transform duration-300 hover:-translate-y-0.5",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[11px] font-semibold text-[#4b5563]">{m.label}</div>
                  <div className="grid h-7 w-7 place-items-center rounded-xl bg-[#111827]">
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="mt-2 text-sm font-extrabold tracking-tight text-[#111827]">
                  {m.value}
                </div>
                <div className="mt-1 text-[11px] font-semibold text-[#6b7280]">
                  <span className="text-emerald-600">{m.delta}</span> vs last month
                </div>
              </div>
            );
          })}
        </div> */}


        <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          {/* <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-white/80">Revenue (PKR)</div>
            <div className="text-[11px] font-semibold text-white/60">Last 30 days</div>
          </div> */}

          <div className="mt-3 grid gap-4 sm:grid-cols-[auto_1fr]">
            {/* y-axis */}
            <div className="hidden select-none flex-col justify-between text-[10px] font-semibold text-white/45 sm:flex">
              <span>5.0M</span>
              <span>3.5M</span>
              <span>2.0M</span>
              <span>0.5M</span>
            </div>

            <div className="relative">
              <svg
                viewBox="0 0 640 220"
                className="h-[170px] w-full overflow-visible"
                role="img"
                aria-label="Invoice analytics chart"
              >
                {/* grid */}
                {Array.from({ length: 5 }).map((_, i) => (
                  <line
                    key={i}
                    x1="0"
                    y1={24 + i * 42}
                    x2="640"
                    y2={24 + i * 42}
                    stroke="rgba(255,255,255,0.10)"
                    strokeWidth="1"
                  />
                ))}

                {/* area */}
                <path
                  d="M 0 170 C 80 120, 120 155, 180 112 C 250 62, 300 86, 360 74 C 430 60, 460 98, 520 72 C 585 44, 610 58, 640 40 L 640 220 L 0 220 Z"
                  fill="rgba(156,163,175,0.22)"
                />

                {/* line (animated draw) */}
                <path
                  d="M 0 170 C 80 120, 120 155, 180 112 C 250 62, 300 86, 360 74 C 430 60, 460 98, 520 72 C 585 44, 610 58, 640 40"
                  fill="none"
                  stroke="rgba(229,231,235,0.95)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  className="auth-draw-line"
                />

                {/* points */}
                {[
                  [0, 170],
                  [180, 112],
                  [250, 62],
                  [360, 74],
                  [520, 72],
                  [640, 40],
                ].map(([x, y], idx) => (
                  <g key={idx}>
                    <circle cx={x} cy={y} r="6" fill="rgba(17,24,39,0.95)" />
                    <circle cx={x} cy={y} r="3.25" fill="rgba(229,231,235,0.95)" />
                  </g>
                ))}
              </svg>

              {/* x-axis */}
              <div className="mt-2 flex select-none justify-between text-[10px] font-semibold text-white/45">
                <span>01</span>
                <span>08</span>
                <span>15</span>
                <span>22</span>
                <span>30</span>
              </div>
            </div>
          </div>
        </div>

      
      
      </div>
    </div>
  );
}

