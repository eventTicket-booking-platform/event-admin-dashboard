import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AdminDataService } from '../core/services/admin-data.service';
import { SidebarComponent } from './sidebar.component';

describe('role-aware shared sidebar', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [SidebarComponent], providers: [provideHttpClient(), provideRouter([])] });
  });

  it('shows host screens and reserves platform management navigation for admins', () => {
    const data = TestBed.inject(AdminDataService);
    const fixture = TestBed.createComponent(SidebarComponent);
    data.setToken(`h.${btoa(JSON.stringify({ realm_access: { roles: ['HOST'] } }))}.s`);
    fixture.detectChanges();
    let text = fixture.nativeElement.textContent;
    expect(text).toContain('Events');
    expect(text).toContain('Bookings');
    expect(text).not.toContain('Users');
    expect(text).not.toContain('Categories');
    expect(text).not.toContain('Notifications');
    data.setToken(`h.${btoa(JSON.stringify({ realm_access: { roles: ['ADMIN'] } }))}.s`);
    fixture.detectChanges();
    text = fixture.nativeElement.textContent;
    expect(text).toContain('Users');
    expect(text).toContain('Categories');
    expect(text).toContain('Notifications');
  });
});
