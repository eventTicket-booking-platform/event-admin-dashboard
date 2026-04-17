import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AdminDataService } from '../../core/services/admin-data.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { AdminProfile } from '../../models';

@Component({
  selector: 'app-settings',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  styles: [
    `
      .settings-stack {
        display: grid;
        gap: 18px;
      }

      .profile-card,
      .security-card {
        padding: 0;
      }

      .section-head {
        padding: 20px 20px 18px;
        border-bottom: 1px solid var(--border);
      }

      .section-head h3 {
        margin: 0;
      }

      .section-head p {
        margin: 6px 0 0;
        color: var(--muted);
      }

      .section-body {
        padding: 20px;
      }

      .avatar-row {
        display: flex;
        align-items: center;
        gap: 14px;
        padding-bottom: 18px;
        border-bottom: 1px solid var(--border);
        margin-bottom: 18px;
      }

      .avatar-box {
        width: 52px;
        height: 52px;
        border-radius: 12px;
        display: grid;
        place-items: center;
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        color: #fff;
        font-weight: 700;
        font-size: 1.45rem;
        overflow: hidden;
      }

      .avatar-box img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .avatar-meta {
        display: grid;
        gap: 5px;
      }

      .avatar-meta small {
        color: var(--muted);
      }

      .hidden-file-input {
        position: absolute;
        width: 1px;
        height: 1px;
        opacity: 0;
        pointer-events: none;
      }

      .profile-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }

      .role-row {
        margin-top: 6px;
      }

      .role-row label {
        display: block;
        font-size: 0.88rem;
        font-weight: 600;
        margin-bottom: 6px;
      }

      .role-value {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: #334155;
        font-weight: 600;
      }

      .chip {
        display: inline-flex;
        align-items: center;
        padding: 0.2rem 0.6rem;
        border-radius: 999px;
        font-size: 0.72rem;
        font-weight: 700;
        background: #f1e6ff;
        color: #7e22ce;
      }

      .section-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 18px;
      }

      .security-list {
        display: grid;
        gap: 14px;
      }

      .security-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        padding: 14px;
        border: 1px solid var(--border);
        border-radius: 12px;
        background: var(--surface-alt);
      }

      .security-item__copy h4 {
        margin: 0;
      }

      .security-item__copy p {
        margin: 4px 0 0;
        color: var(--muted);
      }

      .password-reset-box {
        margin-top: 12px;
        padding: 14px;
        border: 1px solid var(--border);
        border-radius: 12px;
        background: var(--surface);
      }

      .password-reset-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }

      .password-reset-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }

      @media (max-width: 900px) {
        .profile-grid {
          grid-template-columns: 1fr;
        }

        .avatar-row {
          align-items: flex-start;
        }

        .password-reset-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  template: `
    <section class="settings-stack">
      <mat-card class="panel profile-card">
        <div class="section-head">
          <h3>Profile Information</h3>
          <p>Update your admin profile details</p>
        </div>

        <div class="section-body">
          <div class="avatar-row">
            <div class="avatar-box">
              @if (profile()?.resourceUrl) {
                <img [src]="profile()!.resourceUrl!" alt="Profile avatar" />
              } @else {
                {{ initials() }}
              }
            </div>
            <div class="avatar-meta">
              <button mat-stroked-button type="button" (click)="avatarInput.click()" [disabled]="avatarUploading()">Change Avatar</button>
              <input
                #avatarInput
                type="file"
                class="hidden-file-input"
                accept="image/png,image/jpeg,image/gif"
                (change)="onAvatarSelected($event)"
              />
              <small>JPG, PNG or GIF. Max 5MB.</small>
            </div>
          </div>

          <form [formGroup]="profileForm" (ngSubmit)="saveProfile()">
            <div class="profile-grid">
              <mat-form-field appearance="outline">
                <mat-label>First Name</mat-label>
                <input matInput formControlName="firstName" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Last Name</mat-label>
                <input matInput formControlName="lastName" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Email Address</mat-label>
                <input matInput formControlName="email" readonly />
              </mat-form-field>
            </div>

            <div class="role-row">
              <label>Admin Role</label>
              <div class="role-value">
                <span>{{ roleLabel() }}</span>
                <span class="chip">Full Access</span>
              </div>
            </div>

            <div class="section-actions">
              <button mat-stroked-button type="button" (click)="resetProfileForm()">Cancel</button>
              <button mat-flat-button type="submit" [disabled]="profileForm.invalid || saving()">Save Changes</button>
            </div>
          </form>
        </div>
      </mat-card>

      <mat-card class="panel security-card">
        <div class="section-head">
          <h3><mat-icon>lock</mat-icon> Security</h3>
          <p>Manage your password and authentication methods</p>
        </div>

        <div class="section-body">
          <div class="security-list">
            <div class="security-item">
              <div class="security-item__copy">
                <h4>Password</h4>
                <p>Use Keycloak account console to update your password.</p>
              </div>
              <button mat-stroked-button type="button" (click)="togglePasswordResetForm()">
                {{ showPasswordResetForm() ? 'Close' : 'Change Password' }}
              </button>
            </div>

            @if (showPasswordResetForm()) {
              <form [formGroup]="passwordResetForm" class="password-reset-box form-stack" (ngSubmit)="submitPasswordReset()">
                <div class="password-reset-grid">
                  <mat-form-field appearance="outline">
                    <mat-label>Email</mat-label>
                    <input matInput formControlName="email" readonly />
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>OTP Code</mat-label>
                    <input matInput formControlName="code" />
                  </mat-form-field>

                  <div class="password-reset-actions">
                    <button
                      mat-stroked-button
                      type="button"
                      (click)="sendPasswordResetCode()"
                      [disabled]="requestingResetCode() || !passwordResetForm.get('email')?.value"
                    >
                      Send OTP
                    </button>
                  </div>
                </div>

                <div class="password-reset-grid">
                  <mat-form-field appearance="outline">
                    <mat-label>New Password</mat-label>
                    <input matInput type="password" formControlName="password" />
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Confirm Password</mat-label>
                    <input matInput type="password" formControlName="confirmPassword" />
                  </mat-form-field>
                </div>

                <div class="password-reset-actions">
                  <button mat-flat-button type="submit" [disabled]="resettingPassword()">Reset Password</button>
                </div>
              </form>
            }
          </div>
        </div>
      </mat-card>
    </section>
  `,
})
export class SettingsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly data = inject(AdminDataService);
  private readonly snackbar = inject(SnackbarService);
  private readonly destroyRef = inject(DestroyRef);

  readonly saving = signal(false);
  readonly avatarUploading = signal(false);
  readonly requestingResetCode = signal(false);
  readonly resettingPassword = signal(false);
  readonly showPasswordResetForm = signal(false);
  readonly profile = signal<AdminProfile | null>(null);

  readonly profileForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: [{ value: '', disabled: true }],
  });

  readonly passwordResetForm = this.fb.nonNullable.group({
    email: [''],
    code: ['', [Validators.required, Validators.minLength(4)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  readonly initials = computed(() => {
    const firstName = this.profileForm.getRawValue().firstName.trim();
    const lastName = this.profileForm.getRawValue().lastName.trim();
    if (!firstName && !lastName) {
      return 'AD';
    }
    const first = firstName[0] ?? '';
    const second = lastName[0] ?? firstName[1] ?? '';
    return `${first}${second}`.toUpperCase() || 'AD';
  });

  readonly roleLabel = computed(() => {
    const role = this.profile()?.role?.toUpperCase() ?? 'ADMIN';
    if (role === 'HOST') {
      return 'Host Administrator';
    }
    if (role === 'USER') {
      return 'Standard User';
    }
    return 'Super Administrator';
  });

  constructor() {
    this.loadProfile();
  }

  loadProfile(): void {
    this.data
      .getProfile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => {
          this.profile.set(profile);
          this.profileForm.patchValue({
            firstName: profile.firstName ?? '',
            lastName: profile.lastName ?? '',
            email: profile.email,
          });
          this.passwordResetForm.patchValue({ email: profile.email });
        },
        error: (error: { error?: { message?: string }; message?: string }) => {
          this.snackbar.error(error.error?.message || error.message || 'Unable to load profile with current token.');
        },
      });
  }

  resetProfileForm(): void {
    const profile = this.profile();
    if (!profile) {
      this.profileForm.reset({ firstName: '', lastName: '', email: '' });
      return;
    }
    this.profileForm.patchValue({
      firstName: profile.firstName ?? '',
      lastName: profile.lastName ?? '',
      email: profile.email,
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.snackbar.warning('Provide a valid full name before saving.');
      return;
    }

    const { firstName, lastName } = this.profileForm.getRawValue();
    this.saving.set(true);

    this.data
      .updateProfile({ firstName: firstName.trim(), lastName: lastName.trim() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackbar.success('Profile updated successfully.');
          this.saving.set(false);
          this.loadProfile();
        },
        error: (error: { error?: { message?: string }; message?: string }) => {
          this.snackbar.error(error.error?.message || error.message || 'Unable to update profile.');
          this.saving.set(false);
        },
      });
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';

    if (!file) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.snackbar.warning('Avatar file must be 5MB or smaller.');
      return;
    }

    this.avatarUploading.set(true);

    this.data
      .uploadAvatar(file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackbar.success('Avatar updated successfully.');
          this.avatarUploading.set(false);
          this.loadProfile();
        },
        error: (error: { error?: { message?: string }; message?: string }) => {
          this.snackbar.error(
            error.error?.message ||
              error.message ||
              'Unable to update avatar. This endpoint currently allows role USER only.',
          );
          this.avatarUploading.set(false);
        },
      });
  }

  onChangePassword(): void {
    this.snackbar.info('Use Keycloak account console to change your password securely.');
  }

  togglePasswordResetForm(): void {
    this.showPasswordResetForm.update((current) => !current);
  }

  sendPasswordResetCode(): void {
    const email = this.passwordResetForm.getRawValue().email?.trim();
    if (!email) {
      this.snackbar.warning('Profile email is required to request a reset code.');
      return;
    }

    this.requestingResetCode.set(true);

    this.data
      .requestPasswordResetCode(email)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackbar.success('Password reset OTP sent to your email.');
          this.requestingResetCode.set(false);
        },
        error: (error: { error?: { message?: string }; message?: string }) => {
          this.snackbar.error(error.error?.message || error.message || 'Unable to send password reset OTP.');
          this.requestingResetCode.set(false);
        },
      });
  }

  submitPasswordReset(): void {
    const { email, code, password, confirmPassword } = this.passwordResetForm.getRawValue();

    if (!email?.trim()) {
      this.snackbar.warning('Profile email is required to reset password.');
      return;
    }
    if (!code?.trim()) {
      this.snackbar.warning('OTP code is required.');
      return;
    }
    if (!password || password.length < 8) {
      this.snackbar.warning('New password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      this.snackbar.warning('Password and confirm password must match.');
      return;
    }

    this.resettingPassword.set(true);

    this.data
      .resetPassword({ email: email.trim(), code: code.trim(), password })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (changed) => {
          this.resettingPassword.set(false);
          if (!changed) {
            this.snackbar.error('Password reset failed. Verify OTP and try again.');
            return;
          }
          this.snackbar.success('Password changed successfully.');
          this.passwordResetForm.patchValue({ code: '', password: '', confirmPassword: '' });
          this.showPasswordResetForm.set(false);
        },
        error: (error: { error?: { message?: string }; message?: string }) => {
          this.snackbar.error(error.error?.message || error.message || 'Unable to reset password.');
          this.resettingPassword.set(false);
        },
      });
  }
}
