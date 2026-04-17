import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatSidenavModule } from '@angular/material/sidenav';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AdminDataService } from '../core/services/admin-data.service';
import { HeaderComponent } from './header.component';
import { SidebarComponent } from './sidebar.component';

@Component({
  selector: 'app-shell',
  imports: [HeaderComponent, MatSidenavModule, RouterOutlet, SidebarComponent],
  template: `
    <mat-sidenav-container class="shell">
      <mat-sidenav #drawer class="shell__sidenav" [mode]="isMobile() ? 'over' : 'side'" [opened]="!isMobile()">
        <app-sidebar (navigate)="isMobile() ? drawer.close() : null" />
      </mat-sidenav>

      <mat-sidenav-content class="shell__content">
        <app-header
          [title]="pageTitle()"
          (menuClick)="drawer.toggle()"
          (logout)="logout()"
        />

        <main class="content-area">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
})
export class AppShellComponent {
  private readonly breakpoints = inject(BreakpointObserver);
  private readonly router = inject(Router);

  readonly data = inject(AdminDataService);
  readonly isMobile = toSignal(this.breakpoints.observe('(max-width: 900px)').pipe(map((state) => state.matches)), {
    initialValue: false,
  });
  readonly currentPath = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.router.url.split('?')[0] || '/dashboard'),
    ),
    { initialValue: this.router.url || '/dashboard' },
  );

  readonly pageTitle = computed(() => {
    const segment = this.currentPath().split('/').filter(Boolean)[0] ?? 'dashboard';
    return {
      dashboard: 'Overview',
      events: 'Events',
      bookings: 'Bookings',
      users: 'Users',
      categories: 'Categories',
      notifications: 'Notifications',
      settings: 'Settings',
    }[segment]!;
  });

  logout(): void {
    this.data.logout();
    void this.router.navigateByUrl('/login');
  }
}
