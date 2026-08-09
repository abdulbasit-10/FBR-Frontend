import { api } from "@/lib/api";
import { toQuery, type ListQuery, type Paginated } from "./_types";

export interface ApiLog {
    id: number;
    uuid: string;
    companyId: number | null;
    userId: number | null;
    invoiceId: number | null;
    direction: "inbound" | "outbound";
    method: string;
    endpoint: string;
    requestHeaders: unknown;
    requestBody: unknown;
    responseStatus: number | null;
    responseHeaders: unknown;
    responseBody: unknown;
    durationMs: number | null;
    errorMessage: string | null;
    createdAt: string;
}

export interface ApiLogListQuery extends ListQuery {
    direction?: "inbound" | "outbound";
    companyId?: number | null;
    invoiceId?: number;
    minStatus?: number;
    from?: string;
    to?: string;
}

export const apiLogsService = {
    list: (q?: ApiLogListQuery) =>
        api.get<Paginated<ApiLog>>(`/api-logs${toQuery(q as Record<string, unknown>)}`),
    errors: (q?: Omit<ApiLogListQuery, "minStatus">) =>
        api.get<Paginated<ApiLog>>(`/api-logs/errors${toQuery(q as Record<string, unknown>)}`),
    getOne: (uuid: string) => api.get<ApiLog>(`/api-logs/${uuid}`),
};
