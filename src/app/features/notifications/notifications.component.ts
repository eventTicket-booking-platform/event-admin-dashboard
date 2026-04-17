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
import { AdminDataService } from '../../core/services/admin-data.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { NotificationLog, NotificationStats } from '../../models';

@Component({
  selector: 'app-notifications',
  imports: [DatePipe, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, ReactiveFormsModule],
  template: `
    <section class="page-actions">
      <button mat-flat-button (click)="load()">Refresh</button>
    </section>

    <section class="stats-grid stats-grid--compact">
      <mat-card class="stats-card"><p>Total</p><h3>{{ stats()?.totalNotifications ?? '-' }}</h3></mat-card>
      <mat-card class="stats-card"><p>Sent</p><h3>{{ stats()?.sentCount ?? '-' }}</h3></mat-card>
      <mat-card class="stats-card"><p>Failed</p><h3>{{ stats()?.failedCount ?? '-' }}</h3></mat-card>
    </section>

    <mat-card class="panel">
      <form [formGroup]="filters" class="filters-grid filters-grid--three">
        <mat-form-field appearance="outline">
          <mat-label>Type</mat-label>
          <input matInput formControlName="type" placeholder="EMAIL_VERIFICATION_OTP" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <input matInput formControlName="status" placeholder="SENT or FAILED" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" />
        </mat-form-field>
      </form>
    </mat-card>

    <section class="content-grid">
      <mat-card class="panel">
        <div class="panel__header">
          <div>
            <h3>Notification logs</h3>
            <p>{{ logs().length }} records from the notification logs endpoint.</p>
          </div>
        </div>
        <div class="data-list">
          @for (log of logs(); track log._id) {
            <div class="data-row">
              <div class="data-row__main">
                <strong>{{ log.subject }}</strong>
                <p>{{ log.email }} · {{ log.type }}</p>
                <span>{{ log.createdAt | date: 'medium' }}</span>
              </div>
              <div class="data-row__side">
                <span class="status-badge status-badge--{{ log.status.toLowerCase() }}">{{ log.status }}</span>
              </div>
            </div>
          } @empty {
            <p class="muted-copy">No logs found.</p>
          }
        </div>
      </mat-card>

      <div class="stack-grid">
        <mat-card class="panel">
          <div class="panel__header">
            <div>
              <h3>Failed notifications</h3>
              <p>Retry only supported failed entries.</p>
            </div>
          </div>
          <div class="simple-list">
            @for (item of failed(); track item._id) {
              <div class="simple-list__item">
                <div>
                  <strong>{{ item.email }}</strong>
                  <p>{{ item.failureReason || 'Retry available' }}</p>
                </div>
                <button mat-stroked-button (click)="retry(item._id)">Retry</button>
              </div>
            } @empty {
              <p class="muted-copy">No failed notifications.</p>
            }
          </div>
        </mat-card>

        <mat-card class="panel">
          <div class="panel__header">
            <div>
              <h3>Send host password</h3>
              <p>Sends the host password email through the notification admin API.</p>
            </div>
          </div>
          <form [formGroup]="hostPasswordForm" class="form-stack" (ngSubmit)="sendHostPassword()">
            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput formControlName="email" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>First name</mat-label>
              <input matInput formControlName="firstName" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Password</mat-label>
              <input matInput formControlName="password" />
            </mat-form-field>
            <button mat-flat-button type="submit" [disabled]="hostPasswordForm.invalid">Send email</button>
          </form>
        </mat-card>
      </div>
    </section>
  `,
})
export class NotificationsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly data = inject(AdminDataService);
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
      stats: this.data.getNotificationStats(),
      logs: this.data.getNotificationLogs({ ...this.filters.getRawValue(), page: 1, limit: 20 }),
      failed: this.data.getFailedNotifications(),
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
    this.data
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

    this.data
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
