import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { forkJoin } from 'rxjs';
import { EventsApiService } from './events-api.service';
import { CategoriesApiService } from '../categories/categories-api.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { CategoryRecord } from '../categories/categories.models';
import { EventDetail, EventFormValue, EventStatus, EventSummary } from './events.models';

@Component({
  selector: 'app-events',
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatNativeDateModule,
    MatSelectModule,
    MatTimepickerModule,
    ReactiveFormsModule,
  ],
  templateUrl: './events.component.html',
})
export class EventsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly eventsApi = inject(EventsApiService);
  private readonly categoriesApi = inject(CategoriesApiService);
  private readonly snackbar = inject(SnackbarService);
  private readonly destroyRef = inject(DestroyRef);

  readonly events = signal<EventSummary[]>([]);
  readonly categories = signal<CategoryRecord[]>([]);
  readonly editingEventId = signal<number | null>(null);

  readonly filters = this.fb.nonNullable.group({
    search: [''],
    status: [''],
  });

  readonly eventForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    categoryId: [null as number | null, Validators.required],
    venueName: ['', Validators.required],
    venueCity: ['', Validators.required],
    venueAddress: ['', Validators.required],
    startDate: [null as Date | null, Validators.required],
    startTime: [null as Date | null, Validators.required],
    endDate: [null as Date | null, Validators.required],
    endTime: [null as Date | null, Validators.required],
    status: ['DRAFT' as EventStatus, Validators.required],
    ticketTypes: this.fb.array([this.createTicketGroup()]),
    bannerFile: [null as File | null],
  });

  constructor() {
    this.load();
  }

  get ticketTypes(): FormArray {
    return this.eventForm.get('ticketTypes') as FormArray;
  }

  load(): void {
    forkJoin({
      categories: this.categoriesApi.getCategories(),
      events: this.eventsApi.getEvents({
        search: this.filters.getRawValue().search,
        status: this.filters.getRawValue().status,
        page: 0,
        size: 20,
      }),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ categories, events }) => {
          this.categories.set(categories);
          this.events.set(events.dataList ?? []);
        },
        error: (error: { error?: { message?: string }; message?: string }) => {
          this.snackbar.error(error.error?.message || error.message || 'Unable to load events.');
        },
      });
  }

  // startCreate(): void {
  //   this.resetForm();
  // }

  inspect(eventId: number): void {
    this.eventsApi
      .getEvent(eventId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (event) => this.patchEvent(event),
        error: (error: { error?: { message?: string }; message?: string }) => {
          this.snackbar.error(
            error.error?.message || error.message || 'Unable to load event details.',
          );
        },
      });
  }

  save(): void {
    if (this.eventForm.invalid) {
      this.snackbar.warning('Complete all required event fields.');
      return;
    }

    const form = this.eventForm.getRawValue();
    const request: EventFormValue = {
      title: form.title,
      description: form.description,
      categoryId: form.categoryId,
      venueName: form.venueName,
      venueCity: form.venueCity,
      venueAddress: form.venueAddress,
      startDateTime: this.combineDateAndTime(form.startDate, form.startTime),
      endDateTime: this.combineDateAndTime(form.endDate, form.endTime),
      status: form.status,
      ticketTypes: form.ticketTypes.map((ticket) => ({
        ...(ticket.id != null ? { id: ticket.id } : {}),
        name: ticket.name,
        price: ticket.price,
        totalQuantity: ticket.totalQuantity,
      })),
      bannerFile: form.bannerFile,
    };
    const action = this.editingEventId()
      ? this.eventsApi.updateEvent(this.editingEventId()!, request)
      : this.eventsApi.createEvent(request);

    action.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.snackbar.success(response.message || 'Event saved.');
        this.resetForm();
        this.load();
      },
      error: (error: { error?: { message?: string }; message?: string }) => {
        this.snackbar.error(error.error?.message || error.message || 'Unable to save event.');
      },
    });
  }

  changeStatus(eventId: number, status: EventStatus): void {
    this.eventsApi
      .updateEventStatus(eventId, status)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.snackbar.success(response.message || 'Status updated.');
          this.load();
        },
        error: (error: { error?: { message?: string }; message?: string }) => {
          this.snackbar.error(
            error.error?.message || error.message || 'Unable to update event status.',
          );
        },
      });
  }

  remove(eventId: number): void {
    this.eventsApi
      .deleteEvent(eventId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.snackbar.success(response.message || 'Event deleted.');
          this.load();
        },
        error: (error: { error?: { message?: string }; message?: string }) => {
          this.snackbar.error(error.error?.message || error.message || 'Unable to delete event.');
        },
      });
  }

  addTicket(): void {
    this.ticketTypes.push(this.createTicketGroup());
  }

  removeTicket(index: number): void {
    if (this.ticketTypes.length > 1) {
      this.ticketTypes.removeAt(index);
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.eventForm.patchValue({ bannerFile: file });
  }

  resetForm(): void {
    this.editingEventId.set(null);
    this.eventForm.reset({
      title: '',
      description: '',
      categoryId: null,
      venueName: '',
      venueCity: '',
      venueAddress: '',
      startDate: null,
      startTime: null,
      endDate: null,
      endTime: null,
      status: 'DRAFT',
      bannerFile: null,
    });
    this.eventForm.setControl('ticketTypes', this.fb.array([this.createTicketGroup()]));
  }

  private patchEvent(event: EventDetail): void {
    this.editingEventId.set(event.eventId);
    this.eventForm.patchValue({
      title: event.title,
      description: event.description,
      categoryId: event.category.categoryId,
      venueName: event.venue.name,
      venueCity: event.venue.city,
      venueAddress: event.venue.address,
      startDate: this.toInputDate(event.startDateTime),
      startTime: this.toInputTime(event.startDateTime),
      endDate: this.toInputDate(event.endDateTime),
      endTime: this.toInputTime(event.endDateTime),
      status: event.status,
      bannerFile: null,
    });
    this.eventForm.setControl(
      'ticketTypes',
      this.fb.array(
        event.ticketTypes.map((ticket) =>
          this.fb.nonNullable.group({
            id: [ticket.ticketTypeId ?? ticket.id ?? null],
            name: [ticket.name, Validators.required],
            price: [ticket.price, Validators.required],
            totalQuantity: [ticket.totalQuantity, Validators.required],
          }),
        ),
      ),
    );
  }

  private createTicketGroup() {
    return this.fb.nonNullable.group({
      id: [null as number | null],
      name: ['', Validators.required],
      price: [0, Validators.required],
      totalQuantity: [0, Validators.required],
    });
  }

  private combineDateAndTime(date: Date | null, time: Date | null): string {
    if (!date || !time) {
      return '';
    }
    const merged = new Date(date);
    merged.setHours(time.getHours(), time.getMinutes(), 0, 0);
    return merged.toISOString();
  }

  private toInputDate(value: string): Date | null {
    return value ? new Date(value) : null;
  }

  private toInputTime(value: string): Date | null {
    return value ? new Date(value) : null;
  }
}
