import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-dialog',
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <div mat-dialog-content>
      <p>{{ data.message }}</p>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close="false">Cancel</button>
      <button mat-flat-button [mat-dialog-close]="true" color="primary">{{ data.confirmLabel ?? 'Confirm' }}</button>
    </div>
  `,
})
export class ConfirmDialogComponent {
  readonly data = inject<{ title: string; message: string; confirmLabel?: string }>(MAT_DIALOG_DATA);
}
