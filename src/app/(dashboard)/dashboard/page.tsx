import {
  Activity,
  BadgeCheck,
  BellRing,
  Building2,
  ChartBar,
  CircleAlert,
  Clock3,
  DatabaseZap,
  FileSpreadsheet,
  Globe2,
  Landmark,
  Layers3,
  ReceiptText,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  apiAnalytics,
  charts,
  dashboardCards,
  dashboardFilters,
  notifications,
  provinceAnalytics,
  recentApplications,
  recentInvoices,
  topTaxpayersByTaxPaid,
} from "@/lib/mock-data";

const cardMeta = {
  totalRegisteredTaxpayers: { icon: Users, gradient: "from-primary to-primary/70" },
  activeTaxpayers: { icon: UserCheck, gradient: "from-emerald-500 to-green-500" },
  inactiveTaxpayers: { icon: CircleAlert, gradient: "from-primary/70 to-primary/40" },
  pendingApplications: { icon: Clock3, gradient: "from-primary to-primary/70" },
  approvedApplications: { icon: BadgeCheck, gradient: "from-primary to-primary/70" },
  rejectedApplications: { icon: CircleAlert, gradient: "from-rose-500 to-red-500" },
  totalDigitalInvoices: { icon: ReceiptText, gradient: "from-primary to-primary/70" },
  totalTaxCollected: { icon: Landmark, gradient: "from-primary to-primary/70" },
  monthlyTaxCollection: { icon: ChartBar, gradient: "from-primary to-primary/70" },
  todaysSubmittedInvoices: { icon: FileSpreadsheet, gradient: "from-primary to-primary/70" },
  apiSuccessRate: { icon: DatabaseZap, gradient: "from-emerald-500 to-green-500" },
  failedApiRequests: { icon: CircleAlert, gradient: "from-rose-500 to-red-500" },
  productionIntegrations: { icon: ShieldCheck, gradient: "from-primary to-primary/70" },
  sandboxIntegrations: { icon: Layers3, gradient: "from-primary to-primary/70" },
} as const;

function formatValue(value: number, unit?: "count" | "currency" | "percent") {
  if (unit === "currency") {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      notation: value >= 1_000_000 ? "compact" : "standard",
      maximumFractionDigits: 1,
    }).format(value);
  }

  if (unit === "percent") {
    return `${value.toFixed(2)}%`;
  }

  return new Intl.NumberFormat("en-PK").format(value);
}

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getProgressWidth(value: number, max: number) {
  return `${Math.max(10, (value / Math.max(max, 1)) * 100)}%`;
}

