// ── Types ────────────────────────────────────────────────────────────────────

import { api } from "@/lib/api";

export interface AuthRole {
    id: number;
    name: string;
}

export interface AuthUser {
    id: number;
    uuid: string;
    name: string;
    email: string;
    phone: string | null;
    companyId: number | null;
    role: AuthRole;
    permissions: string[];
    isActive: boolean;
    lastLoginAt: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresIn: string;
    refreshTokenExpiresIn: string;
}

/** Shape of `data` in the login API response */
export interface LoginData {
    user: AuthUser;
    tokens: AuthTokens;
}

// ── Storage keys ─────────────────────────────────────────────────────────────

const K = {
    ACCESS: "fbr_access_token",
    REFRESH: "fbr_refresh_token",
    USER: "fbr_user",
} as const;

// ── Auth helpers ──────────────────────────────────────────────────────────────

export const auth = {
    /** Persist user + tokens after a successful login */
    save(user: AuthUser, tokens: AuthTokens): void {
        localStorage.setItem(K.ACCESS, tokens.accessToken);
        localStorage.setItem(K.REFRESH, tokens.refreshToken);
        localStorage.setItem(K.USER, JSON.stringify(user));
    },

    getAccessToken(): string | null {
        return localStorage.getItem(K.ACCESS);
    },

    getRefreshToken(): string | null {
        return localStorage.getItem(K.REFRESH);
    },

    getUser(): AuthUser | null {
        const raw = localStorage.getItem(K.USER);
        if (!raw) return null;
        try {
            return JSON.parse(raw) as AuthUser;
        } catch {
            return null;
        }
    },

    /** Remove all auth data (logout) */
    clear(): void {
        Object.values(K).forEach((key) => localStorage.removeItem(key));
    },

    isAuthenticated(): boolean {
        return Boolean(localStorage.getItem(K.ACCESS));
    },

    hasPermission(permission: string): boolean {
        const user = auth.getUser();
        return user?.permissions.includes(permission) ?? false;
    },

    /** Returns the Authorization header object for authenticated requests */
    getAuthHeader(): Record<string, string> {
        const token = auth.getAccessToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
    },

    /**
     * Calls POST /auth/refresh with the stored refresh token.
     * Updates stored tokens on success; clears storage on failure.
     * Returns true if refresh succeeded.
     */
    async refreshTokens(): Promise<boolean> {
        const refreshToken = auth.getRefreshToken();
        if (!refreshToken) return false;
        try {
            const res = await api.post<AuthTokens>("/auth/refresh", { refreshToken });
            localStorage.setItem(K.ACCESS, res.data.accessToken);
            localStorage.setItem(K.REFRESH, res.data.refreshToken);
            return true;
        } catch {
            auth.clear();
            return false;
        }
    },

    /**
     * Calls POST /auth/logout with the stored refresh token,
     * then clears all local auth data regardless of API result.
     */
    async logout(): Promise<void> {
        const refreshToken = auth.getRefreshToken();
        try {
            if (refreshToken) {
                await api.post(
                    "/auth/logout",
                    { refreshToken },
                    { headers: auth.getAuthHeader() }
                );
            }
        } finally {
            auth.clear();
        }
    },

    /**
     * Calls POST /auth/change-password.
     * Throws if the API returns an error (e.g. wrong old password).
     */
    async changePassword(oldPassword: string, newPassword: string): Promise<void> {
        await api.post(
            "/auth/change-password",
            { oldPassword, newPassword },
            { headers: auth.getAuthHeader() }
        );
    },
};
