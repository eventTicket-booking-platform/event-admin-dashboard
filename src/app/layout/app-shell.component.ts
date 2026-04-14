import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AdminDataService } from '../core/services/admin-data.service';
import { ThemeService } from '../core/services/theme.service';
import { HeaderComponent } from './header.component';
import { SidebarComponent } from './sidebar.component';

@Component({
  selector: 'app-shell',
  imports: [HeaderComponent, MatIconModule, MatSidenavModule, MatSnackBarModule, RouterOutlet, SidebarComponent],
  template: `
    <mat-sidenav-container class="shell">
      <mat-sidenav #drawer class="shell__sidenav" [mode]="isMobile() ? 'over' : 'side'" [opened]="!isMobile()">
        <app-sidebar [notificationBadge]="notificationCount()" (navigate)="handleSidebarNavigate(drawer)" />
      </mat-sidenav>

      <mat-sidenav-content class="shell__content">
        <app-header
          [notificationCount]="notificationCount()"
          [darkMode]="theme.isDark()"
          [canUndo]="data.canUndo()"
          [canRedo]="data.canRedo()"
          [search]="globalSearch()"
          (menuClick)="drawer.toggle()"
          (themeToggle)="theme.toggleTheme()"
          (searchChange)="globalSearch.set($event)"
          (undo)="handleUndo()"
          (redo)="handleRedo()"
        />

        <main class="content-area">
          <div class="breadcrumbs" aria-label="Breadcrumb">
            @for (crumb of breadcrumbs(); track crumb) {
              <span>{{ crumb }}</span>
            }
          </div>
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
})
export class AppShellComponent {
  private readonly breakpoints = inject(BreakpointObserver);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackBar = inject(MatSnackBar);

  readonly data = inject(AdminDataService);
  readonly theme = inject(ThemeService);
  readonly globalSearch = signal('');
  readonly isMobile = toSignal(this.breakpoints.observe('(max-width: 767px)').pipe(map((state) => state.matches)), {
    initialValue: false,
  });
  readonly notificationCount = computed(() => this.data.notificationStats().failed + this.data.notificationStats().pending);
  readonly breadcrumbs = signal<string[]>(['Dashboard']);

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        map(() => this.router.url.split('?')[0].split('/').filter(Boolean).map((segment) => this.titleize(segment))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((segments) => this.breadcrumbs.set(segments.length ? segments : ['Dashboard']));
  }

  handleUndo(): void {
    this.data.undo();
    this.snackBar.open('Last action undone.', 'Close', { duration: 2500 });
  }

  handleRedo(): void {
    this.data.redo();
    this.snackBar.open('Last action restored.', 'Close', { duration: 2500 });
  }

  handleSidebarNavigate(drawer: MatDrawer): void {
    if (this.isMobile()) {
      drawer.close();
    }
  }

  private titleize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
