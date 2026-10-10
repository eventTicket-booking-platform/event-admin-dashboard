export interface NotificationStats {
  totalNotifications: number;
  sentCount: number;
  failedCount: number;
  unreadCount: number;
}

export interface NotificationLog {
  _id: string;
  email: string;
  type: string;
  subject: string;
  message: string;
  status: string;
  failureReason?: string | null;
  isRead?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationLogPage {
  logs: NotificationLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
