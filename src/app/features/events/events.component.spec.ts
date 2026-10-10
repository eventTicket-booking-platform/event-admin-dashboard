import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AdminDataService } from '../../core/services/admin-data.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { EventDetail, EventFormValue } from '../../models';
import { EventsComponent } from './events.component';

describe('event ticket tier edit contract', () => {
  it('preserves the API ticketTypeId as the update request id', () => {
    const event: EventDetail = {
      eventId: 1, title: 'Event', description: 'Test', status: 'PUBLISHED', bannerUrl: null,
      category: { categoryId: 1, name: 'Music', description: '', active: true },
      venue: { name: 'Venue', city: 'Colombo', address: 'Test' },
      startDateTime: '2027-01-01T10:00:00', endDateTime: '2027-01-01T12:00:00',
      ticketTypes: [{ ticketTypeId: 42, name: 'Standard', price: 10, totalQuantity: 100 }],
    };
    let submitted: EventFormValue | undefined;
    const data = {
      getCategories: () => of([]), getEvents: () => of({ dataList: [], dataCount: 0 }),
      getEvent: () => of(event),
      updateEvent: (_id: number, form: EventFormValue) => {
        submitted = form;
        return of({ message: 'Saved' });
      },
    };
    TestBed.configureTestingModule({ providers: [
      { provide: AdminDataService, useValue: data },
      { provide: SnackbarService, useValue: { success: () => {}, warning: () => {}, error: () => {} } },
    ] });
    const fixture = TestBed.createComponent(EventsComponent);
    fixture.componentInstance.inspect(1);
    fixture.componentInstance.save();
    expect(submitted?.ticketTypes[0].id).toBe(42);
    expect(submitted?.ticketTypes[0].totalQuantity).toBe(100);
    fixture.destroy();
  });
});
