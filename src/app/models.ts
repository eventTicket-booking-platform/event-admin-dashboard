export type EventStatus = 'draft' | 'published' | 'cancelled';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';
export type PaymentStatus = 'pending' | 'completed' | 'failed';
export type UserRole = 'admin' | 'manager' | 'user';
export type UserStatus = 'active' | 'inactive';
export type NotificationType = 'email' | 'sms' | 'push';
export type NotificationStatus = 'pending' | 'sent' | 'failed';

export interface EventRecord {
  id: string;
  name: string;
  category: string;
  date: string;
  time: string;
  location: string;
  capacity: number;
  sold: number;
  status: EventStatus;
  description: string;
  ticketPrice: number;
  revenue: number;
  thumbnail: string;
}

export interface BookingRecord {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  eventId: string;
  eventName: string;
  ticketsCount: number;
  totalAmount: number;
  bookingDate: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  joinDate: string;
  lastLogin: string;
  status: UserStatus;
  bookingCount: number;
  totalSpent: number;
}

export interface NotificationRecord {
  id: string;
  type: NotificationType;
  recipientId: string;
  recipient: string;
  message: string;
  sentAt: string;
  status: NotificationStatus;
  retryCount: number;
}

export interface ActivityRecord {
  id: string;
  title: string;
  detail: string;
  type: 'booking' | 'event' | 'user' | 'notification' | 'system';
  timestamp: string;
}

export interface DashboardStat {
  label: string;
  value: string;
  trend: string;
  direction: 'up' | 'down';
}

export interface TrendPoint {
  label: string;
  value: number;
}
