import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ProfileApiService } from './profile-api.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { AdminProfile } from './profile.models';

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
  styleUrl: './settings.component.scss',
  templateUrl: './settings.component.html',
})
export class SettingsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly profileApi = inject(ProfileApiService);
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
    this.profileApi
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

    this.profileApi
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

    this.profileApi
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

    this.profileApi
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

    this.profileApi
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
