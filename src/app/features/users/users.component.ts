import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { UsersApiService } from './users-api.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { UserSummary } from './users.models';

@Component({
  selector: 'app-users',
  imports: [MatButtonModule, MatCardModule],
  styleUrl: './users.component.scss',
  templateUrl: './users.component.html',
})
export class UsersComponent {
  private readonly usersApi = inject(UsersApiService);
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
    this.usersApi
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
