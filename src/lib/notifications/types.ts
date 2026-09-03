export type HireLinkNotificationType =
  | "human_interview_invited"
  | "human_interview_invitation_updated"
  | "human_interview_booking_confirmed"
  | "human_interview_booking_cancelled"
  | "human_interview_booking_reminder";

export interface HireLinkNotification {
  id: string;
  type: HireLinkNotificationType;
  title: string;
  body: string;
  status: "unread" | "read";
  createdAt: string;
  entityType?: string;
  entityPublicId?: string;
  href?: string;
  payload?: Record<string, string>;
}

export interface NotificationListResult {
  notifications: HireLinkNotification[];
  unreadCount: number;
}
