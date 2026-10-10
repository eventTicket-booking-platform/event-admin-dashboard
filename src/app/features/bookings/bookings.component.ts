import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { forkJoin } from 'rxjs';
import { EventsApiService } from '../events/events-api.service';
import { BookingsApiService } from './bookings-api.service';
import { UsersApiService } from '../users/users-api.service';
import { AuthService } from '../../core/auth/auth.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { BookingDetail, BookingStats, BookingSummary } from './bookings.models';
import { EventSummary } from '../events/events.models';
import { UserSummary } from '../users/users.models';

@Component({
  selector: 'app-bookings',
  imports: [
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
  templateUrl: './bookings.component.html',
})
export class BookingsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly eventsApi = inject(EventsApiService);
  private readonly bookingsApi = inject(BookingsApiService);
  private readonly usersApi = inject(UsersApiService);
  readonly auth = inject(AuthService);
  private readonly snackbar = inject(SnackbarService);
  private readonly destroyRef = inject(DestroyRef);

  readonly bookings = signal<BookingSummary[]>([]);
  readonly stats = signal<BookingStats | null>(null);
  readonly detail = signal<BookingDetail | null>(null);
  readonly eventOptions = signal<EventSummary[]>([]);
  readonly userOptions = signal<UserSummary[]>([]);

  readonly filters = this.fb.nonNullable.group({
    status: [''],
    eventId: [''],
    userEmail: [''],
  });

  constructor() {
    this.filters.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.load());
    this.loadEventOptions();
    if (this.auth.isAdmin()) this.loadUserOptions();
    this.load();
  }

  load(): void {
    forkJoin({
      stats: this.bookingsApi.getBookingStats(this.filters.getRawValue().eventId),
      bookings: this.bookingsApi.getBookings({ ...this.filters.getRawValue(), page: 0, size: 20 }),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ stats, bookings }) => {
          this.stats.set(stats);
          const bookingList = bookings.dataList ?? [];
          this.bookings.set(bookingList);
        },
        error: (error: { error?: { message?: string }; message?: string }) => {
          this.snackbar.error(error.error?.message || error.message || 'Unable to load bookings.');
        },
      });
  }

  private loadEventOptions(): void {
    this.eventsApi
      .getEvents({ page: 0, size: 200 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (events) => this.eventOptions.set(events.dataList ?? []),
        error: () => this.snackbar.warning('Unable to load event filter options.'),
      });
  }

  private loadUserOptions(): void {
    this.usersApi
      .getUsers({ page: 0, size: 200 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (users) => this.userOptions.set(users.dataList ?? []),
        error: () => this.snackbar.warning('Unable to load user email filter options.'),
      });
  }

  loadDetail(bookingId: number): void {
    this.bookingsApi
      .getBooking(bookingId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (detail) => {
          this.detail.set(detail);
          this.snackbar.info(`Loaded booking ${detail.bookingReference}.`);
        },
        error: (error: { error?: { message?: string }; message?: string }) => {
          this.snackbar.error(error.error?.message || error.message || 'Unable to load booking detail.');
        },
      });
  }

  resolveUserEmail(userId: string): string {
    return this.userOptions().find((user) => user.userId === userId)?.email ?? userId;
  }
}
