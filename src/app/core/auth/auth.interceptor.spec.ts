import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { BookingsApiService } from '../../features/bookings/bookings-api.service';
import { CategoriesApiService } from '../../features/categories/categories-api.service';
import { EventsApiService } from '../../features/events/events-api.service';
import { EventFormValue } from '../../features/events/events.models';
import { NotificationsApiService } from '../../features/notifications/notifications-api.service';
import { AuthService } from './auth.service';
import { authInterceptor } from './auth.interceptor';

const token = (exp: number) => `h.${btoa(JSON.stringify({ exp, realm_access: { roles: ['ADMIN'] } }))}.s`;

describe('central authentication interceptor', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting(), provideRouter([]),
    ] });
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('attaches JWTs to notification requests and leaves public category reads unauthenticated', () => {
    const access = token(Math.floor(Date.now() / 1000) + 3600);
    TestBed.inject(AuthService).setToken(access);
    const http = TestBed.inject(HttpTestingController);
    TestBed.inject(NotificationsApiService).getNotificationStats().subscribe();
    const stats = http.expectOne('/api/notification-service/api/v1/admin/notifications/stats');
    expect(stats.request.headers.get('Authorization')).toBe(`Bearer ${access}`);
    stats.flush({ data: { totalNotifications: 0, sentCount: 0, failedCount: 0, unreadCount: 0 } });
    TestBed.inject(CategoriesApiService).getCategories().subscribe();
    const categories = http.expectOne('/api/event-service/api/v1/events/categories');
    expect(categories.request.headers.has('Authorization')).toBe(false);
    categories.flush([]);
  });

  it('shares one session-extension prompt and refresh across concurrent expired-token requests', () => {
    const auth = TestBed.inject(AuthService);
    auth.setAuthSession({ access_token: token(1), refresh_token: 'old-refresh' });
    const prompt = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const http = TestBed.inject(HttpTestingController);
    TestBed.inject(BookingsApiService).getBookingStats().subscribe();
    TestBed.inject(NotificationsApiService).getNotificationStats().subscribe();
    const refresh = http.expectOne('/api/user-service/api/v1/users/visitors/refresh-token');
    expect(refresh.request.headers.has('Authorization')).toBe(false);
    expect(refresh.request.body).toEqual({ refreshToken: 'old-refresh' });
    const renewed = token(Math.floor(Date.now() / 1000) + 3600);
    refresh.flush({ data: { access_token: renewed, refresh_token: 'new-refresh' } });
    const bookings = http.expectOne('/api/booking-service/api/v1/admin/stats');
    const notifications = http.expectOne('/api/notification-service/api/v1/admin/notifications/stats');
    expect(bookings.request.headers.get('Authorization')).toBe(`Bearer ${renewed}`);
    expect(notifications.request.headers.get('Authorization')).toBe(`Bearer ${renewed}`);
    bookings.flush({});
    notifications.flush({ data: {} });
    expect(prompt).toHaveBeenCalledTimes(1);
    expect(auth.getToken()).toBe(renewed);
    expect(auth.getRefreshToken()).toBe('new-refresh');
  });

  it('retains the exact multipart request when retrying an event update after a 401', () => {
    const auth = TestBed.inject(AuthService);
    auth.setAuthSession({ access_token: token(Math.floor(Date.now() / 1000) + 3600), refresh_token: 'refresh' });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const form: EventFormValue = {
      title: 'Concert', description: 'Test', categoryId: 1,
      venueName: 'Hall', venueCity: 'Colombo', venueAddress: 'Address',
      startDateTime: '2027-01-01T10:00:00Z', endDateTime: '2027-01-01T12:00:00Z',
      status: 'PUBLISHED', ticketTypes: [{ id: 42, name: 'Standard', price: 10, totalQuantity: 100 }],
      bannerFile: new File(['image'], 'banner.png', { type: 'image/png' }),
    };
    TestBed.inject(EventsApiService).updateEvent(7, form).subscribe();
    const http = TestBed.inject(HttpTestingController);
    const first = http.expectOne('/api/event-service/api/v1/events/7');
    expect(first.request.method).toBe('PUT');
    const body = first.request.body as FormData;
    const payload = JSON.parse(body.get('request') as string);
    expect(payload.ticketTypes).toEqual([{ id: 42, name: 'Standard', price: 10, totalQuantity: 100 }]);
    expect(payload.status).toBeUndefined();
    expect(body.get('bannerimg')).toBe(form.bannerFile);
    expect(first.request.headers.has('Content-Type')).toBe(false);
    first.flush({}, { status: 401, statusText: 'Unauthorized' });
    const refresh = http.expectOne('/api/user-service/api/v1/users/visitors/refresh-token');
    refresh.flush({ data: { access_token: 'renewed', refresh_token: 'rotated' } });
    const retry = http.expectOne('/api/event-service/api/v1/events/7');
    expect(retry.request.body).toBe(body);
    expect(retry.request.headers.get('Authorization')).toBe('Bearer renewed');
    retry.flush({ message: 'Updated' });
  });

  it('clears the session and returns to login when extension is declined', () => {
    const auth = TestBed.inject(AuthService);
    auth.setAuthSession({ access_token: token(1), refresh_token: 'refresh' });
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    let status: number | undefined;
    TestBed.inject(HttpClient).get('/api/booking-service/api/v1/admin/stats')
      .subscribe({ error: error => status = error.status });
    expect(status).toBe(401);
    expect(auth.hasToken()).toBe(false);
    expect(auth.getRefreshToken()).toBe('');
    expect(navigate).toHaveBeenCalledWith('/login');
    TestBed.inject(HttpTestingController).expectNone('/api/user-service/api/v1/users/visitors/refresh-token');
  });
});
