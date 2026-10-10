import { CategoryRecord } from '../categories/categories.models';

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';

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
  ticketTypeId?: number;
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
