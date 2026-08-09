import { api } from "@/lib/api";

// FBR credentials (Bearer tokens) stored per-company, per-environment.

export type FbrTokenEnvironment = "sandbox" | "production";

export interface FbrToken {
    id: number;
    uuid: string;
    companyId: number;
    environment: FbrTokenEnvironment;
    tokenPreview: string; // never returns full token
    isActive: boolean;
    expiresAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface UpsertFbrTokenInput {
    environment: FbrTokenEnvironment;
    token: string;
    expiresAt?: string | null;
}

export const fbrTokensService = {
    list: () => api.get<FbrToken[]>("/fbr-tokens"),
    upsert: (data: UpsertFbrTokenInput) => api.post<FbrToken>("/fbr-tokens", data),
    deactivate: (uuid: string) => api.delete<null>(`/fbr-tokens/${uuid}`),
};
