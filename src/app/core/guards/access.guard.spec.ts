import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { AdminDataService, dashboardRole } from '../services/admin-data.service';
import { accessGuard } from './access.guard';

const token = (...roles: string[]) => `header.${btoa(JSON.stringify({ realm_access: { roles } }))}.signature`;

describe('shared dashboard access', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideRouter([])] });
  });

  it('recognizes admin and host, with admin precedence', () => {
    expect(dashboardRole(token('HOST', 'ADMIN'))).toBe('ADMIN');
    expect(dashboardRole(token('host'))).toBe('HOST');
    expect(dashboardRole(token('CUSTOMER'))).toBe('CUSTOMER');
    expect(dashboardRole('invalid')).toBeNull();
  });

  function access(adminOnly = false) {
    return TestBed.runInInjectionContext(() => accessGuard(
      { data: { adminOnly } } as unknown as ActivatedRouteSnapshot, {} as RouterStateSnapshot));
  }

  it('keeps admins and hosts in the same dashboard', () => {
    const data = TestBed.inject(AdminDataService);
    data.setToken(token('ADMIN'));
    expect(access()).toBe(true);
    expect(access(true)).toBe(true);
    data.setToken(token('HOST'));
    expect(access()).toBe(true);
    expect(TestBed.inject(Router).serializeUrl(access(true) as UrlTree)).toBe('/dashboard');
  });

  it('rejects customer and missing tokens', () => {
    const router = TestBed.inject(Router);
    expect(router.serializeUrl(access() as UrlTree)).toBe('/login');
    TestBed.inject(AdminDataService).setToken(token('CUSTOMER'));
    expect(router.serializeUrl(access() as UrlTree)).toBe('/login');
  });
});
