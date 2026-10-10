import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { ApiConfigService } from '../../core/config/api-config.service';
import { StandardResponse } from '../../shared/models/api-response.model';
import { HostApplication, HostApplicationPage, HostApplicationStatus } from './host-applications.models';

@Injectable({ providedIn: 'root' })
export class HostApplicationsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  private get baseUrl(): string {
    return `${this.apiConfig.config().authBaseUrl}/user-service/api/v1/host-applications/admin`;
  }

  list(filters: { status?: HostApplicationStatus; page?: number; size?: number }) {
    let params = new HttpParams().set('page', filters.page ?? 0).set('size', filters.size ?? 10);
    if (filters.status) params = params.set('status', filters.status);
    return this.http.get<StandardResponse<HostApplicationPage>>(this.baseUrl, { params })
      .pipe(map((response) => response.data));
  }

  approve(id: string) {
    return this.http.patch<StandardResponse<HostApplication>>(`${this.baseUrl}/${encodeURIComponent(id)}/approve`, {})
      .pipe(map((response) => response.data));
  }

  reject(id: string, reason: string) {
    return this.http.patch<StandardResponse<HostApplication>>(`${this.baseUrl}/${encodeURIComponent(id)}/reject`, { reason })
      .pipe(map((response) => response.data));
  }
}
