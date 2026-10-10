import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CategoriesApiService } from '../categories/categories-api.service';
import { EventsApiService } from './events-api.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { EventDetail, EventFormValue, EventStatus, EventSummary } from './events.models';
import { EventsComponent } from './events.component';

describe('event ticket tier edit contract', () => {
  it('shows valid status actions, completes published events and filters completed events', () => {
    const statuses: EventStatus[] = ['DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED'];
    const events: EventSummary[] = statuses.map((status, index) => ({
      eventId: index + 1, title: status, categoryName: 'Music', city: 'Colombo',
      startDateTime: '2027-01-01T10:00:00', endDateTime: '2027-01-01T12:00:00', bannerUrl: null, status,
    }));
    const changes: Array<{ id: number; status: string }> = [];
    let filterStatus: string | undefined;
    TestBed.configureTestingModule({ providers: [
      { provide: CategoriesApiService, useValue: { getCategories: () => of([]) } },
      { provide: EventsApiService, useValue: {
        getEvents: (filter: { status?: string }) => {
          filterStatus = filter.status;
          return of({ dataList: events, dataCount: events.length });
        },
        updateEventStatus: (id: number, status: string) => {
          changes.push({ id, status });
          return of({ message: 'Updated' });
        },
      } },
      { provide: SnackbarService, useValue: { success: () => {}, error: () => {} } },
    ] });
    const fixture = TestBed.createComponent(EventsComponent);
    fixture.detectChanges();
    const rows: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.data-row'));
    const actionLabels = rows.map(row => Array.from(row.querySelectorAll('button'), button => button.textContent?.trim())
      .filter(label => ['Publish', 'Cancel', 'Complete'].includes(label ?? '')));
    expect(actionLabels).toEqual([['Publish', 'Cancel'], ['Cancel', 'Complete'], ['Publish'], []]);
    expect(rows[3].querySelectorAll('button').length).toBe(0);
    expect(rows[3].querySelector('.status-badge--completed')?.textContent?.trim()).toBe('COMPLETED');
    Array.from(rows[1].querySelectorAll('button')).find(button => button.textContent?.trim() === 'Complete')!.click();
    expect(changes).toEqual([{ id: 2, status: 'COMPLETED' }]);
    fixture.componentInstance.filters.controls.status.setValue('COMPLETED');
    fixture.componentInstance.load();
    expect(filterStatus).toBe('COMPLETED');
    fixture.destroy();
  });

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
      getEvents: () => of({ dataList: [], dataCount: 0 }),
      getEvent: () => of(event),
      updateEvent: (_id: number, form: EventFormValue) => {
        submitted = form;
        return of({ message: 'Saved' });
      },
    };
    TestBed.configureTestingModule({ providers: [
      { provide: CategoriesApiService, useValue: { getCategories: () => of([]) } },
      { provide: EventsApiService, useValue: data },
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
