import {
  FileText,
  ArrowUpRight,
  RefreshCw,
  Users,
  Package,
  Building2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/dashboard/stat-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { InventoryCard } from "@/components/dashboard/inventory-card";
import { ProfileCard } from "@/components/dashboard/profile-card";
import { QuickTipsCard } from "@/components/dashboard/quick-tips-card";
import { mockDashboard, charts, notifications, provinceAnalytics } from "@/lib/mock-data";

const currentDate = new Date().toLocaleDateString("en-PK", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

const salesInvoices =
  charts.invoiceStatusDistribution.find((i) => i.label === "Verified")
    ?.value || 0;
const pendingInvoices =
  charts.invoiceStatusDistribution.find((i) => i.label === "Submitted")
    ?.value || 0;
const processingInvoices =
  charts.invoiceStatusDistribution.find((i) => i.label === "Processing")
    ?.value || 0;
const totalInvoices = salesInvoices + pendingInvoices + processingInvoices;

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-0">
      {/* Hero Section */}
      <section className="rounded-xl border-border bg-white dark:bg-[#020617] p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{currentDate}</p>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back, Encova Solutions
            </h1>
            <p className="text-sm text-muted-foreground">
              Monitor your invoicing activity and business performance
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button className="bg-[#6B7280] hover:bg-[#4B5563] text-white rounded-lg">
              <FileText className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
            <Button
              variant="outline"
              className="rounded-lg border-border"
            >
              <ArrowUpRight className="h-4 w-4 mr-2" />
              View Reports
            </Button>
            <Button variant="ghost" size="icon" className="rounded-lg">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Transaction Summary */}
          <div>
            {/* <h2 className="text-lg font-semibold text-foreground mb-4">
              Transaction Summary
            </h2> */}
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard
                title="Sales Invoices"
                value={mockDashboard.transactionSummary.salesInvoices.total}
                subValue={`${mockDashboard.transactionSummary.salesInvoices.posted} posted · ${mockDashboard.transactionSummary.salesInvoices.unposted} unposted`}
                icon={FileText}
                trend={{
                  value: mockDashboard.transactionSummary.salesInvoices.trend,
                  label: "this month",
                }}
              />
              <StatCard
                title="Purchase Invoices"
                value={mockDashboard.transactionSummary.purchaseInvoices.total}
                subValue={`${mockDashboard.transactionSummary.purchaseInvoices.posted} posted · ${mockDashboard.transactionSummary.purchaseInvoices.unposted} unposted`}
                icon={FileText}
                trend={{
                  value: mockDashboard.transactionSummary.purchaseInvoices.trend,
                  label: "this month",
                }}
              />
              <StatCard
                title="Sales Returns"
                value={mockDashboard.transactionSummary.salesReturns.total}
                subValue={`${mockDashboard.transactionSummary.salesReturns.posted} posted · ${mockDashboard.transactionSummary.salesReturns.pending} pending`}
                icon={ArrowUpRight}
                trend={{
                  value: mockDashboard.transactionSummary.salesReturns.trend,
                  label: "this month",
                }}
              />
              <StatCard
                title="Purchase Returns"
                value={mockDashboard.transactionSummary.purchaseReturns.total}
                subValue={`${mockDashboard.transactionSummary.purchaseReturns.posted} posted · ${mockDashboard.transactionSummary.purchaseReturns.pending} pending`}
                icon={ArrowUpRight}
                trend={{
                  value: mockDashboard.transactionSummary.purchaseReturns.trend,
                  label: "this month",
                }}
              />
            </div>
          </div>

          {/* Activity Analytics */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Activity Analytics
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <ChartCard title="Transaction Trend">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-[#6B7280]" />
                    <span className="text-sm text-muted-foreground">Sales</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-gray-300" />
                    <span className="text-sm text-muted-foreground">
                      Purchases
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-orange-400" />
                    <span className="text-sm text-muted-foreground">Returns</span>
                  </div>
                </div>
                <div className="mt-4 h-32 flex items-end gap-1">
                  {[40, 65, 55, 80, 45, 70, 50].map((height, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-[#6B7280]/20 rounded-t-sm transition-all hover:bg-[#6B7280]/40"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-2">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                    (day, i) => (
                      <span key={i} className="text-xs text-muted-foreground">
                        {day}
                      </span>
                    )
                  )}
                </div>
              </ChartCard>

              <ChartCard title="Sales vs Purchases">
                <div className="flex items-center gap-8">
                  <div className="relative flex h-24 w-24 items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-8 border-gray-200 dark:border-gray-800" />
                    <div
                      className="absolute inset-0 rounded-full border-8 border-[#6B7280]"
                      style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
                    />
                    <div className="text-center">
                      <div className="text-lg font-bold text-foreground">
                        830
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Total
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-8">
                      <span className="text-sm text-muted-foreground">Sales</span>
                      <span className="text-sm font-bold text-foreground">
                        821
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-8">
                      <span className="text-sm text-muted-foreground">
                        Purchases
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        9
                      </span>
                    </div>
                  </div>
                </div>
              </ChartCard>
            </div>
          </div>

          {/* Workload Overview */}
          <Card className="border-border bg-white dark:bg-[#020617] shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-foreground">
                  Workload Overview
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-xs">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Posted Documents</span>
                  <span className="font-medium">{salesInvoices}</span>
                </div>
                <Progress
                  value={(salesInvoices / totalInvoices) * 100}
                  className="h-2 bg-gray-200 dark:bg-gray-800"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pending Documents</span>
                  <span className="font-medium">
                    {pendingInvoices + processingInvoices}
                  </span>
                </div>
                <Progress
                  value={
                    ((pendingInvoices + processingInvoices) / totalInvoices) * 100
                  }
                  className="h-2 bg-gray-200 dark:bg-gray-800"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Inventory Activity
                  </span>
                  <span className="font-medium">142</span>
                </div>
                <Progress
                  value={60}
                  className="h-2 bg-gray-200 dark:bg-gray-800"
                />
              </div>
            </CardContent>
          </Card>

          {/* Master Data Summary */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Master Data
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-border bg-white dark:bg-[#020617] shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#6B7280]/10">
                      <Users className="h-5 w-5 text-[#6B7280]" />
                    </div>
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Customers
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {mockDashboard.masterData.customers}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border bg-white dark:bg-[#020617] shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#6B7280]/10">
                      <Building2 className="h-5 w-5 text-[#6B7280]" />
                    </div>
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Vendors
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {mockDashboard.masterData.vendors}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border bg-white dark:bg-[#020617] shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#6B7280]/10">
                      <Package className="h-5 w-5 text-[#6B7280]" />
                    </div>
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Items
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {mockDashboard.masterData.items}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <InventoryCard inventory={mockDashboard.inventory} />
          <ProfileCard company={mockDashboard.companyProfile} />
          <QuickTipsCard tips={mockDashboard.quickTips} />
        </div>
      </div>
    </div>
  );
}
