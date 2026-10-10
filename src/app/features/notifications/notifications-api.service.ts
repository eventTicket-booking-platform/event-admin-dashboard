import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiConfigService } from '../../core/config/api-config.service';
import { NotificationLog, NotificationLogPage, NotificationStats } from './notifications.models';
import { StandardResponse } from '../../shared/models/api-response.model';

@Injectable({ providedIn: 'root' })
export class NotificationsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  getNotificationStats(): Observable<NotificationStats> {
    return this.http
      .get<
        StandardResponse<NotificationStats>
      >(`${this.apiConfig.config().notificationBaseUrl}/notification-service/api/v1/admin/notifications/stats`)
      .pipe(map((response) => response.data));
  }

  getNotificationLogs(filters: {
    type?: string;
    status?: string;
    email?: string;
    page?: number;
    limit?: number;
  }): Observable<NotificationLogPage> {
    let params = new HttpParams()
      .set('page', String(filters.page ?? 1))
      .set('limit', String(filters.limit ?? 10));

    if (filters.type?.trim()) {
      params = params.set('type', filters.type.trim());
    }
    if (filters.status?.trim()) {
      params = params.set('status', filters.status.trim());
    }
    if (filters.email?.trim()) {
      params = params.set('email', filters.email.trim());
    }

    return this.http
      .get<StandardResponse<NotificationLogPage>>(
        `${this.apiConfig.config().notificationBaseUrl}/notification-service/api/v1/admin/notifications/logs`,
        {
          params,
        },
      )
      .pipe(map((response) => response.data));
  }

  getFailedNotifications(): Observable<NotificationLog[]> {
    return this.http
      .get<
        StandardResponse<NotificationLog[]>
      >(`${this.apiConfig.config().notificationBaseUrl}/notification-service/api/v1/admin/notifications/failed`)
      .pipe(map((response) => response.data ?? []));
  }

  retryNotification(notificationId: string): Observable<NotificationLog> {
    return this.http
      .post<
        StandardResponse<NotificationLog>
      >(`${this.apiConfig.config().notificationBaseUrl}/notification-service/api/v1/admin/notifications/failed/${notificationId}/retry`, {})
      .pipe(map((response) => response.data));
  }

  sendHostPassword(request: {
    email: string;
    password: string;
    firstName: string;
  }): Observable<NotificationLog> {
    return this.http
      .post<
        StandardResponse<NotificationLog>
      >(`${this.apiConfig.config().notificationBaseUrl}/notification-service/api/v1/admin/notifications/send-host-password`, request)
      .pipe(map((response) => response.data));
  }
}
