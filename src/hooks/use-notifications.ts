import { useCallback, useEffect, useState } from "react";
import { NOTIFICATION_EVENT, notificationService } from "@/lib/notifications/service";
import type { NotificationListResult } from "@/lib/notifications/types";

export function useNotifications() {
  const [data, setData] = useState<NotificationListResult>({ notifications: [], unreadCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await notificationService.list());
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "通知加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    const sync = () => void reload();
    window.addEventListener(NOTIFICATION_EVENT, sync);
    return () => window.removeEventListener(NOTIFICATION_EVENT, sync);
  }, [reload]);

  return {
    data,
    loading,
    error,
    retry: reload,
    markRead: async (notificationId: string) => {
      await notificationService.markRead(notificationId);
      await reload();
    },
    markAllRead: async () => {
      await notificationService.markAllRead();
      await reload();
    },
  };
}
