import { api } from "@/lib/api";
import { toQuery, type ListQuery, type Paginated } from "./_types";

// Mirrors backend model FBR-Backend/src/models/Customer.ts
export type CustomerRegistrationType = "Registered" | "Unregistered";

export interface Customer {
    id: number;
    uuid: string;
    companyId: number;
    businessName: string;
    ntnCnic: string | null;
    registrationType: CustomerRegistrationType;
    province: string;
    address: string;
    phone: string | null;
    email: string | null;
    isActive: boolean;
    customerNo: string | null;
    customerType: "Individual" | "Company";
    strn: string | null;
    contact: string | null;
    contactPerson: string | null;
    whatsapp: string | null;
    website: string | null;
    mappingId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CustomerListQuery extends ListQuery {
    type?: string;
    registrationType?: CustomerRegistrationType | string;
}

export interface CustomerCreateInput {
    businessName: string;
    ntnCnic?: string | null;
    registrationType: CustomerRegistrationType;
    province: string;
    address: string;
    phone?: string | null;
    email?: string | null;
    contact?: string | null;
    contactPerson?: string | null;
    whatsapp?: string | null;
    website?: string | null;
    mappingId?: string | null;
    customerType?: "Individual" | "Company";
    strn?: string | null;
    isActive?: boolean;
}

export type CustomerUpdateInput = Partial<CustomerCreateInput>;

export const customersService = {
    list: (q?: CustomerListQuery) =>
        api.get<Paginated<Customer>>(`/customers${toQuery(q as Record<string, unknown>)}`),
    getOne: (uuid: string) => api.get<Customer>(`/customers/${uuid}`),
    create: (data: CustomerCreateInput) => api.post<Customer>("/customers", data),
    update: (uuid: string, data: CustomerUpdateInput) => api.put<Customer>(`/customers/${uuid}`, data),
    remove: (uuid: string) => api.delete<null>(`/customers/${uuid}`),
};
