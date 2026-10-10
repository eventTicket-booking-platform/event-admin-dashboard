import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { ApiConfig } from './api-config.model';

const STORAGE_KEY = 'eventhub-admin-config';

@Injectable({ providedIn: 'root' })
export class ApiConfigService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly configSignal = signal<ApiConfig>(this.loadConfig());

  readonly config = this.configSignal.asReadonly();

  updateConfig(patch: Partial<ApiConfig>): void {
    const next = { ...this.configSignal(), ...patch };
    this.configSignal.set(next);
    this.document.defaultView?.localStorage?.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  private loadConfig(): ApiConfig {
    const defaultConfig = this.defaultConfig();
    const raw = this.document.defaultView?.localStorage?.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultConfig;
    }

    try {
      return { ...defaultConfig, ...(JSON.parse(raw) as Partial<ApiConfig>) };
    } catch {
      return defaultConfig;
    }
  }

  private defaultConfig(): ApiConfig {
    const baseUrl = this.defaultBaseUrl();

    return {
      authBaseUrl: baseUrl,
      eventBaseUrl: baseUrl,
      bookingBaseUrl: baseUrl,
      notificationBaseUrl: baseUrl,
      authToken: '',
      refreshToken: '',
    };
  }

  private defaultBaseUrl(): string {
    if (isPlatformBrowser(this.platformId)) {
      return '/api';
    }

    return process.env['API_BASE_URL'] || '/api';
  }
}
