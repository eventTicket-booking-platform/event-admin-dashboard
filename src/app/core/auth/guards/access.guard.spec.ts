import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { AuthService, dashboardRole } from '../auth.service';
import { accessGuard } from './access.guard';
import { routes } from '../../../app.routes';

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
    const auth = TestBed.inject(AuthService);
    auth.setToken(token('ADMIN'));
    expect(access()).toBe(true);
    expect(access(true)).toBe(true);
    auth.setToken(token('HOST'));
    expect(access()).toBe(true);
    expect(TestBed.inject(Router).serializeUrl(access(true) as UrlTree)).toBe('/dashboard');
  });

  it('rejects customer and missing tokens', () => {
    const router = TestBed.inject(Router);
    expect(router.serializeUrl(access() as UrlTree)).toBe('/login');
    TestBed.inject(AuthService).setToken(token('CUSTOMER'));
    expect(router.serializeUrl(access() as UrlTree)).toBe('/login');
  });

  it('allows ADMIN to load the host applications route with the existing parent and child guards', async () => {
    const shell = routes.find((route) => route.path === '');
    const route = shell?.children?.find((route) => route.path === 'host-applications');
    expect(shell?.canActivate).toContain(accessGuard);
    expect(shell?.canActivateChild).toContain(accessGuard);
    expect(route?.data?.['adminOnly']).toBe(true);
    TestBed.inject(AuthService).setToken(token('ADMIN'));
    expect(TestBed.runInInjectionContext(() => accessGuard(route as unknown as ActivatedRouteSnapshot, {} as RouterStateSnapshot))).toBe(true);
    const component = await (route!.loadComponent! as () => Promise<unknown>)();
    expect(component).toBeTruthy();
  });

  it('denies HOST and CUSTOMER direct access to the host applications route', () => {
    const route = routes.find((route) => route.path === '')?.children?.find((route) => route.path === 'host-applications');
    const auth = TestBed.inject(AuthService);
    const router = TestBed.inject(Router);
    for (const [role, destination] of [['HOST', '/dashboard'], ['CUSTOMER', '/login']]) {
      auth.setToken(token(role));
      const result = TestBed.runInInjectionContext(() => accessGuard(route as unknown as ActivatedRouteSnapshot, {} as RouterStateSnapshot));
      expect(router.serializeUrl(result as UrlTree)).toBe(destination);
    }
  });
});
