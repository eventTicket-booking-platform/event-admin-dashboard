import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiConfigService } from '../../core/config/api-config.service';
import { AdminProfile } from './profile.models';
import { StandardResponse } from '../../shared/models/api-response.model';

@Injectable({ providedIn: 'root' })
export class ProfileApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  getProfile(): Observable<AdminProfile> {
    return this.http
      .get<
        StandardResponse<AdminProfile>
      >(`${this.apiConfig.config().authBaseUrl}/user-service/api/v1/users/get-user-details`)
      .pipe(map((response) => response.data));
  }

  updateProfile(request: { firstName: string; lastName: string }): Observable<void> {
    return this.http
      .put<
        StandardResponse<null>
      >(`${this.apiConfig.config().authBaseUrl}/user-service/api/v1/users/update-user-details`, request)
      .pipe(map(() => void 0));
  }

  requestPasswordResetCode(email: string): Observable<void> {
    const params = new HttpParams().set('email', email);
    return this.http
      .post<
        StandardResponse<null>
      >(`${this.apiConfig.config().authBaseUrl}/user-service/api/v1/users/visitors/forget-password-request-code`, null, { params })
      .pipe(map(() => void 0));
  }

  resetPassword(request: { email: string; password: string; code: string }): Observable<boolean> {
    return this.http
      .post<
        StandardResponse<boolean>
      >(`${this.apiConfig.config().authBaseUrl}/user-service/api/v1/users/visitors/reset-password`, request)
      .pipe(map((response) => Boolean(response.data)));
  }

  uploadAvatar(file: File): Observable<void> {
    const payload = new FormData();
    payload.append('avatar', file);

    return this.http
      .post<
        StandardResponse<null>
      >(`${this.apiConfig.config().authBaseUrl}/user-service/api/v1/avatars/user/manage-avatar`, payload)
      .pipe(map(() => void 0));
  }
}
