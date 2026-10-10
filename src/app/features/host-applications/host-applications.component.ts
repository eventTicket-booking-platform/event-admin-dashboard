import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { SnackbarService } from '../../core/services/snackbar.service';
import { HostApplicationsApiService } from './host-applications-api.service';
import { HostApplication, HostApplicationStatus } from './host-applications.models';

@Component({
  selector: 'app-host-applications',
  imports: [DatePipe, ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './host-applications.component.html',
  styleUrl: './host-applications.component.scss',
})
export class HostApplicationsComponent {
  private readonly api = inject(HostApplicationsApiService);
  private readonly snackbar = inject(SnackbarService);
  private readonly destroyRef = inject(DestroyRef);

  readonly statuses: HostApplicationStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];
  readonly status = signal<HostApplicationStatus>('PENDING');
  readonly applications = signal<HostApplication[]>([]);
  readonly totalCount = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = 10;
  readonly loading = signal(false);
  readonly reviewing = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly review = signal<{ application: HostApplication; action: 'approve' | 'reject' } | null>(null);
  readonly lastReviewed = signal<HostApplication | null>(null);
  readonly rejectionReason = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/\S/), Validators.maxLength(2000)],
  });
  readonly hasNextPage = computed(() => (this.pageIndex() + 1) * this.pageSize < this.totalCount());
  readonly rangeStart = computed(() => this.totalCount() === 0 ? 0 : this.pageIndex() * this.pageSize + 1);
  readonly rangeEnd = computed(() => Math.min((this.pageIndex() + 1) * this.pageSize, this.totalCount()));

  constructor() {
    this.load();
  }

  load(): void {
    if (this.loading() || this.reviewing()) return;
    this.review.set(null);
    this.loadError.set(null);
    this.loading.set(true);
    this.api.list({ status: this.status(), page: this.pageIndex(), size: this.pageSize })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (page) => {
          this.applications.set(page.dataList);
          this.totalCount.set(page.dataCount);
          this.loading.set(false);
        },
        error: () => {
          const message = 'Unable to load host applications. Please try again.';
          this.loadError.set(message);
          this.loading.set(false);
          this.snackbar.error(message);
        },
      });
  }

  changeStatus(status: HostApplicationStatus): void {
    if (this.loading() || this.reviewing()) return;
    this.status.set(status);
    this.pageIndex.set(0);
    this.load();
  }

  previousPage(): void {
    if (this.pageIndex() === 0 || this.loading() || this.reviewing()) return;
    this.pageIndex.update((page) => page - 1);
    this.load();
  }

  nextPage(): void {
    if (!this.hasNextPage() || this.loading() || this.reviewing()) return;
    this.pageIndex.update((page) => page + 1);
    this.load();
  }

  openReview(application: HostApplication, action: 'approve' | 'reject'): void {
    if (application.status !== 'PENDING' || this.loading() || this.reviewing() || this.loadError()) return;
    this.rejectionReason.reset('');
    this.lastReviewed.set(null);
    this.review.set({ application, action });
  }

  cancelReview(): void {
    if (!this.reviewing()) this.review.set(null);
  }

  confirmReview(): void {
    const review = this.review();
    if (!review || this.reviewing() || this.loading() || review.application.status !== 'PENDING') return;
    if (review.action === 'reject' && this.rejectionReason.invalid) {
      this.rejectionReason.markAsTouched();
      return;
    }
    this.reviewing.set(true);
    const request = review.action === 'approve'
      ? this.api.approve(review.application.applicationId)
      : this.api.reject(review.application.applicationId, this.rejectionReason.value.trim());
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (application) => {
        this.lastReviewed.set(application);
        this.applications.update((rows) => rows.map((row) => row.applicationId === application.applicationId ? application : row));
        this.review.set(null);
        this.reviewing.set(false);
        this.snackbar.success(review.action === 'approve' ? 'Host application approved.' : 'Host application rejected.');
        // The reviewed row leaves the PENDING filter; return to a valid first page.
        this.pageIndex.set(0);
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        this.reviewing.set(false);
        if (error.status === 409) {
          this.snackbar.warning('This application is no longer pending. Refreshing the list.');
          this.pageIndex.set(0);
          this.load();
          return;
        }
        const message = error.status === 403 ? 'Admin access is required to review host applications.'
          : error.status === 400 ? 'Check the rejection reason; it must contain 1–2,000 characters.'
          : error.status === 404 ? 'This application is no longer available. Refresh the list.'
          : 'Unable to review the host application. Please try again.';
        this.snackbar.error(message);
      },
    });
  }
}
