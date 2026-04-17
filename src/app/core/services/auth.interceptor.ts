import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, defer, finalize, map, Observable, shareReplay, switchMap, throwError } from 'rxjs';
import { LoginResponse } from '../../models';
import { AdminDataService } from './admin-data.service';

let refreshInFlight$: Observable<string> | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const data = inject(AdminDataService);
  const router = inject(Router);

  if (isPublicAuthRequest(req.url)) {
    return next(req);
  }

  const accessToken = data.getToken();
  if (accessToken && isTokenExpired(accessToken)) {
    return extendSessionAndRetry(req, next, data, router);
  }

  const authReq = accessToken
    ? req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || !shouldHandleAsSessionExpiry(error, accessToken)) {
        return throwError(() => error);
      }

      return extendSessionAndRetry(req, next, data, router);
    }),
  );
};

function extendSessionAndRetry(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  data: AdminDataService,
  router: Router,
): Observable<HttpEvent<unknown>> {
  const refreshToken = data.getRefreshToken();
  if (!refreshToken) {
    endSession(data, router);
    return throwError(() => authError('Session expired. Please sign in again.'));
  }

  if (!refreshInFlight$) {
    refreshInFlight$ = defer(() => {
      const allowExtend = askUserToExtendSession();
      if (!allowExtend) {
        endSession(data, router);
        throw authError('Session ended. Please sign in again.');
      }

      return data.refreshAccessToken().pipe(
        map((response: LoginResponse) => {
          const token = response.access_token?.trim();
          if (!token) {
            throw authError('Session refresh failed. Please sign in again.');
          }

          data.setAuthSession(response);
          return token;
        }),
      );
    }).pipe(
      catchError(() => {
        endSession(data, router);
        return throwError(() => authError('Session refresh failed. Please sign in again.'));
      }),
      finalize(() => {
        refreshInFlight$ = null;
      }),
      shareReplay(1),
    );
  }

  return refreshInFlight$.pipe(
    switchMap((newToken) =>
      next(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } })),
    ),
  );
}

function shouldHandleAsSessionExpiry(error: HttpErrorResponse, accessToken: string): boolean {
  if (error.status === 401) {
    return true;
  }

  // Some gateway/network flows surface expired-session calls as status 0.
  return error.status === 0 && Boolean(accessToken) && isTokenExpired(accessToken);
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1] ?? ''));
    const exp = Number(payload?.exp);
    if (!Number.isFinite(exp)) {
      return false;
    }

    return Date.now() >= exp * 1000;
  } catch {
    return false;
  }
}

function askUserToExtendSession(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.confirm('Your session has expired. Do you want to extend the session?');
}

function endSession(data: AdminDataService, router: Router): void {
  data.logout();
  void router.navigateByUrl('/login');
}

function authError(message: string): HttpErrorResponse {
  return new HttpErrorResponse({
    status: 401,
    statusText: 'Unauthorized',
    error: { message },
  });
}

function isPublicAuthRequest(url: string): boolean {
  return (
    url.includes('/user-service/api/v1/users/visitors/login') ||
    url.includes('/user-service/api/v1/users/visitors/refresh-token')
  );
}
