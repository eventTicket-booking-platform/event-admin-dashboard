import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { forkJoin, of } from 'rxjs';
import { EventsApiService } from '../events/events-api.service';
import { BookingsApiService } from '../bookings/bookings-api.service';
import { NotificationsApiService } from '../notifications/notifications-api.service';
import { AuthService } from '../../core/auth/auth.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { BookingStats } from '../bookings/bookings.models';
import { EventSummary } from '../events/events.models';
import { NotificationStats } from '../notifications/notifications.models';

@Component({
  selector: 'app-dashboard',
  imports: [CurrencyPipe, MatButtonModule, MatCardModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackbar = inject(SnackbarService);
  private readonly eventsApi = inject(EventsApiService);
  private readonly bookingsApi = inject(BookingsApiService);
  private readonly notificationsApi = inject(NotificationsApiService);
  readonly auth = inject(AuthService);

  readonly bookingStats = signal<BookingStats | null>(null);
  readonly notificationStats = signal<NotificationStats | null>(null);
  readonly recentEvents = signal<EventSummary[]>([]);

  constructor() {
    this.load();
  }

  load(): void {
    forkJoin({
      bookingStats: this.bookingsApi.getBookingStats(),
      notificationStats: this.auth.isAdmin() ? this.notificationsApi.getNotificationStats() : of(null),
      events: this.eventsApi.getEvents({ page: 0, size: 5 }),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ bookingStats, notificationStats, events }) => {
          this.bookingStats.set(bookingStats);
          this.notificationStats.set(notificationStats);
          this.recentEvents.set(events.dataList ?? []);
        },
        error: (error: { error?: { message?: string }; message?: string }) => {
          this.snackbar.error(error.error?.message || error.message || 'Unable to load dashboard data.');
        },
      });
  }
}
