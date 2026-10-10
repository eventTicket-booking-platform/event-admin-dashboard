import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiConfigService } from '../config/api-config.service';
import { StandardResponse } from '../../shared/models/api-response.model';
import { LoginRequest, LoginResponse } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  readonly hasToken = computed(() => Boolean(this.apiConfig.config().authToken.trim()));
  readonly role = computed(() => dashboardRole(this.apiConfig.config().authToken));
  readonly isAdmin = computed(() => this.role() === 'ADMIN');
  readonly canManage = computed(() => this.isAdmin() || this.role() === 'HOST');

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<
        StandardResponse<LoginResponse>
      >(`${this.apiConfig.config().authBaseUrl}/user-service/api/v1/users/visitors/login`, request)
      .pipe(map((response) => response.data));
  }

  refreshAccessToken(): Observable<LoginResponse> {
    return this.http
      .post<
        StandardResponse<LoginResponse>
      >(`${this.apiConfig.config().authBaseUrl}/user-service/api/v1/users/visitors/refresh-token`, { refreshToken: this.getRefreshToken() })
      .pipe(map((response) => response.data));
  }

  setToken(token: string): void {
    this.apiConfig.updateConfig({ authToken: token });
  }

  setAuthSession(response: LoginResponse): void {
    this.apiConfig.updateConfig({
      authToken: response.access_token ?? '',
      refreshToken: response.refresh_token ?? '',
    });
  }

  getToken(): string {
    return this.apiConfig.config().authToken.trim();
  }

  getRefreshToken(): string {
    return this.apiConfig.config().refreshToken.trim();
  }

  logout(): void {
    this.apiConfig.updateConfig({ authToken: '', refreshToken: '' });
  }
}

// Used only for dashboard presentation. APIs validate the signed JWT themselves.
export function dashboardRole(token: string): 'ADMIN' | 'HOST' | 'CUSTOMER' | null {
  try {
    const payload = JSON.parse(
      atob((token.split('.')[1] ?? '').replace(/-/g, '+').replace(/_/g, '/')),
    );
    const roles: unknown = payload?.realm_access?.roles;
    if (!Array.isArray(roles)) return null;
    const normalized = roles
      .filter((role): role is string => typeof role === 'string')
      .map((role) => role.toUpperCase());
    if (normalized.includes('ADMIN')) return 'ADMIN';
    if (normalized.includes('HOST')) return 'HOST';
    return normalized.includes('CUSTOMER') || normalized.includes('USER') ? 'CUSTOMER' : null;
  } catch {
    return null;
  }
}
