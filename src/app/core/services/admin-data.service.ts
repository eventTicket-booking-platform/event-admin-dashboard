import { DOCUMENT } from '@angular/common';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  AdminProfile,
  ApiConfig,
  ApiMessageResponse,
  BookingDetail,
  BookingStats,
  CategoryRecord,
  EventDetail,
  EventFormValue,
  LoginRequest,
  LoginResponse,
  NotificationLog,
  NotificationLogPage,
  NotificationStats,
  PaginatedBookings,
  PaginatedEvents,
  PaginatedUsers,
  StandardResponse,
} from '../../models';

const STORAGE_KEY = 'eventhub-admin-config';

const DEFAULT_CONFIG: ApiConfig = {
  authBaseUrl: 'http://localhost:9090',
  eventBaseUrl: 'http://localhost:9090',
  bookingBaseUrl: 'http://localhost:9090',
  notificationBaseUrl: 'http://localhost:9090',
  authToken: '',
  refreshToken: '',
};

@Injectable({ providedIn: 'root' })
export class AdminDataService {
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);
  private readonly configSignal = signal<ApiConfig>(this.loadConfig());

  readonly config = this.configSignal.asReadonly();
  readonly hasToken = computed(() => Boolean(this.configSignal().authToken.trim()));

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<StandardResponse<LoginResponse>>(`${this.config().authBaseUrl}/user-service/api/v1/users/visitors/login`, request)
      .pipe(map((response) => response.data));
  }

  refreshAccessToken(): Observable<LoginResponse> {
    return this.http
      .post<StandardResponse<LoginResponse>>(
        `${this.config().authBaseUrl}/user-service/api/v1/users/visitors/refresh-token`,
        { refreshToken: this.getRefreshToken() },
      )
      .pipe(map((response) => response.data));
  }

  updateConfig(patch: Partial<ApiConfig>): void {
    const next = { ...this.configSignal(), ...patch };
    this.configSignal.set(next);
    this.document.defaultView?.localStorage?.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  setToken(token: string): void {
    this.updateConfig({ authToken: token });
  }

  setAuthSession(response: LoginResponse): void {
    this.updateConfig({
      authToken: response.access_token ?? '',
      refreshToken: response.refresh_token ?? '',
    });
  }

  getToken(): string {
    return this.config().authToken.trim();
  }

  getRefreshToken(): string {
    return this.config().refreshToken.trim();
  }

  logout(): void {
    this.updateConfig({ authToken: '', refreshToken: '' });
  }

  getProfile(): Observable<AdminProfile> {
    return this.http
      .get<StandardResponse<AdminProfile>>(`${this.config().authBaseUrl}/user-service/api/v1/users/get-user-details`, {
        headers: this.authHeaders(),
      })
      .pipe(map((response) => response.data));
  }

  updateProfile(request: { firstName: string; lastName: string }): Observable<void> {
    return this.http
      .put<StandardResponse<null>>(`${this.config().authBaseUrl}/user-service/api/v1/users/update-user-details`, request, {
        headers: this.authHeaders(),
      })
      .pipe(map(() => void 0));
  }

  requestPasswordResetCode(email: string): Observable<void> {
    const params = new HttpParams().set('email', email);
    return this.http
      .post<StandardResponse<null>>(
        `${this.config().authBaseUrl}/user-service/api/v1/users/visitors/forget-password-request-code`,
        null,
        { params },
      )
      .pipe(map(() => void 0));
  }

  resetPassword(request: { email: string; password: string; code: string }): Observable<boolean> {
    return this.http
      .post<StandardResponse<boolean>>(`${this.config().authBaseUrl}/user-service/api/v1/users/visitors/reset-password`, request)
      .pipe(map((response) => Boolean(response.data)));
  }

  uploadAvatar(file: File): Observable<void> {
    const payload = new FormData();
    payload.append('avatar', file);

    return this.http
      .post<StandardResponse<null>>(`${this.config().authBaseUrl}/user-service/api/v1/avatars/user/manage-avatar`, payload, {
        headers: this.authHeaders(),
      })
      .pipe(map(() => void 0));
  }

  getCategories(): Observable<CategoryRecord[]> {
    return this.http
      .get<CategoryRecord[]>(`${this.config().eventBaseUrl}/event-service/api/v1/events/categories`)
      .pipe(map((categories) => categories ?? []));
  }

  createCategory(request: { name: string; description: string }): Observable<ApiMessageResponse> {
    return this.http.post<ApiMessageResponse>(`${this.config().eventBaseUrl}/event-service/api/v1/categories`, request, {
      headers: this.authHeaders(),
    });
  }

  updateCategory(categoryId: number, request: { name: string; description: string }): Observable<ApiMessageResponse> {
    return this.http.put<ApiMessageResponse>(
      `${this.config().eventBaseUrl}/event-service/api/v1/categories/${categoryId}`,
      request,
      { headers: this.authHeaders() },
    );
  }

  deleteCategory(categoryId: number): Observable<ApiMessageResponse> {
    return this.http.delete<ApiMessageResponse>(`${this.config().eventBaseUrl}/event-service/api/v1/categories/${categoryId}`, {
      headers: this.authHeaders(),
    });
  }

  getEvents(filters: { search?: string; status?: string; page?: number; size?: number }): Observable<PaginatedEvents> {
    let params = new HttpParams()
      .set('page', String(filters.page ?? 0))
      .set('size', String(filters.size ?? 10));

    if (filters.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }
    if (filters.status?.trim()) {
      params = params.set('status', filters.status.trim());
    }

    return this.http.get<PaginatedEvents>(`${this.config().eventBaseUrl}/event-service/api/v1/events/admin/all`, {
      headers: this.authHeaders(),
      params,
    });
  }

  getEvent(eventId: number): Observable<EventDetail> {
    return this.http.get<EventDetail>(`${this.config().eventBaseUrl}/event-service/api/v1/events/admin/${eventId}`, {
      headers: this.authHeaders(),
    });
  }

  createEvent(form: EventFormValue): Observable<ApiMessageResponse> {
    return this.http.post<ApiMessageResponse>(`${this.config().eventBaseUrl}/event-service/api/v1/events`, this.toEventFormData(form, true), {
      headers: this.authHeaders(),
    });
  }

  updateEvent(eventId: number, form: EventFormValue): Observable<ApiMessageResponse> {
    return this.http.put<ApiMessageResponse>(
      `${this.config().eventBaseUrl}/event-service/api/v1/events/${eventId}`,
      this.toEventFormData(form, false),
      { headers: this.authHeaders() },
    );
  }

  updateEventStatus(eventId: number, status: string): Observable<ApiMessageResponse> {
    return this.http.patch<ApiMessageResponse>(
      `${this.config().eventBaseUrl}/event-service/api/v1/events/${eventId}/status`,
      { status },
      { headers: this.authHeaders() },
    );
  }

  deleteEvent(eventId: number): Observable<ApiMessageResponse> {
    return this.http.delete<ApiMessageResponse>(`${this.config().eventBaseUrl}/event-service/api/v1/events/${eventId}`, {
      headers: this.authHeaders(),
    });
  }

  getBookingStats(): Observable<BookingStats> {
    return this.http.get<BookingStats>(`${this.config().bookingBaseUrl}/booking-service/api/v1/admin/stats`, {
      headers: this.authHeaders(),
    });
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

    return this.http.get<PaginatedBookings>(`${this.config().bookingBaseUrl}/booking-service/api/v1/admin/all`, {
      headers: this.authHeaders(),
      params,
    });
  }

  getBooking(bookingId: number): Observable<BookingDetail> {
    return this.http.get<BookingDetail>(`${this.config().bookingBaseUrl}/booking-service/api/v1/bookings/${bookingId}`, {
      headers: this.authHeaders(),
    });
  }

  getUsers(filters: { page?: number; size?: number }): Observable<PaginatedUsers> {
    const params = new HttpParams()
      .set('page', String(filters.page ?? 0))
      .set('size', String(filters.size ?? 20));

    return this.http
      .get<StandardResponse<PaginatedUsers>>(`${this.config().authBaseUrl}/user-service/api/v1/users/all`, {
        headers: this.authHeaders(),
        params,
      })
      .pipe(map((response) => response.data));
  }

  getNotificationStats(): Observable<NotificationStats> {
    return this.http
      .get<StandardResponse<NotificationStats>>(
        `${this.config().notificationBaseUrl}/notification-service/api/v1/admin/notifications/stats`,
        {},
      )
      .pipe(map((response) => response.data));
  }

  getNotificationLogs(filters: {
    type?: string;
    status?: string;
    email?: string;
    page?: number;
    limit?: number;
  }): Observable<NotificationLogPage> {
    let params = new HttpParams()
      .set('page', String(filters.page ?? 1))
      .set('limit', String(filters.limit ?? 10));

    if (filters.type?.trim()) {
      params = params.set('type', filters.type.trim());
    }
    if (filters.status?.trim()) {
      params = params.set('status', filters.status.trim());
    }
    if (filters.email?.trim()) {
      params = params.set('email', filters.email.trim());
    }

    return this.http
      .get<StandardResponse<NotificationLogPage>>(
        `${this.config().notificationBaseUrl}/notification-service/api/v1/admin/notifications/logs`,
        {
          params,
        },
      )
      .pipe(map((response) => response.data));
  }

  getFailedNotifications(): Observable<NotificationLog[]> {
    return this.http
      .get<StandardResponse<NotificationLog[]>>(
        `${this.config().notificationBaseUrl}/notification-service/api/v1/admin/notifications/failed`,
        {},
      )
      .pipe(map((response) => response.data ?? []));
  }

  retryNotification(notificationId: string): Observable<NotificationLog> {
    return this.http
      .post<StandardResponse<NotificationLog>>(
        `${this.config().notificationBaseUrl}/notification-service/api/v1/admin/notifications/failed/${notificationId}/retry`,
        {},
        {},
      )
      .pipe(map((response) => response.data));
  }

  sendHostPassword(request: { email: string; password: string; firstName: string }): Observable<NotificationLog> {
    return this.http
      .post<StandardResponse<NotificationLog>>(
        `${this.config().notificationBaseUrl}/notification-service/api/v1/admin/notifications/send-host-password`,
        request,
        {},
      )
      .pipe(map((response) => response.data));
  }

  private authHeaders(): HttpHeaders {
    const token = this.getToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
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
      payload['createdBy'] = this.resolveCurrentUserId();
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

  private resolveCurrentUserId(): string {
    const token = this.getToken();
    if (!token) {
      return 'unknown';
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1] ?? ''));
      return (payload?.sub as string) || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  private loadConfig(): ApiConfig {
    const raw = this.document.defaultView?.localStorage?.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_CONFIG;
    }

    try {
      return { ...DEFAULT_CONFIG, ...(JSON.parse(raw) as Partial<ApiConfig>) };
    } catch {
      return DEFAULT_CONFIG;
    }
  }
}
