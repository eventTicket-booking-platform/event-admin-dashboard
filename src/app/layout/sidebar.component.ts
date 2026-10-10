import { Component, EventEmitter, Output, computed, inject } from '@angular/core';
import { AuthService } from '../core/auth/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  imports: [MatIconModule, RouterLink, RouterLinkActive],
  styles: [
    `
      :host {
        display: block;
        height: 100%;
        background: #0f1720;
        color: #eaf1f4;
      }

      .sidebar {
        background: #0f1720;
        color: #eaf1f4;
      }

      .brand__eyebrow,
      h2,
      .nav-link,
      .nav-link mat-icon,
      .nav-link span {
        color: #eaf1f4;
      }

      .nav-link--active,
      .nav-link:hover {
        background: rgba(255, 255, 255, 0.1);
      }
    `,
  ],
  template: `
    <aside class="sidebar">
      <div class="brand">
        <div class="brand__logo">EH</div>
        <div>
          <p class="brand__eyebrow">Event Hub</p>
          <h2>Admin Panel</h2>
        </div>
      </div>

      <nav class="nav-section" aria-label="Primary">
        @for (item of items(); track item.path) {
          <a class="nav-link" [routerLink]="item.path" routerLinkActive="nav-link--active" (click)="navigate.emit()">
            <mat-icon>{{ item.icon }}</mat-icon>
            <span>{{ item.label }}</span>
          </a>
        }
      </nav>
    </aside>
  `,
})
export class SidebarComponent {
  @Output() readonly navigate = new EventEmitter<void>();

  readonly auth = inject(AuthService);
  readonly items = computed(() => [
    { path: '/dashboard', label: 'Overview', icon: 'dashboard' },
    { path: '/events', label: 'Events', icon: 'event' },
    { path: '/bookings', label: 'Bookings', icon: 'confirmation_number' },
    { path: '/users', label: 'Users', icon: 'group', adminOnly: true },
    { path: '/host-applications', label: 'Host Applications', icon: 'person_add', adminOnly: true },
    { path: '/categories', label: 'Categories', icon: 'category', adminOnly: true },
    { path: '/notifications', label: 'Notifications', icon: 'notifications', adminOnly: true },
    { path: '/settings', label: 'Settings', icon: 'settings' },
  ].filter((item) => !item.adminOnly || this.auth.isAdmin()));
}
