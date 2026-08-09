import { api } from "@/lib/api";
import { toQuery, type ListQuery, type Paginated } from "./_types";

// Users, roles & permissions live under /admin/*

export interface Role {
    id: number;
    uuid: string;
    name: string;
    description?: string | null;
    permissions?: string[];
    createdAt: string;
    updatedAt: string;
}

export interface Permission {
    id: number;
    key: string;
    description?: string | null;
}

export interface AdminUser {
    id: number;
    uuid: string;
    name: string;
    email: string;
    phone: string | null;
    companyId: number | null;
    roleId: number;
    role?: Pick<Role, "id" | "name">;
    isActive: boolean;
    lastLoginAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateUserInput {
    name: string;
    email: string;
    password: string;
    phone?: string | null;
    companyId?: number | null;
    roleId: number;
    isActive?: boolean;
}

export type UpdateUserInput = Partial<Omit<CreateUserInput, "password">>;

export interface CreateRoleInput {
    name: string;
    description?: string | null;
    permissions?: string[];
}

export type UpdateRoleInput = Partial<CreateRoleInput>;

export const usersService = {
    // Users
    listUsers: (q?: ListQuery) =>
        api.get<Paginated<AdminUser>>(`/admin/users${toQuery(q as Record<string, unknown>)}`),
    getUser: (uuid: string) => api.get<AdminUser>(`/admin/users/${uuid}`),
    createUser: (data: CreateUserInput) => api.post<AdminUser>("/admin/users", data),
    updateUser: (uuid: string, data: UpdateUserInput) =>
        api.put<AdminUser>(`/admin/users/${uuid}`, data),
    deleteUser: (uuid: string) => api.delete<null>(`/admin/users/${uuid}`),
    resetPassword: (uuid: string, newPassword: string) =>
        api.post<null>(`/admin/users/${uuid}/reset-password`, { newPassword }),

    // Roles
    listRoles: (q?: ListQuery) =>
        api.get<Paginated<Role>>(`/admin/roles${toQuery(q as Record<string, unknown>)}`),
    getRole: (uuid: string) => api.get<Role>(`/admin/roles/${uuid}`),
    createRole: (data: CreateRoleInput) => api.post<Role>("/admin/roles", data),
    updateRole: (uuid: string, data: UpdateRoleInput) => api.put<Role>(`/admin/roles/${uuid}`, data),
    deleteRole: (uuid: string) => api.delete<null>(`/admin/roles/${uuid}`),

    // Permissions
    listPermissions: () => api.get<Permission[]>("/admin/permissions"),
};
