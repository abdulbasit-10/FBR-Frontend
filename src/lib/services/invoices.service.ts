import { api } from "@/lib/api";
import { toQuery, type Paginated } from "./_types";

// Mirrors backend model FBR-Backend/src/models/Invoice.ts
export type InvoiceType = "Sale Invoice" | "Debit Note";
export type InvoiceStatus = "draft" | "validated" | "posted" | "failed" | "cancelled";
export type InvoiceEnvironment = "sandbox" | "production";

export interface InvoiceCustomerSummary {
    id: number;
    businessName: string;
    ntnCnic: string | null;
}

export interface Invoice {
    id: number;
    uuid: string;
    companyId: number;
    customerId: number;
    createdBy: number;

    invoiceType: InvoiceType;
    invoiceDate: string;
    postingDate: string | null;
    poDate: string | null;
    poNumber: string | null;
    invoiceRefNo: string | null;
    scenarioId: string | null;

    status: InvoiceStatus;
    environment: InvoiceEnvironment;

    sellerNtnCnic: string;
    sellerBusinessName: string;
    sellerProvince: string;
    sellerAddress: string;
    buyerNtnCnic: string | null;
    buyerBusinessName: string;
    buyerProvince: string;
    buyerAddress: string;
    buyerRegistrationType: string;

    totalValueExcludingST: number;
    totalSalesTax: number;
    totalFurtherTax: number;
    totalExtraTax: number;
    totalFedPayable: number;
    totalDiscount: number;
    totalValueIncludingST: number;
    advanceTax: number;

    fbrInvoiceNumber: string | null;
    fbrDated: string | null;
    fbrStatusCode: string | null;
    fbrStatus: string | null;
    fbrErrorCode: string | null;
    fbrError: string | null;

    postedAt: string | null;
    notes: string | null;
    mappingId: string | null;

    createdAt: string;
    updatedAt: string;

    customer?: InvoiceCustomerSummary;
    creator?: { id: number; name: string } | null;
    items?: InvoiceItem[];
}

export interface InvoiceItem {
    id: number;
    invoiceId: number;
    productId: number | null;
    itemSrNo: number;
    hsCode: string;
    productDescription: string;
    rate: string;
    uom: string;
    quantity: number;
    totalValues: number;
    valueSalesExcludingST: number;
    fixedNotifiedValueOrRetailPrice: number;
    salesTaxApplicable: number;
    salesTaxWithheldAtSource: number;
    extraTax: number;
    furtherTax: number;
    sroScheduleNo: string | null;
    fedPayable: number;
    discount: number;
    saleType: string;
    sroItemSerialNo: string | null;
    unitPrice: number;
    discountPercent: number;
    // Per-item FBR response (mirrors FBR-Backend/src/models/InvoiceItem.ts)
    fbrInvoiceNo: string | null;
    fbrStatusCode: string | null;
    fbrStatus: string | null;
    fbrErrorCode: string | null;
    fbrError: string | null;
}

export interface CreateInvoiceItemInput {
    productId?: number | null;
    hsCode: string;
    productDescription: string;
    rate: string;
    uom: string;
    quantity: number;
    totalValues?: number;
    valueSalesExcludingST: number;
    fixedNotifiedValueOrRetailPrice?: number;
    salesTaxApplicable: number;
    salesTaxWithheldAtSource?: number;
    extraTax?: number;
    furtherTax?: number;
    sroScheduleNo?: string | null;
    fedPayable?: number;
    discount?: number;
    saleType: string;
    sroItemSerialNo?: string | null;
    unitPrice?: number;
    discountPercent?: number;
}

export interface CreateInvoiceInput {
    customerId: number;
    invoiceType?: InvoiceType;
    invoiceDate: string; // YYYY-MM-DD
    invoiceRefNo?: string | null;
    scenarioId?: string | null;
    postingDate?: string | null;
    poDate?: string | null;
    poNumber?: string | null;
    advanceTax?: number;
    environment?: InvoiceEnvironment;
    notes?: string | null;
    mappingId?: string | null;
    items: CreateInvoiceItemInput[];
}

export interface InvoiceListQuery {
    page?: number;
    limit?: number;
    status?: InvoiceStatus;
    customerId?: number;
    from?: string;
    to?: string;
    search?: string;
    sortBy?: string;
    sortDir?: "asc" | "desc" | "ASC" | "DESC";
}

export const invoicesService = {
    list: (q?: InvoiceListQuery) =>
        api.get<Paginated<Invoice>>(`/invoices${toQuery(q as Record<string, unknown>)}`),
    getOne: (uuid: string) => api.get<Invoice>(`/invoices/${uuid}`),
    create: (data: CreateInvoiceInput) => api.post<Invoice>("/invoices", data),
    update: (uuid: string, data: Partial<CreateInvoiceInput>) =>
        api.put<Invoice>(`/invoices/${uuid}`, data),
    remove: (uuid: string) => api.delete<null>(`/invoices/${uuid}`),
    /** Synchronous submit to FBR — mode: 'validate' (dry run) or 'post' (final). */
    submit: (uuid: string, mode: "validate" | "post" = "post") =>
        api.post<Invoice>(`/invoices/${uuid}/submit`, { mode }),
    /** Queue-backed submit (returns immediately, worker processes it). */
    enqueue: (uuid: string, mode: "validate" | "post" = "post") =>
        api.post<{ jobId: string }>(`/invoices/${uuid}/enqueue`, { mode }),
};
