import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-header',
  imports: [DatePipe, MatButtonModule, MatIconModule],
  template: `
    <header class="topbar">
      <div class="topbar__left">
        <button mat-icon-button class="mobile-only" (click)="menuClick.emit()" aria-label="Open navigation">
          <mat-icon>menu</mat-icon>
        </button>
        <div>
          <p class="topbar__eyebrow">Event Hub</p>
          <h1>{{ title }}</h1>
        </div>
      </div>

      <div class="topbar__right">
        <button mat-stroked-button (click)="logout.emit()">
          <mat-icon>logout</mat-icon>
          Logout
        </button>
      </div>
    </header>

    <div class="toolbar-meta">
      <strong>{{ now | date: 'medium' }}</strong>
    </div>
  `,
})
export class HeaderComponent {
  @Input() title = 'Admin Panel';
  @Output() readonly menuClick = new EventEmitter<void>();
  @Output() readonly logout = new EventEmitter<void>();

  readonly now = new Date();
}
