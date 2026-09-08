import { api } from "@/lib/api";
import { toQuery, type ListQuery, type Paginated } from "./_types";
import { triggerNotificationsRefresh } from "./notifications.service";

// Mirrors backend model FBR-Backend/src/models/SupportTicket.ts
export type SupportStatus = "Open" | "In Progress" | "Resolved" | "Closed";
export type SupportPriority = "Low" | "Normal" | "High" | "Urgent";

export interface SupportTicket {
    id: number;
    uuid: string;
    companyId: number;
    createdBy: number;
    ticketNo: string | null;
    title: string;
    description: string | null;
    category: string | null;
    priority: SupportPriority;
    status: SupportStatus;
    resolvedAt: string | null;
    attachmentUrl: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateTicketInput {
    title: string;
    description?: string | null;
    category?: string | null;
    priority?: SupportPriority;
}

export interface UpdateTicketInput {
    title?: string;
    description?: string | null;
    category?: string | null;
    priority?: SupportPriority;
    status?: SupportStatus;
}

export interface SupportListQuery extends ListQuery {
    status?: SupportStatus | string;
    priority?: SupportPriority | string;
}

export const supportService = {
    list: (q?: SupportListQuery) =>
        api.get<Paginated<SupportTicket>>(`/support${toQuery(q as Record<string, unknown>)}`),
    getOne: (uuid: string) => api.get<SupportTicket>(`/support/${uuid}`),
    create: (data: CreateTicketInput) => api.post<SupportTicket>("/support", data),
    update: (uuid: string, data: UpdateTicketInput) =>
        api.put<SupportTicket>(`/support/${uuid}`, data).then((res) => {
            triggerNotificationsRefresh();
            return res;
        }),
    remove: (uuid: string) => api.delete<null>(`/support/${uuid}`),
    /** Multipart upload — bypasses the JSON `api` client since this sends a File. */
    uploadAttachment: async (uuid: string, file: File): Promise<SupportTicket> => {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
        const token = typeof window !== "undefined" ? localStorage.getItem("fbr_access_token") : null;
        const form = new FormData();
        form.append("file", file);
        const res = await fetch(`${baseUrl}/support/${uuid}/attachment`, {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            body: form,
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
            throw new Error(json.message ?? "Failed to upload attachment.");
        }
        return json.data;
    },
};
