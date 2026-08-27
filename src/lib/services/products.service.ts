import { api } from "@/lib/api";
import { toQuery, type ListQuery, type Paginated } from "./_types";

// Mirrors backend model FBR-Backend/src/models/Product.ts
export interface Product {
    id: number;
    uuid: string;
    companyId: number;
    name: string;
    itemType: string | null;
    itemCategory: string | null;
    description: string | null;
    hsCode: string;
    uom: string;
    saleType: string;
    rate: string;
    rateId: string | null;
    rateValue: number;
    taxDescription: string | null;
    sroScheduleNo: string | null;
    sroItemSerialNo: string | null;
    unitPrice: number;
    assessedUnitCost: number | null;
    salesPrice: number | null;
    fixedNotifiedValueOrRetailPrice: number;
    printUom: string | null;
    mappingId: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ProductCreateInput {
    name: string;
    itemType?: string | null;
    itemCategory?: string | null;
    description?: string | null;
    hsCode: string;
    uom: string;
    saleType: string;
    rate: string;
    rateId?: string | null;
    rateValue: number;
    taxDescription?: string | null;
    sroScheduleNo?: string | null;
    sroItemSerialNo?: string | null;
    unitPrice: number;
    assessedUnitCost?: number | null;
    salesPrice?: number | null;
    fixedNotifiedValueOrRetailPrice?: number;
    printUom?: string | null;
    mappingId?: string | null;
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
