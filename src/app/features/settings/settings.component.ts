import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-settings',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatSlideToggleModule,
    ReactiveFormsModule,
  ],
  template: `
    <section class="page-head">
      <div>
        <p class="page-head__eyebrow">Control center</p>
        <h2>Settings</h2>
        <p class="page-head__copy">Manage profile, account security, notifications, and display preferences.</p>
      </div>
      <div class="page-head__actions">
        <button mat-flat-button color="primary" (click)="save()">Save Changes</button>
      </div>
    </section>

    <section class="settings-grid">
      <mat-card class="panel">
        <div class="panel__header"><h3>Profile Settings</h3></div>
        <form [formGroup]="profileForm" class="settings-form">
          <mat-form-field appearance="outline"><mat-label>Name</mat-label><input matInput formControlName="name" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Email</mat-label><input matInput formControlName="email" /></mat-form-field>
          <mat-form-field appearance="outline" class="settings-form__full"><mat-label>Profile Picture URL</mat-label><input matInput formControlName="photo" /></mat-form-field>
        </form>
      </mat-card>

      <mat-card class="panel">
        <div class="panel__header"><h3>Account Security</h3></div>
        <form [formGroup]="securityForm" class="settings-form">
          <mat-form-field appearance="outline"><mat-label>Current Password</mat-label><input matInput type="password" formControlName="currentPassword" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>New Password</mat-label><input matInput type="password" formControlName="newPassword" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Confirm Password</mat-label><input matInput type="password" formControlName="confirmPassword" /></mat-form-field>
          <mat-slide-toggle formControlName="twoFactor">Enable two-factor authentication</mat-slide-toggle>
        </form>
        <div class="security-log">
          <h4>Login Activity</h4>
          <p>Apr 14, 2026 · Colombo · Chrome on Windows</p>
          <p>Apr 13, 2026 · New York · Safari on macOS</p>
        </div>
      </mat-card>

      <mat-card class="panel">
        <div class="panel__header"><h3>Notification Preferences</h3></div>
        <form [formGroup]="notificationForm" class="toggle-stack">
          <mat-slide-toggle formControlName="bookingEmails">Booking confirmations</mat-slide-toggle>
          <mat-slide-toggle formControlName="cancellationEmails">Cancellation alerts</mat-slide-toggle>
          <mat-slide-toggle formControlName="systemAlerts">System alerts</mat-slide-toggle>
          <mat-slide-toggle formControlName="digest">Daily summary digest</mat-slide-toggle>
        </form>
      </mat-card>

      <mat-card class="panel">
        <div class="panel__header"><h3>Theme & Display</h3></div>
        <div class="toggle-stack">
          <mat-slide-toggle [checked]="theme.isDark()" (change)="theme.toggleTheme()">Dark mode</mat-slide-toggle>
          <mat-slide-toggle checked>Compact sidebar accents</mat-slide-toggle>
        </div>
        <form [formGroup]="displayForm" class="settings-form">
          <mat-form-field appearance="outline">
            <mat-label>Timezone</mat-label>
            <mat-select formControlName="timezone">
              <mat-option value="Asia/Colombo">Asia/Colombo</mat-option>
              <mat-option value="America/New_York">America/New_York</mat-option>
              <mat-option value="Europe/London">Europe/London</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Sidebar theme</mat-label>
            <mat-select formControlName="sidebarTheme">
              <mat-option value="navy">Navy</mat-option>
              <mat-option value="slate">Slate</mat-option>
            </mat-select>
          </mat-form-field>
        </form>
      </mat-card>
    </section>
  `,
})
export class SettingsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  readonly theme = inject(ThemeService);

  readonly profileForm = this.fb.nonNullable.group({
    name: ['Olivia Parker', Validators.required],
    email: ['admin@eventhub.com', [Validators.required, Validators.email]],
    photo: ['https://picsum.photos/seed/admin-profile/240/240'],
  });

  readonly securityForm = this.fb.nonNullable.group({
    currentPassword: [''],
    newPassword: [''],
    confirmPassword: [''],
    twoFactor: [true],
  });

  readonly notificationForm = this.fb.nonNullable.group({
    bookingEmails: [true],
    cancellationEmails: [true],
    systemAlerts: [true],
    digest: [false],
  });

  readonly displayForm = this.fb.nonNullable.group({
    timezone: ['Asia/Colombo'],
    sidebarTheme: ['navy'],
  });

  save(): void {
    this.snackBar.open('Settings saved successfully.', 'Close', { duration: 2500 });
  }
}
