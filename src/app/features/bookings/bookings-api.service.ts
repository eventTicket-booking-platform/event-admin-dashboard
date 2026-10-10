import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiConfigService } from '../../core/config/api-config.service';
import { BookingDetail, BookingStats, PaginatedBookings } from './bookings.models';

@Injectable({ providedIn: 'root' })
export class BookingsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  getBookingStats(eventId?: string): Observable<BookingStats> {
    return this.http.get<BookingStats>(
      `${this.apiConfig.config().bookingBaseUrl}/booking-service/api/v1/admin/stats`,
      {
        params: eventId ? new HttpParams().set('eventId', eventId) : new HttpParams(),
      },
    );
  }

  getBookings(filters: {
    status?: string;
    eventId?: string;
    userId?: string;
    userEmail?: string;
    page?: number;
    size?: number;
  }): Observable<PaginatedBookings> {
    let params = new HttpParams()
      .set('page', String(filters.page ?? 0))
      .set('size', String(filters.size ?? 10));

    if (filters.status?.trim()) {
      params = params.set('status', filters.status.trim());
    }
    if (filters.eventId?.trim()) {
      params = params.set('eventId', filters.eventId.trim());
    }
    if (filters.userId?.trim()) {
      params = params.set('userId', filters.userId.trim());
    }
    if (filters.userEmail?.trim()) {
      params = params.set('userEmail', filters.userEmail.trim());
    }

    return this.http.get<PaginatedBookings>(
      `${this.apiConfig.config().bookingBaseUrl}/booking-service/api/v1/admin/all`,
      {
        params,
      },
    );
  }

  getBooking(bookingId: number): Observable<BookingDetail> {
    return this.http.get<BookingDetail>(
      `${this.apiConfig.config().bookingBaseUrl}/booking-service/api/v1/bookings/${bookingId}`,
    );
  }
}
