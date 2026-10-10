import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiConfigService } from '../../core/config/api-config.service';
import { EventDetail, EventFormValue, PaginatedEvents } from './events.models';
import { ApiMessageResponse } from '../../shared/models/api-response.model';

@Injectable({ providedIn: 'root' })
export class EventsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  getEvents(filters: {
    search?: string;
    status?: string;
    page?: number;
    size?: number;
  }): Observable<PaginatedEvents> {
    let params = new HttpParams()
      .set('page', String(filters.page ?? 0))
      .set('size', String(filters.size ?? 10));

    if (filters.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }
    if (filters.status?.trim()) {
      params = params.set('status', filters.status.trim());
    }

    return this.http.get<PaginatedEvents>(
      `${this.apiConfig.config().eventBaseUrl}/event-service/api/v1/events/admin/all`,
      {
        params,
      },
    );
  }

  getEvent(eventId: number): Observable<EventDetail> {
    return this.http.get<EventDetail>(
      `${this.apiConfig.config().eventBaseUrl}/event-service/api/v1/events/admin/${eventId}`,
    );
  }

  createEvent(form: EventFormValue): Observable<ApiMessageResponse> {
    return this.http.post<ApiMessageResponse>(
      `${this.apiConfig.config().eventBaseUrl}/event-service/api/v1/events`,
      this.toEventFormData(form, true),
    );
  }

  updateEvent(eventId: number, form: EventFormValue): Observable<ApiMessageResponse> {
    return this.http.put<ApiMessageResponse>(
      `${this.apiConfig.config().eventBaseUrl}/event-service/api/v1/events/${eventId}`,
      this.toEventFormData(form, false),
    );
  }

  updateEventStatus(eventId: number, status: string): Observable<ApiMessageResponse> {
    return this.http.patch<ApiMessageResponse>(
      `${this.apiConfig.config().eventBaseUrl}/event-service/api/v1/events/${eventId}/status`,
      { status },
    );
  }

  deleteEvent(eventId: number): Observable<ApiMessageResponse> {
    return this.http.delete<ApiMessageResponse>(
      `${this.apiConfig.config().eventBaseUrl}/event-service/api/v1/events/${eventId}`,
    );
  }

  private toEventFormData(form: EventFormValue, includeStatus: boolean): FormData {
    const payload: Record<string, unknown> = {
      title: form.title,
      description: form.description,
      categoryId: form.categoryId,
      venue: {
        name: form.venueName,
        city: form.venueCity,
        address: form.venueAddress,
      },
      startDateTime: this.toIsoDateTime(form.startDateTime),
      endDateTime: this.toIsoDateTime(form.endDateTime),
      ticketTypes: form.ticketTypes.map((ticket) => ({
        ...(ticket.id ? { id: ticket.id } : {}),
        name: ticket.name,
        price: ticket.price,
        totalQuantity: ticket.totalQuantity,
      })),
    };

    if (includeStatus) {
      payload['status'] = form.status;
    }

    const formData = new FormData();
    formData.append('request', JSON.stringify(payload));
    if (form.bannerFile) {
      formData.append('bannerimg', form.bannerFile);
    }
    return formData;
  }

  private toIsoDateTime(value: string): string {
    return value ? new Date(value).toISOString() : value;
  }
}
