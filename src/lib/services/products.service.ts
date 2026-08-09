import { api } from "@/lib/api";
import { toQuery, type ListQuery, type Paginated } from "./_types";

// Mirrors backend model FBR-Backend/src/models/Product.ts
export interface Product {
    id: number;
    uuid: string;
    companyId: number;
    name: string;
    description: string | null;
    hsCode: string;
    uom: string;
    saleType: string;
    rate: string;
    rateValue: number;
    sroScheduleNo: string | null;
    sroItemSerialNo: string | null;
    unitPrice: number;
    fixedNotifiedValueOrRetailPrice: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ProductCreateInput {
    name: string;
    description?: string | null;
    hsCode: string;
    uom: string;
    saleType: string;
    rate: string;
    rateValue: number;
    sroScheduleNo?: string | null;
    sroItemSerialNo?: string | null;
    unitPrice: number;
    fixedNotifiedValueOrRetailPrice?: number;
    isActive?: boolean;
}

export type ProductUpdateInput = Partial<ProductCreateInput>;

export const productsService = {
    list: (q?: ListQuery) =>
        api.get<Paginated<Product>>(`/products${toQuery(q as Record<string, unknown>)}`),
    getOne: (uuid: string) => api.get<Product>(`/products/${uuid}`),
    create: (data: ProductCreateInput) => api.post<Product>("/products", data),
    update: (uuid: string, data: ProductUpdateInput) => api.put<Product>(`/products/${uuid}`, data),
    remove: (uuid: string) => api.delete<null>(`/products/${uuid}`),
};
