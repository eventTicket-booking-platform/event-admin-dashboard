import { Routes } from '@angular/router';
import { accessGuard } from './core/auth/guards/access.guard';
import { AppShellComponent } from './layout/app-shell.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [accessGuard],
    canActivateChild: [accessGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'events',
        loadComponent: () => import('./features/events/events.component').then((m) => m.EventsComponent),
      },
      {
        path: 'bookings',
        loadComponent: () => import('./features/bookings/bookings.component').then((m) => m.BookingsComponent),
      },
      {
        path: 'users',
        data: { adminOnly: true },
        loadComponent: () => import('./features/users/users.component').then((m) => m.UsersComponent),
      },
      {
        path: 'categories',
        data: { adminOnly: true },
        loadComponent: () => import('./features/categories/categories.component').then((m) => m.CategoriesComponent),
      },
      {
        path: 'notifications',
        data: { adminOnly: true },
        loadComponent: () =>
          import('./features/notifications/notifications.component').then((m) => m.NotificationsComponent),
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then((m) => m.SettingsComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
