export interface ApiConfig {
  authBaseUrl: string;
  eventBaseUrl: string;
  bookingBaseUrl: string;
  notificationBaseUrl: string;
  authToken: string;
  refreshToken: string;
}

export interface StandardResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  expires_in?: number;
  refresh_expires_in?: number;
  refresh_token?: string;
  token_type?: string;
  session_state?: string;
  scope?: string;
}

export interface AdminProfile {
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
  resourceUrl: string | null;
}

export interface CategoryRecord {
  categoryId: number;
  name: string;
  description: string;
  active: boolean;
}

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED';

export interface EventSummary {
  eventId: number;
  title: string;
  categoryName: string;
  city: string;
  bannerUrl: string | null;
  startDateTime: string;
  endDateTime: string;
  status: EventStatus;
}

export interface VenueRecord {
  name: string;
  city: string;
  address: string;
}

export interface TicketTypeRecord {
  id?: number;
  name: string;
  price: number;
  totalQuantity: number;
}

export interface EventDetail {
  eventId: number;
  title: string;
  description: string;
  category: CategoryRecord;
  venue: VenueRecord;
  bannerUrl: string | null;
  startDateTime: string;
  endDateTime: string;
  status: EventStatus;
  ticketTypes: TicketTypeRecord[];
}

export interface PaginatedEvents {
  dataList: EventSummary[];
  dataCount: number;
}

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'FAILED';

export interface BookingSummary {
  bookingId: number;
  bookingReference: string;
  userId: string;
  eventId: number;
  eventTitle: string;
  status: BookingStatus;
  totalAmount: number;
  bookingDate: string;
}

export interface BookingStats {
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  failedBookings: number;
  totalRevenue: number;
}

export interface BookingItem {
  ticketTypeId?: number;
  ticketTypeName?: string;
  quantity: number;
  price: number;
  subtotal?: number;
}

export interface PaymentDetail {
  paymentId?: number;
  method?: string;
  status?: string;
  amount?: number;
  paidAt?: string;
}

export interface BookingDetail {
  bookingId: number;
  bookingReference: string;
  userId: string;
  eventId: number;
  eventTitle: string;
  eventStartDateTime: string;
  status: BookingStatus;
  totalAmount: number;
  bookingDate: string;
  items: BookingItem[];
  payment: PaymentDetail | null;
}

export interface PaginatedBookings {
  dataList: BookingSummary[];
  dataCount: number;
}

export interface UserSummary {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  resourceUrl: string | null;
}

export interface PaginatedUsers {
  dataList: UserSummary[];
  dataCount: number;
}

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

export interface ApiMessageResponse {
  message: string;
  status?: number;
}

export interface EventFormValue {
  title: string;
  description: string;
  categoryId: number | null;
  venueName: string;
  venueCity: string;
  venueAddress: string;
  startDateTime: string;
  endDateTime: string;
  status: EventStatus;
  ticketTypes: TicketTypeRecord[];
  bannerFile: File | null;
}
