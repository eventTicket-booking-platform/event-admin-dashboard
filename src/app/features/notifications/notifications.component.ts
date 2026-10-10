import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { forkJoin } from 'rxjs';
import { NotificationsApiService } from './notifications-api.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { NotificationLog, NotificationStats } from './notifications.models';

@Component({
  selector: 'app-notifications',
  imports: [DatePipe, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, ReactiveFormsModule],
  templateUrl: './notifications.component.html',
})
export class NotificationsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly notificationsApi = inject(NotificationsApiService);
  private readonly snackbar = inject(SnackbarService);
  private readonly destroyRef = inject(DestroyRef);

  readonly stats = signal<NotificationStats | null>(null);
  readonly logs = signal<NotificationLog[]>([]);
  readonly failed = signal<NotificationLog[]>([]);

  readonly filters = this.fb.nonNullable.group({
    type: [''],
    status: [''],
    email: [''],
  });

  readonly hostPasswordForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    firstName: ['', Validators.required],
    password: ['', Validators.required],
  });

  constructor() {
    this.filters.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.load());
    this.load();
  }

  load(): void {
    forkJoin({
      stats: this.notificationsApi.getNotificationStats(),
      logs: this.notificationsApi.getNotificationLogs({ ...this.filters.getRawValue(), page: 1, limit: 20 }),
      failed: this.notificationsApi.getFailedNotifications(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ stats, logs, failed }) => {
          this.stats.set(stats);
          this.logs.set(logs.logs ?? []);
          this.failed.set(failed ?? []);
        },
        error: (error: { error?: { message?: string }; message?: string }) => {
          this.snackbar.error(error.error?.message || error.message || 'Unable to load notifications.');
        },
      });
  }

  retry(notificationId: string): void {
    this.notificationsApi
      .retryNotification(notificationId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackbar.success('Notification retried.');
          this.load();
        },
        error: (error: { error?: { message?: string }; message?: string }) => {
          this.snackbar.error(error.error?.message || error.message || 'Unable to retry notification.');
        },
      });
  }

  sendHostPassword(): void {
    if (this.hostPasswordForm.invalid) {
      return;
    }

    this.notificationsApi
      .sendHostPassword(this.hostPasswordForm.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackbar.success('Host password email sent.');
          this.hostPasswordForm.reset({ email: '', firstName: '', password: '' });
          this.load();
        },
        error: (error: { error?: { message?: string }; message?: string }) => {
          this.snackbar.error(error.error?.message || error.message || 'Unable to send host password email.');
        },
      });
  }
}
