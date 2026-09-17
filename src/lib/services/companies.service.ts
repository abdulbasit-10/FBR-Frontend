import { api } from "@/lib/api";
import { auth } from "@/lib/auth";
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
    /** SuperAdmin-only: downloads a full SQL dump of one company's data (for offboarding). */
    exportSql: async (uuid: string): Promise<void> => {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/companies/${uuid}/export`, {
            headers: auth.getAuthHeader(),
        });
        if (!res.ok) throw new Error("Failed to export company data.");
        const disposition = res.headers.get("Content-Disposition") ?? "";
        const fileName = disposition.match(/filename="(.+)"/)?.[1] ?? `company_export.sql`;
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
    },
};
