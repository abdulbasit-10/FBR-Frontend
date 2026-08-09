import { api } from "@/lib/api";
import { toQuery, type ListQuery, type Paginated } from "./_types";

export interface Company {
    id: number;
    uuid: string;
    businessName: string;
    ntn: string;
    strn?: string | null;
    province: string;
    address: string;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    logoUrl?: string | null;
    fbrEnvironment: "sandbox" | "production";
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export type CompanyCreateInput = Omit<
    Company,
    "id" | "uuid" | "createdAt" | "updatedAt" | "isActive"
> & { isActive?: boolean };

export type CompanyUpdateInput = Partial<CompanyCreateInput>;

export const companiesService = {
    list: (q?: ListQuery) => api.get<Paginated<Company>>(`/companies${toQuery(q as Record<string, unknown>)}`),
    getOne: (uuid: string) => api.get<Company>(`/companies/${uuid}`),
    create: (data: CompanyCreateInput) => api.post<Company>("/companies", data),
    update: (uuid: string, data: CompanyUpdateInput) => api.put<Company>(`/companies/${uuid}`, data),
    remove: (uuid: string) => api.delete<null>(`/companies/${uuid}`),
};
