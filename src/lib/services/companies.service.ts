import { api } from "@/lib/api";
import { toQuery, type ListQuery, type Paginated } from "./_types";

export interface Company {
    id: number;
    uuid: string;
    name: string;
    businessName: string;
    ntn: string;
    salesTaxRegNo?: string | null;
    strn?: string | null;       // alias kept for legacy UI references
    province: string;
    address: string;
    phone?: string | null;
    email?: string | null;
    businessActivity?: string | null;
    sector?: string | null;
    fbrEnvironment: "sandbox" | "production" | "both";
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
