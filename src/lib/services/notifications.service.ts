import { api } from "@/lib/api";
import { toQuery, type ListQuery, type Paginated } from "./_types";

export interface Notification {
    id: number;
    uuid: string;
    userId: number;
    type: string;
    title: string;
    body?: string | null;
    isRead: boolean;
    readAt: string | null;
    link?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface NotificationListQuery extends ListQuery {
    unreadOnly?: boolean;
}

export const notificationsService = {
    list: (q?: NotificationListQuery) =>
        api.get<Paginated<Notification>>(`/notifications${toQuery(q as Record<string, unknown>)}`),
    unreadCount: () => api.get<{ count: number }>("/notifications/unread-count"),
    markRead: (uuid: string) => api.post<Notification>(`/notifications/${uuid}/read`, {}),
    markAllRead: () => api.post<{ count: number }>("/notifications/mark-all-read", {}),
    remove: (uuid: string) => api.delete<null>(`/notifications/${uuid}`),
};
