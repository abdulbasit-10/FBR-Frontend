/**
 * Shared shapes used across all frontend service modules.
 * Keeps ApiResponse in sync with the backend `sendSuccess` helper
 * (see FBR-Backend/src/utils/apiResponse.ts).
 */

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface Paginated<T> {
    rows: T[];
    meta: PaginationMeta;
}

export interface ListQuery {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortDir?: "asc" | "desc" | "ASC" | "DESC";
}

/** Turn an object of query params into a `?key=value&...` string, skipping empty values. */
export function toQuery(params?: Record<string, unknown>): string {
    if (!params) return "";
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        if (v === undefined || v === null || v === "") continue;
        sp.append(k, String(v));
    }
    const s = sp.toString();
    return s ? `?${s}` : "";
}
