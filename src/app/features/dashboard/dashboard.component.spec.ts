import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AdminDataService } from '../../core/services/admin-data.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { BookingStats } from '../../models';
import { DashboardComponent } from './dashboard.component';

describe('dashboard booking stats contract', () => {
  it('renders confirmed, cancelled and pending counts from the backend response', () => {
    const stats: BookingStats = {
      totalBookings: 9, confirmedBookings: 3, cancelledBookings: 2, pendingBookings: 4, totalRevenue: 30,
    };
    TestBed.configureTestingModule({ providers: [
      { provide: AdminDataService, useValue: {
        hasToken: () => true, isAdmin: () => false,
        getBookingStats: () => of(stats), getEvents: () => of({ dataList: [], dataCount: 0 }),
      } },
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
