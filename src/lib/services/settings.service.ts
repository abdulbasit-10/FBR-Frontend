import { api } from "@/lib/api";

export interface Setting {
    id: number;
    uuid: string;
    companyId: number;
    key: string;
    value: string;
    description?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface UpsertSettingInput {
    key: string;
    value: string;
    description?: string | null;
}

export const settingsService = {
    list: () => api.get<Setting[]>("/settings"),
    upsert: (data: UpsertSettingInput) => api.post<Setting>("/settings", data),
    remove: (uuid: string) => api.delete<null>(`/settings/${uuid}`),
};
