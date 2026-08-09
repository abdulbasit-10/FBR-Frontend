import { api } from "@/lib/api";
import type { AuthUser } from "@/lib/auth";

// ── /auth ────────────────────────────────────────────────────────────────────
// Login / refresh / logout are handled in `lib/auth.ts`. This module only
// exposes the additional authenticated endpoints not already wrapped there.

export const authService = {
    /** GET /auth/me — current user profile from JWT */
    me: () => api.get<AuthUser>("/auth/me"),

    /** POST /auth/logout-all — revokes every refresh token for this user */
    logoutAll: () => api.post<null>("/auth/logout-all", {}),
};
