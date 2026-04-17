import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { AdminDataService } from '../../core/services/admin-data.service';
import { SnackbarService } from '../../core/services/snackbar.service';

@Component({
  selector: 'app-login',
  imports: [MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  template: `
    <section class="auth-page">
      <mat-card class="auth-card">
        <div class="auth-card__header">
          <p class="page-head__eyebrow">Event Hub</p>
          <h1>Admin Login</h1>
          <p class="page-head__copy">Sign in with an admin or host account through the gateway auth endpoint.</p>
        </div>

        <form [formGroup]="loginForm" class="form-stack" (ngSubmit)="login()">
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <input matInput type="password" formControlName="password" />
          </mat-form-field>

          <div class="auth-actions">
            <button mat-flat-button type="submit" [disabled]="loginForm.invalid || loading()">
              {{ loading() ? 'Signing in...' : 'Login' }}
            </button>
          </div>
        </form>
      </mat-card>
    </section>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly data = inject(AdminDataService);
  private readonly snackbar = inject(SnackbarService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  constructor() {
    if (this.data.hasToken()) {
      void this.router.navigateByUrl('/');
    }
  }

  login(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading.set(true);

    this.data
      .login(this.loginForm.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (!response.access_token) {
            this.snackbar.warning('Login succeeded but no access token was returned.');
            this.loading.set(false);
            return;
          }

          this.data.setAuthSession(response);
          this.snackbar.success('Logged in successfully.');
          this.loading.set(false);
          void this.router.navigateByUrl('/');
        },
        error: (error: { error?: { message?: string }; message?: string }) => {
          this.snackbar.error(error.error?.message || error.message || 'Login failed.');
          this.loading.set(false);
        },
      });
  }
}
