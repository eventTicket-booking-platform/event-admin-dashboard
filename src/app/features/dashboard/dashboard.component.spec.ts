import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { BookingsApiService } from '../bookings/bookings-api.service';
import { EventsApiService } from '../events/events-api.service';
import { NotificationsApiService } from '../notifications/notifications-api.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { BookingStats } from '../bookings/bookings.models';
import { DashboardComponent } from './dashboard.component';

describe('dashboard booking stats contract', () => {
  it('renders confirmed, cancelled and pending counts from the backend response', () => {
    const stats: BookingStats = {
      totalBookings: 9, confirmedBookings: 3, cancelledBookings: 2, pendingBookings: 4, totalRevenue: 30,
    };
    TestBed.configureTestingModule({ providers: [
      { provide: AuthService, useValue: { hasToken: () => true, isAdmin: () => false } },
      { provide: BookingsApiService, useValue: { getBookingStats: () => of(stats) } },
      { provide: EventsApiService, useValue: { getEvents: () => of({ dataList: [], dataCount: 0 }) } },
      { provide: NotificationsApiService, useValue: {} },
      { provide: SnackbarService, useValue: { error: () => {} } },
    ] });
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const health: HTMLElement = fixture.nativeElement.querySelector('dl');
    expect(Array.from(health.querySelectorAll('dt'), element => element.textContent))
      .toEqual(['Confirmed', 'Cancelled', 'Pending']);
    expect(Array.from(health.querySelectorAll('dd'), element => element.textContent))
      .toEqual(['3', '2', '4']);
    fixture.destroy();
  });
});
