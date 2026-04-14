import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly storageKey = 'eventhub-theme';
  private readonly themeSignal = signal<ThemeMode>('light');

  readonly theme = this.themeSignal.asReadonly();
  readonly isDark = computed(() => this.themeSignal() === 'dark');

  initTheme(): void {
    const stored = this.document.defaultView?.localStorage?.getItem(this.storageKey) as ThemeMode | null;
    this.setTheme(stored ?? 'light');
  }

  toggleTheme(): void {
    this.setTheme(this.isDark() ? 'light' : 'dark');
  }

  setTheme(theme: ThemeMode): void {
    this.themeSignal.set(theme);
    this.document.documentElement?.setAttribute('data-theme', theme);
    this.document.defaultView?.localStorage?.setItem(this.storageKey, theme);
  }
}
