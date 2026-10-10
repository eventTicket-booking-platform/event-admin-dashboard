import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { EventsApiService } from '../events/events-api.service';
import { UsersApiService } from '../users/users-api.service';
import { BookingsApiService } from './bookings-api.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { BookingDetail } from './bookings.models';
import { BookingsComponent } from './bookings.component';

describe('booking detail contract', () => {
  it('renders backend unitPrice and supports the EXPIRED booking filter', () => {
    const detail: BookingDetail = {
      bookingId: 1, bookingReference: 'BK-1', userId: 'customer-1', eventId: 2,
      eventTitle: 'Concert', eventStartDateTime: '2027-01-01T10:00:00',
      status: 'EXPIRED', totalAmount: 25, bookingDate: '2026-10-01T10:00:00',
      items: [{ ticketTypeId: 3, ticketTypeName: 'Standard', quantity: 2, unitPrice: 12.5, subtotal: 25 }],
      payment: null,
    };
    let filterStatus: string | undefined;
    TestBed.configureTestingModule({ providers: [
      { provide: AuthService, useValue: { isAdmin: () => false } },
      { provide: EventsApiService, useValue: { getEvents: () => of({ dataList: [], dataCount: 0 }) } },
      { provide: UsersApiService, useValue: {} },
      { provide: BookingsApiService, useValue: {
        getBookingStats: () => of({ totalBookings: 0, confirmedBookings: 0, cancelledBookings: 0, pendingBookings: 0, totalRevenue: 0 }),
        getBookings: (filter: { status?: string }) => {
          filterStatus = filter.status;
          return of({ dataList: [], dataCount: 0 });
        },
        getBooking: () => of(detail),
      } },
      { provide: SnackbarService, useValue: { info: () => {}, error: () => {}, warning: () => {} } },
    ] });
    const fixture = TestBed.createComponent(BookingsComponent);
    fixture.componentInstance.loadDetail(1);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.simple-list__item span').textContent).toContain('12.50');
    expect(fixture.nativeElement.querySelector('.detail-grid').textContent).toContain('EXPIRED');
    fixture.componentInstance.filters.controls.status.setValue('EXPIRED');
    expect(filterStatus).toBe('EXPIRED');
    fixture.destroy();
  });
});
