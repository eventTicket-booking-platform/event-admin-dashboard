import { DatePipe } from '@angular/common';
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
import { UserRecord } from '../../models';
import { DetailDialogComponent } from '../../shared/components/detail-dialog.component';

@Component({
  selector: 'app-users',
  imports: [
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
        <p class="page-head__eyebrow">Identity & roles</p>
        <h2>Users Management</h2>
        <p class="page-head__copy">Manage access, monitor activity, and review booking history.</p>
      </div>
    </section>

    <mat-card class="panel">
      <form [formGroup]="filters" class="filters-grid">
        <mat-form-field appearance="outline" class="filters-grid__search">
          <mat-label>Search</mat-label>
          <input matInput formControlName="search" placeholder="Name or email" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Role</mat-label>
          <mat-select formControlName="role">
            <mat-option value="">All</mat-option>
            <mat-option value="admin">Admin</mat-option>
            <mat-option value="manager">Manager</mat-option>
            <mat-option value="user">User</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select formControlName="status">
            <mat-option value="">All</mat-option>
            <mat-option value="active">Active</mat-option>
            <mat-option value="inactive">Inactive</mat-option>
          </mat-select>
        </mat-form-field>
      </form>

      @if (loading()) {
        <div class="skeleton-table">@for (row of [1,2,3,4,5,6]; track row) { <div class="skeleton-table__row"></div> }</div>
      } @else {
        <div class="table-wrapper">
          <table mat-table [dataSource]="dataSource" matSort>
            <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th><td mat-cell *matCellDef="let row">{{ row.name }}</td></ng-container>
            <ng-container matColumnDef="email"><th mat-header-cell *matHeaderCellDef mat-sort-header>Email</th><td mat-cell *matCellDef="let row">{{ row.email }}</td></ng-container>
            <ng-container matColumnDef="role"><th mat-header-cell *matHeaderCellDef mat-sort-header>Role</th><td mat-cell *matCellDef="let row"><span class="status-badge status-badge--role-{{ row.role }}">{{ row.role }}</span></td></ng-container>
            <ng-container matColumnDef="joinDate"><th mat-header-cell *matHeaderCellDef mat-sort-header>Join Date</th><td mat-cell *matCellDef="let row">{{ row.joinDate | date: 'mediumDate' }}</td></ng-container>
            <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th><td mat-cell *matCellDef="let row"><span class="status-badge status-badge--{{ row.status }}">{{ row.status }}</span></td></ng-container>
            <ng-container matColumnDef="lastLogin"><th mat-header-cell *matHeaderCellDef mat-sort-header>Last Login</th><td mat-cell *matCellDef="let row">{{ row.lastLogin | date: 'short' }}</td></ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let row">
                <button mat-icon-button (click)="view(row)"><mat-icon>visibility</mat-icon></button>
                <button mat-icon-button (click)="toggle(row)"><mat-icon>{{ row.status === 'active' ? 'person_off' : 'person_add' }}</mat-icon></button>
                <button mat-icon-button (click)="reset(row)"><mat-icon>lock_reset</mat-icon></button>
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
export class UsersComponent implements AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  readonly data = inject(AdminDataService);
  readonly loading = signal(true);
  readonly displayedColumns = ['name', 'email', 'role', 'joinDate', 'status', 'lastLogin', 'actions'];
  readonly dataSource = new MatTableDataSource<UserRecord>(this.data.users());
  readonly filters = this.fb.nonNullable.group({ search: [''], role: [''], status: [''] });

  constructor() {
    setTimeout(() => this.loading.set(false), 900);
    this.dataSource.filterPredicate = (record, filter) => {
      const parsed = JSON.parse(filter) as { search: string; role: string; status: string };
      const text = `${record.name} ${record.email}`.toLowerCase();
      return text.includes(parsed.search) && (!parsed.role || record.role === parsed.role) && (!parsed.status || record.status === parsed.status);
    };
    this.filters.valueChanges.subscribe(() => this.applyFilters());
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  view(record: UserRecord): void {
    this.dialog.open(DetailDialogComponent, { data: { title: `${record.name} profile`, record } });
  }

  toggle(record: UserRecord): void {
    this.data.toggleUserStatus(record.id);
    this.dataSource.data = this.data.users();
    this.applyFilters();
    this.snackBar.open(`${record.name} status updated.`, 'Close', { duration: 2500 });
  }

  reset(record: UserRecord): void {
    this.snackBar.open(`Password reset email sent to ${record.email}.`, 'Close', { duration: 3000 });
  }

  private applyFilters(): void {
    this.dataSource.filter = JSON.stringify({
      search: this.filters.getRawValue().search.toLowerCase(),
      role: this.filters.getRawValue().role,
      status: this.filters.getRawValue().status,
    });
  }
}
