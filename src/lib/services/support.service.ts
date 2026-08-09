import { api } from "@/lib/api";
import { toQuery, type ListQuery, type Paginated } from "./_types";

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
        api.put<SupportTicket>(`/support/${uuid}`, data),
    remove: (uuid: string) => api.delete<null>(`/support/${uuid}`),
};
