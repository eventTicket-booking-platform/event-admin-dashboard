import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiConfigService } from '../../core/config/api-config.service';
import { CategoryRecord } from './categories.models';
import { ApiMessageResponse } from '../../shared/models/api-response.model';

@Injectable({ providedIn: 'root' })
export class CategoriesApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  getCategories(): Observable<CategoryRecord[]> {
    return this.http
      .get<
        CategoryRecord[]
      >(`${this.apiConfig.config().eventBaseUrl}/event-service/api/v1/events/categories`)
      .pipe(map((categories) => categories ?? []));
  }

  createCategory(request: { name: string; description: string }): Observable<ApiMessageResponse> {
    return this.http.post<ApiMessageResponse>(
      `${this.apiConfig.config().eventBaseUrl}/event-service/api/v1/categories`,
      request,
    );
  }

  updateCategory(
    categoryId: number,
    request: { name: string; description: string },
  ): Observable<ApiMessageResponse> {
    return this.http.put<ApiMessageResponse>(
      `${this.apiConfig.config().eventBaseUrl}/event-service/api/v1/categories/${categoryId}`,
      request,
    );
  }

  deleteCategory(categoryId: number): Observable<ApiMessageResponse> {
    return this.http.delete<ApiMessageResponse>(
      `${this.apiConfig.config().eventBaseUrl}/event-service/api/v1/categories/${categoryId}`,
    );
  }
}
