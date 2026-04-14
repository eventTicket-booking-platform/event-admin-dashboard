import { KeyValuePipe, TitleCasePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';

@Component({
  selector: 'app-detail-dialog',
  imports: [
    KeyValuePipe,
    MatButtonModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogTitle,
    TitleCasePipe,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <div mat-dialog-content class="detail-grid">
      @for (entry of data.record | keyvalue; track entry.key) {
        <div class="detail-item">
          <span class="detail-key">{{ entry.key | titlecase }}</span>
          <span class="detail-value">{{ entry.value }}</span>
        </div>
      }
    </div>
    <div mat-dialog-actions align="end">
      <button mat-flat-button color="primary" mat-dialog-close>Close</button>
    </div>
  `,
  styles: `
    .detail-grid {
      display: grid;
      gap: 12px;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      min-width: min(72vw, 760px);
    }

    .detail-item {
      background: var(--surface-elevated);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 12px;
    }

    .detail-key {
      display: block;
      color: var(--text-secondary);
      font-size: 12px;
      margin-bottom: 6px;
    }
  `,
})
export class DetailDialogComponent {
  readonly data = inject<{ title: string; record: Record<string, unknown> }>(MAT_DIALOG_DATA);
}
