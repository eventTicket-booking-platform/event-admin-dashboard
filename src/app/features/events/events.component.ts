import { DatePipe, CurrencyPipe } from '@angular/common';
import { AfterViewInit, Component, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { AdminDataService } from '../../core/services/admin-data.service';
import { EventRecord } from '../../models';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { DetailDialogComponent } from '../../shared/components/detail-dialog.component';
import { EventFormDialogComponent } from '../../shared/components/event-form-dialog.component';

@Component({
  selector: 'app-events',
  imports: [
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
    MatSnackBarModule,
    MatSortModule,
    MatTableModule,
    ReactiveFormsModule,
  ],
  template: `
    <section class="page-head">
      <div>
        <p class="page-head__eyebrow">Catalog operations</p>
        <h2>Events Management</h2>
        <p class="page-head__copy">Search, filter, publish, and maintain the full event inventory.</p>
      </div>
      <div class="page-head__actions">
        <button mat-flat-button color="primary" (click)="openForm()">Add Event</button>
      </div>
    </section>

    <mat-card class="panel">
      <form [formGroup]="filters" class="filters-grid">
        <mat-form-field appearance="outline" class="filters-grid__search">
          <mat-label>Search</mat-label>
          <input matInput formControlName="search" placeholder="Name, category, or location" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select formControlName="status">
            <mat-option value="">All</mat-option>
            <mat-option value="draft">Draft</mat-option>
            <mat-option value="published">Published</mat-option>
            <mat-option value="cancelled">Cancelled</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Category</mat-label>
          <mat-select formControlName="category">
            <mat-option value="">All</mat-option>
            @for (category of categories; track category) {
              <mat-option [value]="category">{{ category }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Date Range</mat-label>
          <mat-select formControlName="range">
            <mat-option value="">All Dates</mat-option>
            <mat-option value="30">Next 30 Days</mat-option>
            <mat-option value="90">Next 90 Days</mat-option>
          </mat-select>
        </mat-form-field>
      </form>

      @if (loading()) {
        <div class="skeleton-table">
          @for (row of [1,2,3,4,5,6]; track row) {
            <div class="skeleton-table__row"></div>
          }
        </div>
      } @else {
        <div class="table-wrapper">
          <table mat-table [dataSource]="dataSource" matSort>
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Event Name</th>
              <td mat-cell *matCellDef="let row">{{ row.name }}</td>
            </ng-container>
            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Category</th>
              <td mat-cell *matCellDef="let row">{{ row.category }}</td>
            </ng-container>
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Date</th>
              <td mat-cell *matCellDef="let row">{{ row.date | date: 'mediumDate' }}</td>
            </ng-container>
            <ng-container matColumnDef="location">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Location</th>
              <td mat-cell *matCellDef="let row">{{ row.location }}</td>
            </ng-container>
            <ng-container matColumnDef="capacity">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Capacity</th>
              <td mat-cell *matCellDef="let row">{{ row.capacity }}</td>
            </ng-container>
            <ng-container matColumnDef="sold">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Sold</th>
              <td mat-cell *matCellDef="let row">{{ row.sold }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
              <td mat-cell *matCellDef="let row"><span class="status-badge status-badge--{{ row.status }}">{{ row.status }}</span></td>
            </ng-container>
            <ng-container matColumnDef="revenue">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Revenue</th>
              <td mat-cell *matCellDef="let row">{{ row.revenue | currency }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let row">
                <button mat-icon-button (click)="view(row)" aria-label="View details"><mat-icon>visibility</mat-icon></button>
                <button mat-icon-button (click)="openForm(row)" aria-label="Edit event"><mat-icon>edit</mat-icon></button>
                <button mat-icon-button (click)="remove(row)" aria-label="Delete event"><mat-icon>delete</mat-icon></button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
          </table>
        </div>
        <mat-paginator [pageSizeOptions]="[10,25,50]" [pageSize]="10"></mat-paginator>
      }
    </mat-card>
  `,
})
export class EventsComponent implements AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  readonly data = inject(AdminDataService);
  readonly loading = signal(true);
  readonly categories = ['Concert', 'Conference', 'Sports', 'Festival', 'Workshop', 'Theatre'];
  readonly displayedColumns = ['name', 'category', 'date', 'location', 'capacity', 'sold', 'status', 'revenue', 'actions'];
  readonly dataSource = new MatTableDataSource<EventRecord>(this.data.events());
  readonly filters = this.fb.nonNullable.group({
    search: [''],
    status: [''],
    category: [''],
    range: [''],
  });

  constructor() {
    setTimeout(() => this.loading.set(false), 700);
    this.dataSource.filterPredicate = (record, filter) => {
      const parsed = JSON.parse(filter) as { search: string; status: string; category: string; range: string };
      const text = `${record.name} ${record.category} ${record.location}`.toLowerCase();
      const rangeDays = parsed.range ? Number(parsed.range) : null;
      const withinRange = rangeDays ? new Date(record.date).getTime() <= Date.now() + rangeDays * 86400000 : true;
      return (
        text.includes(parsed.search) &&
        (!parsed.status || record.status === parsed.status) &&
        (!parsed.category || record.category === parsed.category) &&
        withinRange
      );
    };

    this.filters.valueChanges.subscribe(() => this.applyFilters());
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  openForm(record?: EventRecord): void {
    this.dialog.open(EventFormDialogComponent, { data: record ?? null }).afterClosed().subscribe((result: EventRecord | null) => {
      if (!result) {
        return;
      }
      if (record) {
        this.data.updateEvent(result);
        this.snackBar.open('Event updated.', 'Close', { duration: 2500 });
      } else {
        this.data.addEvent(result);
        this.snackBar.open('Event created.', 'Close', { duration: 2500 });
      }
      this.refreshData();
    });
  }

  view(record: EventRecord): void {
    this.dialog.open(DetailDialogComponent, { data: { title: record.name, record } });
  }

  remove(record: EventRecord): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: { title: 'Delete event', message: `Delete ${record.name}? This can be undone from the header.`, confirmLabel: 'Delete' },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        this.data.deleteEvent(record.id);
        this.refreshData();
        this.snackBar.open('Event deleted.', 'Close', { duration: 2500 });
      });
  }

  private applyFilters(): void {
    this.dataSource.filter = JSON.stringify({
      search: this.filters.getRawValue().search.toLowerCase(),
      status: this.filters.getRawValue().status,
      category: this.filters.getRawValue().category,
      range: this.filters.getRawValue().range,
    });
  }

  private refreshData(): void {
    this.dataSource.data = this.data.events();
    this.applyFilters();
  }
}
