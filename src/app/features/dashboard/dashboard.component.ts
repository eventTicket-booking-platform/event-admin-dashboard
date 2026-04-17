import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { forkJoin } from 'rxjs';
import { AdminDataService } from '../../core/services/admin-data.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { BookingStats, EventSummary, NotificationStats } from '../../models';

@Component({
  selector: 'app-dashboard',
  imports: [CurrencyPipe, MatButtonModule, MatCardModule],
  template: `
    <section class="page-actions">
      <button mat-flat-button (click)="load()">Refresh</button>
    </section>

    @if (!data.hasToken()) {
      <mat-card class="panel warning-panel">
        <strong>Connection setup required</strong>
        <p>Add a valid bearer token in Settings before using admin endpoints.</p>
      </mat-card>
    }

    <section class="stats-grid">
      <mat-card class="stats-card"><p>Total bookings</p><h3>{{ bookingStats()?.totalBookings ?? '-' }}</h3></mat-card>
      <mat-card class="stats-card"><p>Revenue</p><h3>{{ bookingStats()?.totalRevenue ?? 0 | currency }}</h3></mat-card>
      <mat-card class="stats-card"><p>Notifications sent</p><h3>{{ notificationStats()?.sentCount ?? '-' }}</h3></mat-card>
      <mat-card class="stats-card"><p>Events loaded</p><h3>{{ recentEvents().length }}</h3></mat-card>
    </section>

    <section class="dashboard-grid">
      <mat-card class="panel">
        <div class="panel__header">
          <div>
            <h3>Recent events</h3>
            <p>Loaded from the admin event list endpoint.</p>
          </div>
        </div>
        <div class="simple-list">
          @for (event of recentEvents(); track event.eventId) {
            <div class="simple-list__item">
              <div>
                <strong>{{ event.title }}</strong>
                <p>{{ event.categoryName }} · {{ event.city }}</p>
              </div>
              <span class="status-badge status-badge--{{ event.status.toLowerCase() }}">{{ event.status }}</span>
            </div>
          } @empty {
            <p class="muted-copy">No events available.</p>
          }
        </div>
      </mat-card>

      <mat-card class="panel">
        <div class="panel__header">
          <div>
            <h3>Booking health</h3>
            <p>From admin booking stats.</p>
          </div>
        </div>
        <dl class="detail-grid">
          <dt>Confirmed</dt><dd>{{ bookingStats()?.confirmedBookings ?? '-' }}</dd>
          <dt>Cancelled</dt><dd>{{ bookingStats()?.cancelledBookings ?? '-' }}</dd>
          <dt>Failed</dt><dd>{{ bookingStats()?.failedBookings ?? '-' }}</dd>
        </dl>
      </mat-card>

      <mat-card class="panel">
        <div class="panel__header">
          <div>
            <h3>Notification health</h3>
            <p>From notification admin stats.</p>
          </div>
        </div>
        <dl class="detail-grid">
          <dt>Total</dt><dd>{{ notificationStats()?.totalNotifications ?? '-' }}</dd>
          <dt>Failed</dt><dd>{{ notificationStats()?.failedCount ?? '-' }}</dd>
          <dt>Unread</dt><dd>{{ notificationStats()?.unreadCount ?? '-' }}</dd>
        </dl>
      </mat-card>
    </section>
  `,
})
export class DashboardComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackbar = inject(SnackbarService);
  readonly data = inject(AdminDataService);

  readonly bookingStats = signal<BookingStats | null>(null);
  readonly notificationStats = signal<NotificationStats | null>(null);
  readonly recentEvents = signal<EventSummary[]>([]);

  constructor() {
    this.load();
  }

  load(): void {
    forkJoin({
      bookingStats: this.data.getBookingStats(),
      notificationStats: this.data.getNotificationStats(),
      events: this.data.getEvents({ page: 0, size: 5 }),
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
