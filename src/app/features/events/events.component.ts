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
import { AdminDataService } from '../../core/services/admin-data.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { CategoryRecord, EventDetail, EventFormValue, EventStatus, EventSummary } from '../../models';

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
  template: `
    <section class="page-actions">
      <div class="page-actions__group">
        <!-- <button mat-stroked-button (click)="startCreate()">New event</button> -->
        <button mat-flat-button (click)="load()">Refresh</button>
      </div>
    </section>

    <mat-card class="panel">
      <form [formGroup]="filters" class="filters-grid filters-grid--three">
        <mat-form-field appearance="outline">
          <mat-label>Search</mat-label>
          <input matInput formControlName="search" placeholder="Title" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select formControlName="status">
            <mat-option value="">All</mat-option>
            <mat-option value="DRAFT">DRAFT</mat-option>
            <mat-option value="PUBLISHED">PUBLISHED</mat-option>
            <mat-option value="CANCELLED">CANCELLED</mat-option>
          </mat-select>
        </mat-form-field>
        <div class="inline-actions">
          <button mat-flat-button type="button" (click)="load()">Apply</button>
        </div>
      </form>
    </mat-card>

    <section class="content-grid">
      <mat-card class="panel">
        <div class="panel__header">
          <div>
            <h3>Event list(cheak cicd)</h3>
            <p>{{ events().length }} records from admin list endpoint.</p>
          </div>
        </div>

        <div class="data-list">
          @for (event of events(); track event.eventId) {
            <div class="data-row">
              <div class="data-row__main">
                <strong>{{ event.title }}</strong>
                <p>{{ event.categoryName }} · {{ event.city }}</p>
                <span>{{ event.startDateTime | date: 'medium' }}</span>
              </div>
              <div class="data-row__side">
                <span class="status-badge status-badge--{{ event.status.toLowerCase() }}">{{
                  event.status
                }}</span>
                <div class="inline-actions">
                  <button mat-button (click)="inspect(event.eventId)">Edit</button>
                  <button mat-button (click)="changeStatus(event.eventId, 'PUBLISHED')">
                    Publish
                  </button>
                  <button mat-button (click)="changeStatus(event.eventId, 'CANCELLED')">
                    Cancel
                  </button>
                  <button mat-button (click)="remove(event.eventId)">Delete</button>
                </div>
              </div>
            </div>
          } @empty {
            <p class="muted-copy">No events found.</p>
          }
        </div>
      </mat-card>

      <mat-card class="panel">
        <div class="panel__header">
          <div>
            <h3>{{ editingEventId() ? 'Edit event' : 'Create event' }}</h3>
            <p>Uses multipart payload with request JSON and an optional banner image.</p>
          </div>
        </div>

        <form [formGroup]="eventForm" class="form-stack" (ngSubmit)="save()">
          <mat-form-field appearance="outline">
            <mat-label>Title</mat-label>
            <input matInput formControlName="title" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Description</mat-label>
            <textarea matInput rows="4" formControlName="description"></textarea>
          </mat-form-field>

          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>Category</mat-label>
              <mat-select formControlName="categoryId">
                @for (category of categories(); track category.categoryId) {
                  <mat-option [value]="category.categoryId">{{ category.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Status</mat-label>
              <mat-select formControlName="status">
                <mat-option value="DRAFT">DRAFT</mat-option>
                <mat-option value="PUBLISHED">PUBLISHED</mat-option>
                <mat-option value="CANCELLED">CANCELLED</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Start date</mat-label>
              <input matInput [matDatepicker]="startDatePicker" formControlName="startDate" />
              <mat-datepicker-toggle matSuffix [for]="startDatePicker"></mat-datepicker-toggle>
              <mat-datepicker #startDatePicker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Start time</mat-label>
              <input matInput [matTimepicker]="startTimePicker" formControlName="startTime" />
              <mat-timepicker-toggle matSuffix [for]="startTimePicker"></mat-timepicker-toggle>
              <mat-timepicker #startTimePicker></mat-timepicker>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>End date</mat-label>
              <input matInput [matDatepicker]="endDatePicker" formControlName="endDate" />
              <mat-datepicker-toggle matSuffix [for]="endDatePicker"></mat-datepicker-toggle>
              <mat-datepicker #endDatePicker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>End time</mat-label>
              <input matInput [matTimepicker]="endTimePicker" formControlName="endTime" />
              <mat-timepicker-toggle matSuffix [for]="endTimePicker"></mat-timepicker-toggle>
              <mat-timepicker #endTimePicker></mat-timepicker>
            </mat-form-field>

            <div class="file-field">
              <label>Banner image</label>
              <input type="file" (change)="onFileChange($event)" />
            </div>
          </div>

          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>Venue name</mat-label>
              <input matInput formControlName="venueName" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Venue city</mat-label>
              <input matInput formControlName="venueCity" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Venue address</mat-label>
              <input matInput formControlName="venueAddress" />
            </mat-form-field>
          </div>

          <div class="ticket-box">
            <div class="panel__header">
              <div>
                <h3>Ticket types</h3>
                <p>At least one ticket type is required by the backend.</p>
              </div>
              <button mat-stroked-button type="button" (click)="addTicket()">Add ticket</button>
            </div>

            <div formArrayName="ticketTypes" class="ticket-list">
              @for (ticket of ticketTypes.controls; track $index) {
                <div class="ticket-row" [formGroupName]="$index">
                  <mat-form-field appearance="outline">
                    <mat-label>Name</mat-label>
                    <input matInput formControlName="name" />
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Price</mat-label>
                    <input matInput type="number" formControlName="price" />
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Quantity</mat-label>
                    <input matInput type="number" formControlName="totalQuantity" />
                  </mat-form-field>
                  <button
                    mat-icon-button
                    type="button"
                    (click)="removeTicket($index)"
                    [disabled]="ticketTypes.length === 1"
                  >
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              }
            </div>
          </div>

          <div class="inline-actions">
            <button mat-flat-button type="submit" [disabled]="eventForm.invalid">Save</button>
            <button mat-stroked-button type="button" (click)="resetForm()">Clear</button>
          </div>
        </form>
      </mat-card>
    </section>
  `,
})
export class EventsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly data = inject(AdminDataService);
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
      categories: this.data.getCategories(),
      events: this.data.getEvents({
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
    this.data
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
      ? this.data.updateEvent(this.editingEventId()!, request)
      : this.data.createEvent(request);

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

  changeStatus(eventId: number, status: 'PUBLISHED' | 'CANCELLED'): void {
    this.data
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
    this.data
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
            id: [ticket.id ?? null],
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
