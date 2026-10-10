import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiConfigService } from '../../core/config/api-config.service';
import { PaginatedUsers } from './users.models';
import { StandardResponse } from '../../shared/models/api-response.model';

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  getUsers(filters: { page?: number; size?: number }): Observable<PaginatedUsers> {
    const params = new HttpParams()
      .set('page', String(filters.page ?? 0))
      .set('size', String(filters.size ?? 20));

    return this.http
      .get<StandardResponse<PaginatedUsers>>(
        `${this.apiConfig.config().authBaseUrl}/user-service/api/v1/users/all`,
        {
          params,
        },
      )
      .pipe(map((response) => response.data));
  }
}
