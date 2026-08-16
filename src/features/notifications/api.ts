import { apiFetch } from "@/lib/api-client";
import type { CreateNotificationInput, Notification } from "@/features/notifications/types";

export async function fetchNotifications(): Promise<Notification[]> {
  return apiFetch<Notification[]>("/notifications");
}

export async function createNotification(input: CreateNotificationInput): Promise<Notification> {
  return apiFetch<Notification>("/notifications", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
