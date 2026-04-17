import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class SnackbarService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.open(message, 'snackbar-success');
  }

  error(message: string): void {
    this.open(message, 'snackbar-error');
  }

  warning(message: string): void {
    this.open(message, 'snackbar-warning');
  }

  info(message: string): void {
    this.open(message, 'snackbar-info');
  }

  private open(message: string, panelClass: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3500,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: [panelClass],
    });
  }
}
