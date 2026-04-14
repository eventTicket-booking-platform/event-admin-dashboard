import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { EventRecord } from '../../models';

@Component({
  selector: 'app-event-form-dialog',
  imports: [
    MatButtonModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogTitle,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit Event' : 'Add Event' }}</h2>
    <div mat-dialog-content>
      <form [formGroup]="form" class="event-form">
        <mat-form-field appearance="outline">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Category</mat-label>
          <mat-select formControlName="category">
            @for (category of categories; track category) {
              <mat-option [value]="category">{{ category }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Date</mat-label>
          <input matInput type="date" formControlName="date" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Time</mat-label>
          <input matInput type="time" formControlName="time" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Location</mat-label>
          <input matInput formControlName="location" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Capacity</mat-label>
          <input matInput type="number" formControlName="capacity" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Ticket Price</mat-label>
          <input matInput type="number" formControlName="ticketPrice" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select formControlName="status">
            <mat-option value="draft">Draft</mat-option>
            <mat-option value="published">Published</mat-option>
            <mat-option value="cancelled">Cancelled</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="event-form__full">
          <mat-label>Description</mat-label>
          <textarea matInput rows="4" formControlName="description"></textarea>
        </mat-form-field>
      </form>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [mat-dialog-close]="toRecord()" [disabled]="form.invalid">
        Save
      </button>
    </div>
  `,
  styles: `
    .event-form {
      display: grid;
      gap: 16px;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      min-width: min(80vw, 760px);
      padding-top: 8px;
    }

    .event-form__full {
      grid-column: 1 / -1;
    }

    @media (max-width: 720px) {
      .event-form {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class EventFormDialogComponent {
  readonly data = inject<EventRecord | null>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);

  readonly categories = ['Concert', 'Conference', 'Sports', 'Festival', 'Workshop', 'Theatre'];
  readonly form = this.fb.nonNullable.group({
    id: [this.data?.id ?? `EVT-${Math.floor(Date.now() / 1000)}`],
    name: [this.data?.name ?? '', Validators.required],
    category: [this.data?.category ?? 'Concert', Validators.required],
    date: [this.data?.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10), Validators.required],
    time: [this.data?.time ?? '19:00', Validators.required],
    location: [this.data?.location ?? '', Validators.required],
    capacity: [this.data?.capacity ?? 300, [Validators.required, Validators.min(1)]],
    sold: [this.data?.sold ?? 0],
    status: [this.data?.status ?? 'draft', Validators.required],
    description: [this.data?.description ?? '', Validators.required],
    ticketPrice: [this.data?.ticketPrice ?? 45, [Validators.required, Validators.min(1)]],
    thumbnail: [this.data?.thumbnail ?? 'https://picsum.photos/seed/new-event/320/180'],
  });

  toRecord(): EventRecord | null {
    if (this.form.invalid) {
      return null;
    }

    const value = this.form.getRawValue();
    return {
      ...value,
      date: new Date(value.date).toISOString(),
      revenue: value.sold * value.ticketPrice,
    };
  }
}
