import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { SnackbarService } from '../../core/services/snackbar.service';

@Component({
  selector: 'app-login',
  imports: [MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  readonly auth = inject(AuthService);
  private readonly snackbar = inject(SnackbarService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  constructor() {
    if (this.auth.hasToken() && this.auth.canManage()) {
      void this.router.navigateByUrl('/');
    }
  }

  login(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading.set(true);

    this.auth
      .login(this.loginForm.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (!response.access_token) {
            this.snackbar.warning('Login succeeded but no access token was returned.');
            this.loading.set(false);
            return;
          }

          this.auth.setAuthSession(response);
          if (!this.auth.canManage()) {
            this.auth.logout();
            this.snackbar.error('An admin or host account is required for this dashboard.');
            this.loading.set(false);
            return;
          }
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
