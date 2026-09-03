import { HUMAN_INTERVIEW_EVENT } from "@/lib/human-interviews/fallback";
import type { HireLinkNotification, NotificationListResult } from "./types";

const STORAGE_KEY = "hirelink:notifications:v1";
export const NOTIFICATION_EVENT = "hirelink:notifications-updated";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readNotifications(): HireLinkNotification[] {
  if (!canUseStorage()) return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as HireLinkNotification[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeNotifications(notifications: HireLinkNotification[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  window.dispatchEvent(new CustomEvent(NOTIFICATION_EVENT));
}

export const notificationService = {
  async list(): Promise<NotificationListResult> {
    const notifications = readNotifications().sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
    return {
      notifications,
      unreadCount: notifications.filter((item) => item.status === "unread").length,
    };
  },

  async create(input: Omit<HireLinkNotification, "id" | "status" | "createdAt">) {
    const notification: HireLinkNotification = {
      ...input,
      id: `notice_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      status: "unread",
      createdAt: new Date().toISOString(),
    };
    writeNotifications([notification, ...readNotifications()]);
    window.dispatchEvent(new CustomEvent(HUMAN_INTERVIEW_EVENT));
    return notification;
  },

  async markRead(notificationId: string) {
    writeNotifications(
      readNotifications().map((item) =>
        item.id === notificationId ? { ...item, status: "read" } : item,
      ),
    );
  },

  async markAllRead() {
    writeNotifications(readNotifications().map((item) => ({ ...item, status: "read" })));
  },
};
