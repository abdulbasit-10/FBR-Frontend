import { api } from "@/lib/api";
import { toQuery } from "./_types";

export interface DateRangeQuery {
    from?: string;
    to?: string;
}

export interface DailyReportRow {
    date: string;
    count: number;
    total: number;
    salesTax: number;
}

export interface MonthlyReportRow {
    month: string;
    count: number;
    total: number;
    salesTax: number;
}

export interface TaxReportRow {
    rate: string;
    itemCount: number;
    valueExcluding: number;
    salesTax: number;
    furtherTax: number;
    extraTax: number;
    fedPayable: number;
}

export interface SalesReportRow {
    // customer grouping
    customerId?: number;
    buyerBusinessName?: string;
    count?: number;
    total?: number;
    // product grouping
    productId?: number;
    productDescription?: string;
    qty?: number;
    sales?: number;
    salesTax: number;
}

export interface SalesReportQuery extends DateRangeQuery {
    groupBy?: "customer" | "product";
}

export type ScenarioStatus = "Successful" | "Attempted" | "Not Started";

export interface ScenarioProgressRow {
    scenarioId: string;
    description: string;
    status: ScenarioStatus;
    attempts: number;
    lastAttemptAt: string | null;
}

export interface ScenarioProgressResult {
    businessActivity: string | null;
    sector: string | null;
    environment: string;
    completed: number;
    total: number;
    productionReady: boolean;
    rows: ScenarioProgressRow[];
}

export const reportsService = {
    daily: (q?: DateRangeQuery) =>
        api.get<DailyReportRow[]>(`/reports/daily${toQuery(q as Record<string, unknown>)}`),
    monthly: (q?: DateRangeQuery) =>
        api.get<MonthlyReportRow[]>(`/reports/monthly${toQuery(q as Record<string, unknown>)}`),
    tax: (q?: DateRangeQuery) =>
        api.get<TaxReportRow[]>(`/reports/tax${toQuery(q as Record<string, unknown>)}`),
    sales: (q?: SalesReportQuery) =>
        api.get<SalesReportRow[]>(`/reports/sales${toQuery(q as Record<string, unknown>)}`),
    /** FBR sandbox certification checklist — which scenarios have a successful test invoice. */
    scenarioProgress: () => api.get<ScenarioProgressResult>("/reports/scenario-progress"),
};
