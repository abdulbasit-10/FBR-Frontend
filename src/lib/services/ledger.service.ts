import { api } from "@/lib/api";
import { toQuery } from "./_types";

// Mirrors backend service FBR-Backend/src/services/ledger.service.ts
export type LedgerDocumentType =
    | "Sales Invoice"
    | "Debit Note"
    | "Purchase Invoice"
    | "Purchase Return";

export interface ItemLedgerRow {
    documentNo: string;
    documentDate: string;
    postingDate: string | null;
    documentType: LedgerDocumentType;
    itemNo: number | null;
    hsCode: string;
    itemName: string;
    quantity: number;
    uom: string;
    unitCost: number;
    unitPrice: number;
}

export interface ItemLedgerQuery {
    from?: string;
    to?: string;
    productId?: number;
    docType?: LedgerDocumentType;
    search?: string;
}

export const ledgerService = {
    items: (q?: ItemLedgerQuery) =>
        api.get<ItemLedgerRow[]>(`/ledger/items${toQuery(q as Record<string, unknown>)}`),
};
