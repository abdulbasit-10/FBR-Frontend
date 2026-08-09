import { api } from "@/lib/api";
import { toQuery, type Paginated } from "./_types";

// Mirrors backend model FBR-Backend/src/models/InventoryAdjustment.ts
export type InventoryAdjustmentStatus = "draft" | "posted" | "cancelled";
export type InventoryAdjustmentSource = "Manual" | "API" | "Import";

export interface InventoryAdjustmentItem {
    id: number;
    adjustmentId: number;
    productId: number | null;
    itemSrNo: number;
    productDescription: string;
    uom: string;
    quantity: number;
    unitCost: number;
    lineValue: number;
    reason: string | null;
}

export interface InventoryAdjustment {
    id: number;
    uuid: string;
    companyId: number;
    createdBy: number;
    adjustmentNo: string | null;
    docDate: string;
    postingDate: string | null;
    reason: string | null;
    source: InventoryAdjustmentSource;
    status: InventoryAdjustmentStatus;
    lines: number;
    lineTotal: number;
    postedAt: string | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
    items?: InventoryAdjustmentItem[];
}

export interface CreateAdjustmentItemInput {
    productId?: number | null;
    productDescription: string;
    uom: string;
    quantity: number;
    unitCost?: number;
    reason?: string | null;
}

export interface CreateAdjustmentInput {
    docDate: string;
    postingDate?: string | null;
    reason?: string | null;
    source?: InventoryAdjustmentSource;
    notes?: string | null;
    items: CreateAdjustmentItemInput[];
}

export interface AdjustmentListQuery {
    page?: number;
    limit?: number;
    status?: InventoryAdjustmentStatus;
    source?: InventoryAdjustmentSource;
    from?: string;
    to?: string;
    search?: string;
}

export const inventoryAdjustmentsService = {
    list: (q?: AdjustmentListQuery) =>
        api.get<Paginated<InventoryAdjustment>>(
            `/inventory-adjustments${toQuery(q as Record<string, unknown>)}`,
        ),
    getOne: (uuid: string) => api.get<InventoryAdjustment>(`/inventory-adjustments/${uuid}`),
    create: (data: CreateAdjustmentInput) =>
        api.post<InventoryAdjustment>("/inventory-adjustments", data),
    post: (uuid: string) =>
        api.post<InventoryAdjustment>(`/inventory-adjustments/${uuid}/post`, {}),
    cancel: (uuid: string) =>
        api.post<InventoryAdjustment>(`/inventory-adjustments/${uuid}/cancel`, {}),
    remove: (uuid: string) => api.delete<null>(`/inventory-adjustments/${uuid}`),
};
