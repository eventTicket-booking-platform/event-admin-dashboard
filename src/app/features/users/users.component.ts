import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { AdminDataService } from '../../core/services/admin-data.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { UserSummary } from '../../models';

@Component({
  selector: 'app-users',
  imports: [MatButtonModule, MatCardModule],
  styles: [
    `
      .users-table-wrap {
        overflow-x: auto;
      }

      .users-table {
        width: 100%;
        border-collapse: collapse;
      }

      .users-table th,
      .users-table td {
        text-align: left;
        padding: 0.75rem 0.65rem;
        border-bottom: 1px solid rgba(148, 163, 184, 0.2);
        vertical-align: middle;
      }

      .users-table th {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #334155;
      }

      .users-table td {
        color: #0f172a;
      }

      .user-cell {
        display: flex;
        align-items: center;
        gap: 0.65rem;
      }

      .avatar {
        width: 2rem;
        height: 2rem;
        border-radius: 999px;
        object-fit: cover;
        background: rgba(148, 163, 184, 0.25);
      }

      .role-pill {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 0.15rem 0.6rem;
        font-size: 0.72rem;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        font-weight: 600;
        background: #e2e8f0;
        color: #0f172a;
      }

      .role-pill--admin {
        background: #d1fae5;
        color: #065f46;
      }

      .role-pill--host {
        background: #fef3c7;
        color: #92400e;
      }

      .pagination {
        margin-top: 1rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
      }

      .pagination__meta {
        color: #334155;
        font-size: 0.9rem;
      }

      .pagination__actions {
        display: flex;
        gap: 0.5rem;
      }

      .pager-btn {
        color: #0f172a !important;
        border-color: #94a3b8 !important;
        background: #f8fafc !important;
      }

      .pager-btn:disabled {
        color: #94a3b8 !important;
        border-color: #cbd5e1 !important;
        background: #f1f5f9 !important;
      }
    `,
  ],
  template: `
    <section class="page-actions">
      <button mat-flat-button (click)="load()">Refresh</button>
    </section>

    <mat-card class="panel">
      <div class="panel__header">
        <div>
          <h3>User list</h3>
          <p>{{ totalCount() }} total users</p>
        </div>
      </div>

      @if (loading()) {
        <p class="muted-copy">Loading users...</p>
      } @else if (users().length === 0) {
        <p class="muted-copy">No users found.</p>
      } @else {
        <div class="users-table-wrap">
          <table class="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              @for (user of users(); track user.email) {
                <tr>
                  <td>
                    <div class="user-cell">
                      @if (user.resourceUrl) {
                        <img [src]="user.resourceUrl" [alt]="user.firstName + ' ' + user.lastName" class="avatar" />
                      } @else {
                        <div class="avatar"></div>
                      }
                      <span>{{ user.firstName }} {{ user.lastName }}</span>
                    </div>
                  </td>
                  <td>{{ user.email }}</td>
                  <td>
                    <span class="role-pill" [class.role-pill--admin]="user.role === 'ADMIN'" [class.role-pill--host]="user.role === 'HOST'">
                      {{ user.role || 'UNKNOWN' }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="pagination">
          <p class="pagination__meta">
            Showing {{ rangeStart() }} - {{ rangeEnd() }} of {{ totalCount() }}
          </p>
          <div class="pagination__actions">
            <button mat-stroked-button class="pager-btn" type="button" (click)="previousPage()" [disabled]="pageIndex() === 0 || loading()">
              Previous
            </button>
            <button mat-stroked-button class="pager-btn" type="button" (click)="nextPage()" [disabled]="!hasNextPage() || loading()">
              Next
            </button>
          </div>
        </div>
      }
    </mat-card>
  `,
})
export class UsersComponent {
  private readonly data = inject(AdminDataService);
  private readonly snackbar = inject(SnackbarService);
  private readonly destroyRef = inject(DestroyRef);

  readonly users = signal<UserSummary[]>([]);
  readonly totalCount = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly loading = signal(false);

  readonly hasNextPage = computed(() => (this.pageIndex() + 1) * this.pageSize() < this.totalCount());
  readonly rangeStart = computed(() => (this.totalCount() === 0 ? 0 : this.pageIndex() * this.pageSize() + 1));
  readonly rangeEnd = computed(() => Math.min((this.pageIndex() + 1) * this.pageSize(), this.totalCount()));

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.data
      .getUsers({ page: this.pageIndex(), size: this.pageSize() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.users.set(page.dataList ?? []);
          this.totalCount.set(page.dataCount ?? 0);
          this.loading.set(false);
        },
        error: (error: { error?: { message?: string }; message?: string }) => {
          this.snackbar.error(error.error?.message || error.message || 'Unable to load users.');
          this.loading.set(false);
        },
      });
  }

  previousPage(): void {
    if (this.pageIndex() === 0) {
      return;
    }
    this.pageIndex.update((value) => value - 1);
    this.load();
  }

  nextPage(): void {
    if (!this.hasNextPage()) {
      return;
    }
    this.pageIndex.update((value) => value + 1);
    this.load();
  }
}
