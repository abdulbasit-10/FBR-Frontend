const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

async function doFetch(endpoint: string, token: string | null, options: RequestInit) {
    const { headers, ...rest } = options;
    return fetch(`${BASE_URL}${endpoint}`, {
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(headers ?? {}),
        },
        ...rest,
    });
}

async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    const isClient = typeof window !== "undefined";
    let token = isClient ? localStorage.getItem("fbr_access_token") : null;

    let res = await doFetch(endpoint, token, options);
    let json: ApiResponse<T> = await res.json();

    // Auto-refresh on expired token then retry once
    if (!res.ok && json.message === "Access token expired" && isClient) {
        const { auth } = await import("@/lib/auth");
        const refreshed = await auth.refreshTokens();
        if (refreshed) {
            token = localStorage.getItem("fbr_access_token");
            res = await doFetch(endpoint, token, options);
            json = await res.json();
        } else {
            // Refresh failed — redirect to login
            window.location.href = "/";
            throw new Error("Session expired. Please log in again.");
        }
    }

    if (!res.ok || !json.success) {
        throw new Error(json.message ?? "Something went wrong. Please try again.");
    }

    return json;
}

export const api = {
    post: <T>(
        endpoint: string,
        body: unknown,
        init?: Omit<RequestInit, "method" | "body">
    ) =>
        request<T>(endpoint, {
            method: "POST",
            body: JSON.stringify(body),
            ...init,
        }),

    get: <T>(endpoint: string, init?: Omit<RequestInit, "method">) =>
        request<T>(endpoint, { method: "GET", ...init }),

    put: <T>(
        endpoint: string,
        body: unknown,
        init?: Omit<RequestInit, "method" | "body">
    ) =>
        request<T>(endpoint, {
            method: "PUT",
            body: JSON.stringify(body),
            ...init,
        }),

    delete: <T>(endpoint: string, init?: Omit<RequestInit, "method">) =>
        request<T>(endpoint, { method: "DELETE", ...init }),
};
