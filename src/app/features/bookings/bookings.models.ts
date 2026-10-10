export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';

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
  pendingBookings: number;
  totalRevenue: number;
}

export interface BookingItem {
  ticketTypeId?: number;
  ticketTypeName?: string;
  quantity: number;
  unitPrice: number;
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
