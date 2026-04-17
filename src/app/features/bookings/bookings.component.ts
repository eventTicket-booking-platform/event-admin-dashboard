import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { forkJoin } from 'rxjs';
import { AdminDataService } from '../../core/services/admin-data.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { BookingDetail, BookingStats, BookingSummary, EventSummary, UserSummary } from '../../models';

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
  template: `
    <section class="page-actions">
      <button mat-flat-button (click)="load()">Refresh</button>
    </section>

    <section class="stats-grid stats-grid--compact">
      <mat-card class="stats-card"><p>Total</p><h3>{{ stats()?.totalBookings ?? '-' }}</h3></mat-card>
      <mat-card class="stats-card"><p>Confirmed</p><h3>{{ stats()?.confirmedBookings ?? '-' }}</h3></mat-card>
      <mat-card class="stats-card"><p>Cancelled</p><h3>{{ stats()?.cancelledBookings ?? '-' }}</h3></mat-card>
    </section>

    <mat-card class="panel">
      <form [formGroup]="filters" class="filters-grid filters-grid--three">
        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select formControlName="status">
            <mat-option value="">All</mat-option>
            <mat-option value="PENDING">PENDING</mat-option>
            <mat-option value="CONFIRMED">CONFIRMED</mat-option>
            <mat-option value="CANCELLED">CANCELLED</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Event</mat-label>
          <mat-select formControlName="eventId">
            <mat-option value="">All events</mat-option>
            @for (event of eventOptions(); track event.eventId) {
              <mat-option [value]="event.eventId.toString()">{{ event.title }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>User email</mat-label>
          <mat-select formControlName="userEmail">
            <mat-option value="">All users</mat-option>
            @for (user of userOptions(); track user.email) {
              <mat-option [value]="user.email">{{ user.email }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </form>
    </mat-card>

    <section class="content-grid">
      <mat-card class="panel">
        <div class="panel__header">
          <div>
            <h3>Booking list</h3>
            <p>{{ bookings().length }} records from the admin booking list endpoint.</p>
          </div>
        </div>
        <div class="data-list">
          @for (booking of bookings(); track booking.bookingId) {
            <button class="data-row data-row--button" type="button" (click)="loadDetail(booking.bookingId)">
              <div class="data-row__main">
                <strong>{{ booking.bookingReference }}</strong>
                <p>{{ booking.eventTitle }}</p>
                <span>{{ booking.bookingDate | date: 'medium' }}</span>
              </div>
              <div class="data-row__side">
                <span class="status-badge status-badge--{{ booking.status.toLowerCase() }}">{{ booking.status }}</span>
                <strong>{{ booking.totalAmount | currency }}</strong>
              </div>
            </button>
          } @empty {
            <p class="muted-copy">No bookings found.</p>
          }
        </div>
      </mat-card>

      <mat-card class="panel">
        <div class="panel__header">
          <div>
            <h3>Booking detail</h3>
            <p>Loaded from the booking detail endpoint.</p>
          </div>
        </div>

        @if (detail(); as booking) {
          <dl class="detail-grid">
            <dt>Reference</dt><dd>{{ booking.bookingReference }}</dd>
            <dt>User</dt><dd>{{ resolveUserEmail(booking.userId) }}</dd>
            <dt>Event</dt><dd>{{ booking.eventTitle }}</dd>
            <dt>Status</dt><dd>{{ booking.status }}</dd>
            <dt>Total</dt><dd>{{ booking.totalAmount | currency }}</dd>
            <dt>Booked</dt><dd>{{ booking.bookingDate | date: 'medium' }}</dd>
          </dl>

          <div class="ticket-box">
            <h3>Items</h3>
            <div class="simple-list">
              @for (item of booking.items; track $index) {
                <div class="simple-list__item">
                  <div>
                    <strong>{{ item.ticketTypeName || 'Ticket' }}</strong>
                    <p>Qty {{ item.quantity }}</p>
                  </div>
                  <span>{{ item.price | currency }}</span>
                </div>
              } @empty {
                <p class="muted-copy">No line items returned.</p>
              }
            </div>
          </div>
        } @else {
          <p class="muted-copy">Select a booking to inspect details.</p>
        }
      </mat-card>
    </section>
  `,
})
export class BookingsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly data = inject(AdminDataService);
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
    this.loadUserOptions();
    this.load();
  }

  load(): void {
    forkJoin({
      stats: this.data.getBookingStats(),
      bookings: this.data.getBookings({ ...this.filters.getRawValue(), page: 0, size: 20 }),
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
    this.data
      .getEvents({ page: 0, size: 200 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (events) => this.eventOptions.set(events.dataList ?? []),
        error: () => this.snackbar.warning('Unable to load event filter options.'),
      });
  }

  private loadUserOptions(): void {
    this.data
      .getUsers({ page: 0, size: 200 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (users) => this.userOptions.set(users.dataList ?? []),
        error: () => this.snackbar.warning('Unable to load user email filter options.'),
      });
  }

  loadDetail(bookingId: number): void {
    this.data
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
