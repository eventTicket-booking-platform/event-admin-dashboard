import { DatePipe } from '@angular/common';
import { AfterViewInit, Component, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { AdminDataService } from '../../core/services/admin-data.service';
import { NotificationRecord } from '../../models';

@Component({
  selector: 'app-notifications',
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
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
        <p class="page-head__eyebrow">Outbound delivery</p>
        <h2>Notifications Management</h2>
        <p class="page-head__copy">Observe send health, retry failures, and resend communications.</p>
      </div>
    </section>

    <section class="stats-grid stats-grid--compact">
      <mat-card class="stats-card"><p>Sent</p><h3>{{ data.notificationStats().sent }}</h3></mat-card>
      <mat-card class="stats-card"><p>Pending</p><h3>{{ data.notificationStats().pending }}</h3></mat-card>
      <mat-card class="stats-card"><p>Failed</p><h3>{{ data.notificationStats().failed }}</h3></mat-card>
    </section>

    <mat-card class="panel">
      <form [formGroup]="filters" class="filters-grid">
        <mat-form-field appearance="outline">
          <mat-label>Type</mat-label>
          <mat-select formControlName="type">
            <mat-option value="">All</mat-option>
            <mat-option value="email">Email</mat-option>
            <mat-option value="sms">SMS</mat-option>
            <mat-option value="push">Push</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select formControlName="status">
            <mat-option value="">All</mat-option>
            <mat-option value="pending">Pending</mat-option>
            <mat-option value="sent">Sent</mat-option>
            <mat-option value="failed">Failed</mat-option>
          </mat-select>
        </mat-form-field>
      </form>

      @if (loading()) {
        <div class="skeleton-table">@for (row of [1,2,3,4,5,6]; track row) { <div class="skeleton-table__row"></div> }</div>
      } @else {
        <div class="table-wrapper">
          <table mat-table [dataSource]="dataSource" matSort>
            <ng-container matColumnDef="type"><th mat-header-cell *matHeaderCellDef mat-sort-header>Type</th><td mat-cell *matCellDef="let row">{{ row.type }}</td></ng-container>
            <ng-container matColumnDef="recipient"><th mat-header-cell *matHeaderCellDef mat-sort-header>Recipient</th><td mat-cell *matCellDef="let row">{{ row.recipient }}</td></ng-container>
            <ng-container matColumnDef="message"><th mat-header-cell *matHeaderCellDef>Message</th><td mat-cell *matCellDef="let row">{{ row.message }}</td></ng-container>
            <ng-container matColumnDef="sentAt"><th mat-header-cell *matHeaderCellDef mat-sort-header>Date/Time</th><td mat-cell *matCellDef="let row">{{ row.sentAt | date: 'short' }}</td></ng-container>
            <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th><td mat-cell *matCellDef="let row"><span class="status-badge status-badge--{{ row.status }}">{{ row.status }}</span></td></ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let row">
                <button mat-icon-button (click)="retry(row)" [disabled]="row.status !== 'failed'"><mat-icon>refresh</mat-icon></button>
                <button mat-icon-button (click)="resend(row)"><mat-icon>send</mat-icon></button>
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
export class NotificationsComponent implements AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  readonly data = inject(AdminDataService);
  readonly loading = signal(true);
  readonly displayedColumns = ['type', 'recipient', 'message', 'sentAt', 'status', 'actions'];
  readonly dataSource = new MatTableDataSource<NotificationRecord>(this.data.notifications());
  readonly filters = this.fb.nonNullable.group({ type: [''], status: [''] });

  constructor() {
    setTimeout(() => this.loading.set(false), 950);
    this.dataSource.filterPredicate = (record, filter) => {
      const parsed = JSON.parse(filter) as { type: string; status: string };
      return (!parsed.type || record.type === parsed.type) && (!parsed.status || record.status === parsed.status);
    };
    this.filters.valueChanges.subscribe(() => this.applyFilters());
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  retry(record: NotificationRecord): void {
    this.data.retryNotification(record.id);
    this.dataSource.data = this.data.notifications();
    this.applyFilters();
    this.snackBar.open(`Retry succeeded for ${record.recipient}.`, 'Close', { duration: 2500 });
  }

  resend(record: NotificationRecord): void {
    this.data.resendNotification(record.id);
    this.dataSource.data = this.data.notifications();
    this.applyFilters();
    this.snackBar.open(`Notification resent to ${record.recipient}.`, 'Close', { duration: 2500 });
  }

  private applyFilters(): void {
    this.dataSource.filter = JSON.stringify(this.filters.getRawValue());
  }
}
