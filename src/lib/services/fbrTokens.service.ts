import { api } from "@/lib/api";

// FBR credentials (Bearer tokens) stored per-company, per-environment.
// SuperAdmin-only (per the Developer Guide) — recorded and rotated on the client's behalf.

export type FbrTokenEnvironment = "sandbox" | "production";

export interface FbrToken {
    id: number;
    uuid: string;
    companyId: number;
    environment: FbrTokenEnvironment;
    issuedAt: string | null;
    expiresAt: string | null;
    isActive: boolean;
    createdBy: number | null;
    createdAt: string;
}

export interface UpsertFbrTokenInput {
    companyId: number;
    environment: FbrTokenEnvironment;
    token: string;
    expiresAt?: string | null;
}

export const fbrTokensService = {
    list: (companyId: number) => api.get<FbrToken[]>(`/fbr-tokens?companyId=${companyId}`),
    upsert: (data: UpsertFbrTokenInput) => api.post<FbrToken>("/fbr-tokens", data),
    deactivate: (uuid: string, companyId: number) =>
        api.delete<null>(`/fbr-tokens/${uuid}?companyId=${companyId}`),
};
