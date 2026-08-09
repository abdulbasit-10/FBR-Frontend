import { api } from "@/lib/api";

// Cached FBR reference data — populated by the backend from PRAL/FBR APIs.
// See FBR-Backend/src/services/lookup.service.ts

export interface Province {
    stateProvinceCode: number;
    stateProvinceDesc: string;
}

export interface DocType {
    docTypeId: number;
    docDescription: string;
}

export interface HsCode {
    hsCode: string;
    description: string;
}

export interface Uom {
    uomId: number;
    description: string;
}

export interface TransactionType {
    transactionTypeId: number;
    transactionDesc: string;
}

export interface Sro {
    sroId: number;
    sroDesc: string;
}

export interface Rate {
    rateId: number;
    rateDesc: string;
    rateValue: number;
}

export type LookupKind =
    | "provinces"
    | "doc-types"
    | "hs-codes"
    | "uoms"
    | "transaction-types"
    | "sros"
    | "rates";

export const lookupService = {
    provinces: () => api.get<Province[]>("/lookup/provinces"),
    docTypes: () => api.get<DocType[]>("/lookup/doc-types"),
    hsCodes: () => api.get<HsCode[]>("/lookup/hs-codes"),
    uoms: () => api.get<Uom[]>("/lookup/uoms"),
    transactionTypes: () => api.get<TransactionType[]>("/lookup/transaction-types"),
    sros: () => api.get<Sro[]>("/lookup/sros"),
    rates: () => api.get<Rate[]>("/lookup/rates"),
    /** Live proxy: returns Registered / Unregistered for an NTN or CNIC. */
    registrationType: (registrationNo: string) =>
        api.get<{ statuscode?: string; REGISTRATION_TYPE?: string; message?: string }>(
            `/lookup/registration-type?registrationNo=${encodeURIComponent(registrationNo)}`,
        ),
    /** Admin: sync all reference tables from FBR. */
    syncAll: () => api.post<{ synced: Record<string, number> }>("/lookup/sync", {}),
    syncOne: (kind: LookupKind) => api.post<{ synced: number }>(`/lookup/sync/${kind}`, {}),
};
