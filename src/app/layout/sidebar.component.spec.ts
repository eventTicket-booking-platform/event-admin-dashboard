import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { SidebarComponent } from './sidebar.component';

describe('role-aware shared sidebar', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [SidebarComponent], providers: [provideHttpClient(), provideRouter([])] });
  });

  it('shows host screens and reserves platform management navigation for admins', () => {
    const auth = TestBed.inject(AuthService);
    const fixture = TestBed.createComponent(SidebarComponent);
    auth.setToken(`h.${btoa(JSON.stringify({ realm_access: { roles: ['HOST'] } }))}.s`);
    fixture.detectChanges();
    let text = fixture.nativeElement.textContent;
    expect(text).toContain('Events');
    expect(text).toContain('Bookings');
    expect(text).not.toContain('Users');
    expect(text).not.toContain('Host Applications');
    expect(text).not.toContain('Categories');
    expect(text).not.toContain('Notifications');
    auth.setToken(`h.${btoa(JSON.stringify({ realm_access: { roles: ['ADMIN'] } }))}.s`);
    fixture.detectChanges();
    text = fixture.nativeElement.textContent;
    expect(text).toContain('Users');
    expect(text).toContain('Host Applications');
    expect(text).toContain('Categories');
    expect(text).toContain('Notifications');
  });
});
