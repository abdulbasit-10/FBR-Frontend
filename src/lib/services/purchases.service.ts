import { api } from "@/lib/api";
import { toQuery, type Paginated } from "./_types";

// Mirrors backend model FBR-Backend/src/models/Purchase.ts
export type PurchaseType = "Purchase Invoice" | "Purchase Return";
export type PurchaseStatus = "draft" | "posted" | "cancelled";
export type PurchaseSource = "Manual" | "API" | "Import";

export interface PurchaseVendorSummary {
    id: number;
    vendorNo: string | null;
    businessName: string;
    ntnCnic: string | null;
}

export interface Purchase {
    id: number;
    uuid: string;
    companyId: number;
    vendorId: number;
    createdBy: number;

    purchaseNo: string | null;
    purchaseType: PurchaseType;
    originalPurchaseId: number | null;
    vendorInvoiceNo: string | null;
    docDate: string;
    postingDate: string | null;
    poDate: string | null;
    poNumber: string | null;

    status: PurchaseStatus;
    source: PurchaseSource;

    vendorNtnCnic: string | null;
    vendorBusinessName: string;
    vendorProvince: string | null;
    vendorAddress: string | null;
    vendorRegistrationType: string | null;

    assessedValue: number;
    totalDiscount: number;
    totalValueExcludingST: number;
    totalSalesTax: number;
    totalFurtherTax: number;
    totalExtraTax: number;
    totalFedPayable: number;
    advanceTax: number;
    totalValueIncludingST: number;

    postedAt: string | null;
    notes: string | null;

    createdAt: string;
    updatedAt: string;

    vendor?: PurchaseVendorSummary;
    items?: PurchaseItem[];
}

export interface PurchaseItem {
    id: number;
    purchaseId: number;
    productId: number | null;
    itemSrNo: number;
    hsCode: string | null;
    productDescription: string;
    uom: string;
    quantity: number;
    unitPrice: number;
    assessedPerUnit: number;
    retailPrice: number;
    discountPercent: number;
    discount: number;
    taxPercent: number;
    salesTaxApplicable: number;
    valueExcludingST: number;
    valueIncludingST: number;
}

export interface CreatePurchaseItemInput {
    productId?: number | null;
    hsCode?: string | null;
    productDescription: string;
    uom: string;
    quantity: number;
    unitPrice?: number;
    assessedPerUnit?: number;
    retailPrice?: number;
    discountPercent?: number;
    taxPercent?: number;
}

export interface CreatePurchaseInput {
    vendorId: number;
    purchaseType?: PurchaseType;
    originalPurchaseUuid?: string | null;
    vendorInvoiceNo?: string | null;
    docDate: string;
    postingDate?: string | null;
    poDate?: string | null;
    poNumber?: string | null;
    advanceTax?: number;
    source?: PurchaseSource;
    notes?: string | null;
    items: CreatePurchaseItemInput[];
}

export interface PurchaseListQuery {
    page?: number;
    limit?: number;
    status?: PurchaseStatus;
    purchaseType?: PurchaseType;
    vendorId?: number;
    from?: string;
    to?: string;
    search?: string;
    sortBy?: string;
    sortDir?: "asc" | "desc" | "ASC" | "DESC";
}

export const purchasesService = {
    list: (q?: PurchaseListQuery) =>
        api.get<Paginated<Purchase>>(`/purchases${toQuery(q as Record<string, unknown>)}`),
    getOne: (uuid: string) => api.get<Purchase>(`/purchases/${uuid}`),
    create: (data: CreatePurchaseInput) => api.post<Purchase>("/purchases", data),
    update: (uuid: string, data: Partial<CreatePurchaseInput>) =>
        api.put<Purchase>(`/purchases/${uuid}`, data),
    post: (uuid: string) => api.post<Purchase>(`/purchases/${uuid}/post`, {}),
    cancel: (uuid: string) => api.post<Purchase>(`/purchases/${uuid}/cancel`, {}),
    remove: (uuid: string) => api.delete<null>(`/purchases/${uuid}`),
};
