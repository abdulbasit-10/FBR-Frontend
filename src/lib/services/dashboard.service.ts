import { api } from "@/lib/api";

// Shape mirrors FBR-Backend/src/services/dashboard.service.ts → getDashboard()

export interface DocCount {
    total: number;
    posted: number;
    unposted: number;
}

export interface DashboardCards {
    totalInvoices: number;
    acceptedInvoices: number;
    pendingInvoices: number;
    rejectedInvoices: number;
    totalSales: number;
    todaySales: number;
    todayCount: number;
    monthSales: number;
    monthCount: number;
    docCounts: {
        salesInvoices: DocCount;
        salesReturns: DocCount;
        purchaseInvoices: DocCount;
        purchaseReturns: DocCount;
        inventoryAdjustments: DocCount;
    };
    workload: {
        posted: number;
        unposted: number;
    };
}

export interface MonthlySalesRow {
    month: string;
    sales: number;
    count: number;
}

export interface MonthlyActivityRow {
    month: string;
    count: number;
}

export interface InvoiceStatusRow {
    status: string;
    count: number;
    sum: number;
}

export interface TaxSummary {
    salesTax: number;
    furtherTax: number;
    extraTax: number;
    fedPayable: number;
}

export interface DashboardCharts {
    monthlySales: MonthlySalesRow[];
    monthlyActivity: MonthlyActivityRow[];
    invoiceStatus: InvoiceStatusRow[];
    taxSummary: TaxSummary;
}

export interface DashboardResponse {
    cards: DashboardCards;
    charts: DashboardCharts;
    tables: {
        recentInvoices: Array<{
            id: number;
            uuid: string;
            invoiceType: string;
            invoiceDate: string;
            status: string;
            buyerBusinessName: string;
            totalValueIncludingST: number;
            fbrInvoiceNumber: string | null;
            createdAt: string;
        }>;
    };
}

export const dashboardService = {
    get: () => api.get<DashboardResponse>("/dashboard"),
};
