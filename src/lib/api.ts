const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    const { headers, ...rest } = options;

    const res = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {
            "Content-Type": "application/json",
            ...(headers ?? {}),
        },
        ...rest,
    });

    const json: ApiResponse<T> = await res.json();

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
