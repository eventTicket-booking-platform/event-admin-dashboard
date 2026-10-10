import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApiConfigService } from '../config/api-config.service';
import { AuthService } from './auth.service';

describe('authentication and persisted configuration', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    localStorage.clear();
  });

  it('loads the existing storage format and clears only session fields on logout', () => {
    const token = `h.${btoa(JSON.stringify({ realm_access: { roles: ['HOST'] } }))}.s`;
    localStorage.setItem('eventhub-admin-config', JSON.stringify({
      eventBaseUrl: '/saved-event-api', authToken: token, refreshToken: 'saved-refresh',
    }));
    const auth = TestBed.inject(AuthService);
    const config = TestBed.inject(ApiConfigService);
    expect(auth.getToken()).toBe(token);
    expect(auth.getRefreshToken()).toBe('saved-refresh');
    expect(auth.canManage()).toBe(true);
    expect(auth.isAdmin()).toBe(false);
    expect(config.config().eventBaseUrl).toBe('/saved-event-api');
    expect(config.config().authBaseUrl).toBe('/api');
    auth.logout();
    expect(auth.hasToken()).toBe(false);
    expect(auth.getRefreshToken()).toBe('');
    expect(JSON.parse(localStorage.getItem('eventhub-admin-config')!)).toEqual({
      ...config.config(), eventBaseUrl: '/saved-event-api', authToken: '', refreshToken: '',
    });
  });

  it('preserves login and refresh endpoint bodies and wrapped response mapping', () => {
    const auth = TestBed.inject(AuthService);
    const http = TestBed.inject(HttpTestingController);
    const credentials = { email: 'host@example.test', password: 'test-input' };
    const session = { access_token: 'access', refresh_token: 'refresh' };
    auth.login(credentials).subscribe(response => auth.setAuthSession(response));
    const login = http.expectOne('/api/user-service/api/v1/users/visitors/login');
    expect(login.request.method).toBe('POST');
    expect(login.request.body).toEqual(credentials);
    login.flush({ code: 200, message: 'OK', data: session });
    expect(auth.getToken()).toBe('access');
    auth.refreshAccessToken().subscribe(response => auth.setAuthSession(response));
    const refresh = http.expectOne('/api/user-service/api/v1/users/visitors/refresh-token');
    expect(refresh.request.method).toBe('POST');
    expect(refresh.request.body).toEqual({ refreshToken: 'refresh' });
    refresh.flush({ code: 200, message: 'OK', data: { access_token: 'renewed', refresh_token: 'rotated' } });
    expect(auth.getToken()).toBe('renewed');
    expect(auth.getRefreshToken()).toBe('rotated');
  });
});
