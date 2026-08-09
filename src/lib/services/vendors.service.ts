import { api } from "@/lib/api";
import { toQuery, type ListQuery, type Paginated } from "./_types";

// Mirrors backend model FBR-Backend/src/models/Vendor.ts
export type VendorRegistrationType = "Registered" | "Unregistered";

export interface Vendor {
    id: number;
    uuid: string;
    companyId: number;
    vendorNo: string | null;
    businessName: string;
    ntnCnic: string | null;
    strn: string | null;
    registrationType: VendorRegistrationType;
    vendorType: "Individual" | "Company";
    province: string;
    address: string;
    phone: string | null;
    email: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface VendorListQuery extends ListQuery {
    type?: string;
    registrationType?: VendorRegistrationType | string;
}

export interface VendorCreateInput {
    businessName: string;
    ntnCnic?: string | null;
    registrationType: VendorRegistrationType;
    province: string;
    address: string;
    phone?: string | null;
    email?: string | null;
    vendorType?: "Individual" | "Company";
    strn?: string | null;
    isActive?: boolean;
}

export type VendorUpdateInput = Partial<VendorCreateInput>;

export const vendorsService = {
    list: (q?: VendorListQuery) =>
        api.get<Paginated<Vendor>>(`/vendors${toQuery(q as Record<string, unknown>)}`),
    getOne: (uuid: string) => api.get<Vendor>(`/vendors/${uuid}`),
    create: (data: VendorCreateInput) => api.post<Vendor>("/vendors", data),
    update: (uuid: string, data: VendorUpdateInput) => api.put<Vendor>(`/vendors/${uuid}`, data),
    remove: (uuid: string) => api.delete<null>(`/vendors/${uuid}`),
};