export default function DashboardPage() {
  const currentDate = new Date().toLocaleDateString("en-PK", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const maxDailyInvoices = Math.max(...charts.dailyInvoiceSubmission.map((item) => item.value));
  const maxMonthlyInvoices = Math.max(...charts.monthlyInvoiceTrend.map((item) => item.value));
  const maxProvinceTax = Math.max(...charts.provinceWiseTaxCollection.map((item) => item.value));
  const maxTaxpayerTax = Math.max(...charts.top10TaxpayersByTaxPaid.map((item) => item.value));
  const maxEndpointCount = Math.max(...apiAnalytics.topEndpoints.map((item) => item.value));

  return (
    <div className="flex flex-col gap-8">
      <section className="reveal-card overflow-hidden rounded-[2rem] border border-white/50 bg-gradient-to-br from-primary via-primary/85 to-primary/70 p-8 text-white shadow-[0_30px_80px_-20px_rgba(107,114,128,0.45)]">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-4">
            <Badge className="border-white/20 bg-white/15 text-white backdrop-blur-sm">
              FBR Digital Invoicing Portal
            </Badge>
            <div className="space-y-3">
              <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
                National digital invoicing, taxpayer compliance, and API monitoring in one control center.
              </h1>
             
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[360px]">
            <div className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-sm text-white/70">Reporting Date</p>
              <p className="mt-2 text-lg font-bold">{currentDate}</p>
            </div>
            <div className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-sm text-white/70">Primary Filter</p>
              <p className="mt-2 text-lg font-bold">Last 30 Days</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {dashboardFilters.map((filter, index) => (
            <Badge
              key={filter}
              className={
                index === 3
                  ? "border-white/15 bg-white text-primary"
                  : "border-white/15 bg-white/10 text-white"
              }
            >
              {filter}
            </Badge>
          ))}
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {dashboardCards.map((card) => {
          const meta = cardMeta[card.key as keyof typeof cardMeta];
          const Icon = meta.icon;
          const positive = card.trend >= 0;

          return (
            <Card
              key={card.key}
              className="reveal-card border border-white/50 bg-gradient-to-br from-card via-card to-muted/20 shadow-[0_24px_60px_-22px_rgba(15,23,42,0.18)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_30px_80px_-24px_rgba(15,23,42,0.24)] dark:border-white/10 dark:shadow-[0_24px_60px_-22px_rgba(0,0,0,0.45)]"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardDescription className="text-xs font-semibold uppercase tracking-[0.18em]">
                      {card.title}
                    </CardDescription>
                    <CardTitle className="mt-3 text-3xl font-extrabold tracking-tight">
                      {formatValue(card.value, card.unit)}
                    </CardTitle>
                  </div>
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.gradient} text-white shadow-lg`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-2 overflow-hidden rounded-full bg-muted/70">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${meta.gradient}`}
                    style={{ width: `${Math.min(100, Math.abs(card.trend) * 4 + 20)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">{card.description}</span>
                  <span
                    className={
                      positive
                        ? "rounded-full bg-emerald-500/10 px-2 py-1 font-bold text-emerald-600 dark:text-emerald-400"
                        : "rounded-full bg-rose-500/10 px-2 py-1 font-bold text-rose-600 dark:text-rose-400"
                    }
                  >
                    {positive ? "+" : ""}
                    {card.trend}%
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <Card className="reveal-card border border-white/50 bg-gradient-to-br from-card via-card to-muted/20 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.18)] dark:border-white/10">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-extrabold">Invoice Monitoring</CardTitle>
              <CardDescription>Daily submissions and monthly filing momentum across Pakistan</CardDescription>
            </div>
            <Badge variant="outline" className="rounded-full px-3 py-1">
              Line + Area Snapshot
            </Badge>
          </CardHeader>
          <CardContent className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Daily Invoice Submission
                </h3>
                <span className="text-sm font-semibold text-muted-foreground">
                  Last 14 days
                </span>
              </div>
              <div className="flex h-52 items-end gap-2 rounded-3xl border border-border/60 bg-gradient-to-b from-background to-muted/30 p-4">
                {charts.dailyInvoiceSubmission.map((item, index) => (
                  <div key={item.label} className="flex flex-1 flex-col items-center justify-end gap-2">
                    <div
                      className={`w-full rounded-t-2xl bg-gradient-to-t ${index % 2 === 0 ? "from-primary to-primary/60" : "from-primary/80 to-primary/50"} shadow-lg`}
                      style={{ height: `${Math.max(14, (item.value / maxDailyInvoices) * 100)}%` }}
                    />
                    <span className="text-[10px] font-medium text-muted-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Monthly Invoice Trend
                </h3>
                <span className="text-sm font-semibold text-muted-foreground">
                  Last 12 months
                </span>
              </div>
              <div className="space-y-3 rounded-3xl border border-border/60 bg-gradient-to-b from-background to-muted/30 p-4">
                {charts.monthlyInvoiceTrend.map((item) => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">{item.label}</span>
                      <span className="text-muted-foreground">{item.value} invoices</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
                        style={{ width: `${Math.max(12, (item.value / maxMonthlyInvoices) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Taxable volume {formatCompactCurrency(item.taxableAmount)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="reveal-card border border-white/50 bg-gradient-to-br from-card via-card to-muted/20 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.18)] dark:border-white/10">
          <CardHeader>
            <CardTitle className="text-2xl font-extrabold">API Performance</CardTitle>
            <CardDescription>Integration health for taxpayer and invoice endpoints</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-border/60 bg-background/70 p-4">
                <p className="text-sm text-muted-foreground">Average Response Time</p>
                <p className="mt-2 text-2xl font-extrabold">{apiAnalytics.averageResponseTime} ms</p>
              </div>
              <div className="rounded-3xl border border-border/60 bg-background/70 p-4">
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="mt-2 text-2xl font-extrabold">{apiAnalytics.successRate}%</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <span>Top Endpoints</span>
                <span>Calls</span>
              </div>
              {apiAnalytics.topEndpoints.slice(0, 5).map((endpoint) => (
                <div key={endpoint.label} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{endpoint.label}</span>
                    <span className="text-muted-foreground">{endpoint.value}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                      style={{ width: getProgressWidth(endpoint.value, maxEndpointCount) }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {charts.apiSuccessVsFailure.map((item, index) => (
                <div
                  key={item.label}
                  className={`rounded-3xl border p-4 ${index === 0 ? "border-emerald-500/20 bg-emerald-500/10" : "border-rose-500/20 bg-rose-500/10"}`}
                >
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="mt-2 text-2xl font-extrabold">{item.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_1fr_1fr]">
        <Card className="reveal-card border border-white/50 bg-gradient-to-br from-card via-card to-muted/20 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.18)] dark:border-white/10">
          <CardHeader>
            <CardTitle className="text-2xl font-extrabold">Province-wise Tax Collection</CardTitle>
            <CardDescription>Net tax performance across all supported regions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {charts.provinceWiseTaxCollection.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{item.label}</span>
                  <span className="text-muted-foreground">{formatCompactCurrency(item.value)}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted/80">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
                    style={{ width: getProgressWidth(item.value, maxProvinceTax) }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="reveal-card border border-white/50 bg-gradient-to-br from-card via-card to-muted/20 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.18)] dark:border-white/10">
          <CardHeader>
            <CardTitle className="text-2xl font-extrabold">Compliance Snapshot</CardTitle>
            <CardDescription>Invoice, application, and integration distribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Invoice Status
              </h3>
              {charts.invoiceStatusDistribution.map((item, index) => (
                <div key={item.label} className="flex items-center justify-between rounded-2xl bg-background/70 px-4 py-3">
                  <span className="font-medium">{item.label}</span>
                  <Badge
                    className={
                      index === 0
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : index === 3
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          : "bg-primary/10 text-primary dark:text-primary"
                    }
                  >
                    {item.value}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Application Status
              </h3>
              {charts.applicationStatusDistribution.map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{item.label}</span>
                    <span className="font-semibold">{item.value}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
                      style={{ width: getProgressWidth(item.value, 40) }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="reveal-card border border-white/50 bg-gradient-to-br from-card via-card to-muted/20 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.18)] dark:border-white/10">
          <CardHeader>
            <CardTitle className="text-2xl font-extrabold">Recent Notifications</CardTitle>
            <CardDescription>Latest events across FBR modules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.map((item) => (
              <div key={item.id} className="rounded-3xl border border-border/60 bg-background/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-bold">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <BellRing className="mt-1 h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {item.timestamp}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card className="reveal-card border border-white/50 bg-gradient-to-br from-card via-card to-muted/20 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.18)] dark:border-white/10">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-extrabold">Latest Digital Invoices</CardTitle>
              <CardDescription>Recent taxpayer submissions across sales and purchase streams</CardDescription>
            </div>
            <Button variant="outline" className="rounded-2xl">
              Export View
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Taxpayer</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Tax</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-semibold">{invoice.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground">{formatShortDate(invoice.submissionDate)}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="max-w-[220px] truncate font-semibold">{invoice.taxpayerName}</p>
                        <p className="text-xs text-muted-foreground">NTN {invoice.taxpayerNTN}</p>
                      </div>
                    </TableCell>
                    <TableCell>{invoice.businessSector}</TableCell>
                    <TableCell>{invoice.city}, {invoice.province}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          invoice.status === "Verified"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : invoice.status === "Rejected"
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              : "bg-primary/10 text-primary dark:text-primary"
                        }
                      >
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCompactCurrency(invoice.invoiceAmount)}</TableCell>
                    <TableCell>{formatCompactCurrency(invoice.taxAmount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card className="reveal-card border border-white/50 bg-gradient-to-br from-card via-card to-muted/20 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.18)] dark:border-white/10">
            <CardHeader>
              <CardTitle className="text-2xl font-extrabold">Top 10 Taxpayers</CardTitle>
              <CardDescription>Ranked by verified tax paid</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {topTaxpayersByTaxPaid.map((taxpayer, index) => (
                <div key={taxpayer.NTN} className="space-y-2 rounded-3xl border border-border/60 bg-background/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-sm font-extrabold text-white">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-bold">{taxpayer.companyName}</p>
                        <p className="text-xs text-muted-foreground">
                          {taxpayer.businessSector} · {taxpayer.city}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-bold">{formatCompactCurrency(taxpayer.totalTaxPaid)}</p>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
                      style={{ width: getProgressWidth(taxpayer.totalTaxPaid, maxTaxpayerTax) }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="reveal-card border border-white/50 bg-gradient-to-br from-card via-card to-muted/20 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.18)] dark:border-white/10">
            <CardHeader>
              <CardTitle className="text-2xl font-extrabold">License Integrator Queue</CardTitle>
              <CardDescription>Most recent application movement toward production</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentApplications.slice(0, 6).map((application) => (
                <div key={application.applicationId} className="rounded-3xl border border-border/60 bg-background/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-bold">{application.companyName}</p>
                      <p className="text-sm text-muted-foreground">{application.remarks}</p>
                    </div>
                    <Badge
                      className={
                        application.status === "Approved"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : application.status === "Rejected"
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            : "bg-primary/10 text-primary dark:text-primary"
                      }
                    >
                      {application.status}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    <span>{application.apiTestingStatus}</span>
                    <span>{formatShortDate(application.submissionDate)}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-4">
        <Card className="reveal-card border border-white/50 bg-gradient-to-br from-card via-card to-muted/20 dark:border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-extrabold">
              <Building2 className="h-5 w-5 text-primary" />
              Taxpayer Portal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Submit digital invoices</p>
            <p>Manage invoice lifecycle</p>
            <p>Review sales and purchase summary</p>
            <p>Track API integration status</p>
          </CardContent>
        </Card>

        <Card className="reveal-card border border-white/50 bg-gradient-to-br from-card via-card to-muted/20 dark:border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-extrabold">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              Integrator Portal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Review onboarding applications</p>
            <p>Approve and reject taxpayer requests</p>
            <p>Promote approved taxpayers to production</p>
            <p>Monitor sandbox certification</p>
          </CardContent>
        </Card>

        <Card className="reveal-card border border-white/50 bg-gradient-to-br from-card via-card to-muted/20 dark:border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-extrabold">
              <Globe2 className="h-5 w-5 text-primary" />
              Geographic Coverage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {provinceAnalytics.slice(0, 4).map((province) => (
              <div key={province.province} className="flex items-center justify-between">
                <span>{province.province}</span>
                <span className="font-semibold text-foreground">{province.taxpayers} taxpayers</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="reveal-card border border-white/50 bg-gradient-to-br from-card via-card to-muted/20 dark:border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-extrabold">
              <Activity className="h-5 w-5 text-primary" />
              Revenue Growth
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {charts.revenueGrowth.slice(-4).map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-2xl bg-background/70 px-4 py-3">
                <span className="font-medium">{item.label}</span>
                <span className={item.value >= 0 ? "font-bold text-emerald-500" : "font-bold text-rose-500"}>
                  {item.value >= 0 ? "+" : ""}
                  {item.value}%
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
