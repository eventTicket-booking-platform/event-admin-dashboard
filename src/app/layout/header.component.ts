import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-header',
  imports: [
    DatePipe,
    FormsModule,
    MatBadgeModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSlideToggleModule,
  ],
  template: `
    <header class="topbar">
      <div class="topbar__left">
        <button mat-icon-button (click)="menuClick.emit()" aria-label="Toggle navigation">
          <mat-icon>menu</mat-icon>
        </button>
        <div class="search">
          <mat-icon>search</mat-icon>
          <input
            [(ngModel)]="search"
            (ngModelChange)="searchChange.emit($event)"
            placeholder="Search events, bookings, users"
            aria-label="Global search"
          />
        </div>
      </div>

      <div class="topbar__right">
        <button mat-stroked-button (click)="undo.emit()" [disabled]="!canUndo">
          <mat-icon>undo</mat-icon>
          Undo
        </button>
        <button mat-stroked-button (click)="redo.emit()" [disabled]="!canRedo">
          <mat-icon>redo</mat-icon>
          Redo
        </button>
        <button mat-icon-button [matBadge]="notificationCount" matBadgeColor="warn" aria-label="Notifications">
          <mat-icon>notifications</mat-icon>
        </button>
        <mat-slide-toggle [checked]="darkMode" (change)="themeToggle.emit()">
          {{ darkMode ? 'Dark' : 'Light' }}
        </mat-slide-toggle>
        <button mat-stroked-button [matMenuTriggerFor]="profileMenu">
          <mat-icon>account_circle</mat-icon>
          Admin
        </button>
        <mat-menu #profileMenu="matMenu">
          <button mat-menu-item>Profile</button>
          <button mat-menu-item>Security</button>
          <button mat-menu-item>Logout</button>
        </mat-menu>
      </div>
    </header>
    <div class="toolbar-meta">
      <div>
        <p class="toolbar-meta__label">Workspace</p>
        <strong>Event Hub Operations</strong>
      </div>
      <div>
        <p class="toolbar-meta__label">Last sync</p>
        <strong>{{ now | date: 'medium' }}</strong>
      </div>
    </div>
  `,
})
export class HeaderComponent {
  @Input() notificationCount = 0;
  @Input() darkMode = false;
  @Input() canUndo = false;
  @Input() canRedo = false;
  @Input() search = '';
  @Output() readonly menuClick = new EventEmitter<void>();
  @Output() readonly themeToggle = new EventEmitter<void>();
  @Output() readonly searchChange = new EventEmitter<string>();
  @Output() readonly undo = new EventEmitter<void>();
  @Output() readonly redo = new EventEmitter<void>();

  readonly now = new Date();
}
