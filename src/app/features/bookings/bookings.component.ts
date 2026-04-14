import { CurrencyPipe, DatePipe } from '@angular/common';
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
import { BookingRecord } from '../../models';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { DetailDialogComponent } from '../../shared/components/detail-dialog.component';

@Component({
  selector: 'app-bookings',
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
        <p class="page-head__eyebrow">Order operations</p>
        <h2>Bookings Management</h2>
        <p class="page-head__copy">Track payment health, ticket volume, and booking lifecycle status.</p>
      </div>
    </section>

    <mat-card class="panel">
      <form [formGroup]="filters" class="filters-grid">
        <mat-form-field appearance="outline" class="filters-grid__search">
          <mat-label>Search</mat-label>
          <input matInput formControlName="search" placeholder="Booking ID or customer name" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Booking Status</mat-label>
          <mat-select formControlName="status">
            <mat-option value="">All</mat-option>
            <mat-option value="pending">Pending</mat-option>
            <mat-option value="confirmed">Confirmed</mat-option>
            <mat-option value="cancelled">Cancelled</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Payment</mat-label>
          <mat-select formControlName="paymentStatus">
            <mat-option value="">All</mat-option>
            <mat-option value="pending">Pending</mat-option>
            <mat-option value="completed">Completed</mat-option>
            <mat-option value="failed">Failed</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Date Range</mat-label>
          <mat-select formControlName="range">
            <mat-option value="">All Dates</mat-option>
            <mat-option value="7">Last 7 Days</mat-option>
            <mat-option value="30">Last 30 Days</mat-option>
          </mat-select>
        </mat-form-field>
      </form>

      @if (loading()) {
        <div class="skeleton-table">@for (row of [1,2,3,4,5,6]; track row) { <div class="skeleton-table__row"></div> }</div>
      } @else {
        <div class="table-wrapper">
          <table mat-table [dataSource]="dataSource" matSort>
            <ng-container matColumnDef="id"><th mat-header-cell *matHeaderCellDef mat-sort-header>Booking ID</th><td mat-cell *matCellDef="let row">{{ row.id }}</td></ng-container>
            <ng-container matColumnDef="customerName"><th mat-header-cell *matHeaderCellDef mat-sort-header>Customer</th><td mat-cell *matCellDef="let row">{{ row.customerName }}</td></ng-container>
            <ng-container matColumnDef="eventName"><th mat-header-cell *matHeaderCellDef mat-sort-header>Event</th><td mat-cell *matCellDef="let row">{{ row.eventName }}</td></ng-container>
            <ng-container matColumnDef="ticketsCount"><th mat-header-cell *matHeaderCellDef mat-sort-header>Tickets</th><td mat-cell *matCellDef="let row">{{ row.ticketsCount }}</td></ng-container>
            <ng-container matColumnDef="totalAmount"><th mat-header-cell *matHeaderCellDef mat-sort-header>Total</th><td mat-cell *matCellDef="let row">{{ row.totalAmount | currency }}</td></ng-container>
            <ng-container matColumnDef="bookingDate"><th mat-header-cell *matHeaderCellDef mat-sort-header>Booking Date</th><td mat-cell *matCellDef="let row">{{ row.bookingDate | date: 'mediumDate' }}</td></ng-container>
            <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th><td mat-cell *matCellDef="let row"><span class="status-badge status-badge--{{ row.status }}">{{ row.status }}</span></td></ng-container>
            <ng-container matColumnDef="paymentStatus"><th mat-header-cell *matHeaderCellDef mat-sort-header>Payment</th><td mat-cell *matCellDef="let row"><span class="status-badge status-badge--{{ row.paymentStatus }}">{{ row.paymentStatus }}</span></td></ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let row">
                <button mat-icon-button (click)="view(row)"><mat-icon>visibility</mat-icon></button>
                <button mat-icon-button (click)="cancel(row)"><mat-icon>cancel</mat-icon></button>
                <button mat-icon-button (click)="receipt(row)"><mat-icon>receipt_long</mat-icon></button>
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
export class BookingsComponent implements AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  readonly data = inject(AdminDataService);
  readonly loading = signal(true);
  readonly displayedColumns = ['id', 'customerName', 'eventName', 'ticketsCount', 'totalAmount', 'bookingDate', 'status', 'paymentStatus', 'actions'];
  readonly dataSource = new MatTableDataSource<BookingRecord>(this.data.bookings());
  readonly filters = this.fb.nonNullable.group({
    search: [''],
    status: [''],
    paymentStatus: [''],
    range: [''],
  });

  constructor() {
    setTimeout(() => this.loading.set(false), 850);
    this.dataSource.filterPredicate = (record, filter) => {
      const parsed = JSON.parse(filter) as { search: string; status: string; paymentStatus: string; range: string };
      const text = `${record.id} ${record.customerName}`.toLowerCase();
      const ageDays = Math.abs(Date.now() - new Date(record.bookingDate).getTime()) / 86400000;
      return (
        text.includes(parsed.search) &&
        (!parsed.status || record.status === parsed.status) &&
        (!parsed.paymentStatus || record.paymentStatus === parsed.paymentStatus) &&
        (!parsed.range || ageDays <= Number(parsed.range))
      );
    };
    this.filters.valueChanges.subscribe(() => this.applyFilters());
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  view(record: BookingRecord): void {
    this.dialog.open(DetailDialogComponent, { data: { title: `Booking ${record.id}`, record } });
  }

  cancel(record: BookingRecord): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: { title: 'Cancel booking', message: `Cancel booking ${record.id} for ${record.customerName}?`, confirmLabel: 'Cancel Booking' },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        this.data.cancelBooking(record.id);
        this.dataSource.data = this.data.bookings();
        this.applyFilters();
        this.snackBar.open('Booking cancelled.', 'Close', { duration: 2500 });
      });
  }

  receipt(record: BookingRecord): void {
    this.snackBar.open(`Receipt opened for ${record.id}. Connect PDF generation to provide a document.`, 'Close', { duration: 3000 });
  }

  private applyFilters(): void {
    this.dataSource.filter = JSON.stringify(this.filters.getRawValue()).toLowerCase();
  }
}
