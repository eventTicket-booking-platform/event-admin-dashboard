import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  imports: [MatBadgeModule, MatIconModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <div class="brand">
        <div class="brand__logo">EH</div>
        <div>
          <p class="brand__eyebrow">Event Hub</p>
          <h1>Admin Console</h1>
        </div>
      </div>

      <nav class="nav-section" aria-label="Primary navigation">
        @for (item of primaryItems; track item.path) {
          <a class="nav-link" [routerLink]="item.path" routerLinkActive="nav-link--active" (click)="navigate.emit()">
            <mat-icon>{{ item.icon }}</mat-icon>
            <span>{{ item.label }}</span>
          </a>
        }
      </nav>

      <div class="nav-divider"></div>

      <nav class="nav-section" aria-label="Secondary navigation">
        @for (item of secondaryItems; track item.path) {
          <a class="nav-link" [routerLink]="item.path" routerLinkActive="nav-link--active" (click)="navigate.emit()">
            <mat-icon>{{ item.icon }}</mat-icon>
            <span>{{ item.label }}</span>
            @if (item.badge) {
              <span class="nav-link__count">{{ item.badge }}</span>
            }
          </a>
        }
      </nav>
    </aside>
  `,
})
export class SidebarComponent {
  @Input() notificationBadge = 0;
  @Output() readonly navigate = new EventEmitter<void>();

  readonly primaryItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'space_dashboard' },
    { path: '/events', label: 'Events', icon: 'event' },
    { path: '/bookings', label: 'Bookings', icon: 'confirmation_number' },
    { path: '/users', label: 'Users', icon: 'groups' },
  ];

  get secondaryItems() {
    return [
      { path: '/notifications', label: 'Notifications', icon: 'notifications', badge: this.notificationBadge || null },
      { path: '/reports', label: 'Reports', icon: 'analytics' },
      { path: '/settings', label: 'Settings', icon: 'settings' },
    ];
  }
}
