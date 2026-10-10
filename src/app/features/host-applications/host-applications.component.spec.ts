import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { AuthService } from '../../core/auth/auth.service';
import { authInterceptor } from '../../core/auth/auth.interceptor';
import { SnackbarService } from '../../core/services/snackbar.service';
import { HostApplicationsComponent } from './host-applications.component';
import { HostApplication, HostApplicationStatus } from './host-applications.models';

const BASE = '/api/user-service/api/v1/host-applications/admin';
const applicant = (status: HostApplicationStatus = 'PENDING'): HostApplication => ({
  applicationId: 'application-id', userId: 'user-id', firstName: 'Alex', lastName: 'Applicant',
  email: 'alex@example.test', contact: null, organizationName: 'Community Events', reason: 'Local events',
  status, appliedAt: '2026-10-01T10:00:00Z', reviewedAt: status === 'PENDING' ? null : '2026-10-02T10:00:00Z',
  reviewedBy: status === 'PENDING' ? null : 'admin-id', rejectionReason: status === 'REJECTED' ? 'Need more information' : null,
});

describe('host application review', () => {
  let fixture: ComponentFixture<HostApplicationsComponent>;
  let http: HttpTestingController;
  let accessToken: string;
  const snackbar = { success: vi.fn(), warning: vi.fn(), error: vi.fn() };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      imports: [HostApplicationsComponent],
      providers: [provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting(), provideRouter([]),
        { provide: SnackbarService, useValue: snackbar }],
    });
    accessToken = `h.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600, realm_access: { roles: ['ADMIN'] } }))}.s`;
    TestBed.inject(AuthService).setToken(accessToken);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    fixture?.destroy();
    localStorage.clear();
  });

  function flushList(rows: HostApplication[], count = rows.length) {
    const request = http.expectOne((request) => request.url === BASE && request.method === 'GET');
    request.flush({ code: 200, data: { dataList: rows, dataCount: count } });
    fixture.detectChanges();
    return request;
  }

  function start(rows: HostApplication[] = [applicant()], count = rows.length) {
    fixture = TestBed.createComponent(HostApplicationsComponent);
    const request = flushList(rows, count);
    expect(request.request.params.get('status')).toBe('PENDING');
    expect(request.request.params.get('page')).toBe('0');
    expect(request.request.params.get('size')).toBe('10');
    expect(request.request.headers.get('Authorization')).toBe(`Bearer ${accessToken}`);
  }

  function click(label: string) {
    const button = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find((button) => button.textContent?.trim() === label);
    expect(button).toBeDefined();
    button!.click();
    fixture.detectChanges();
  }

  function confirm() {
    const form = fixture.nativeElement.querySelector('.review-form') as HTMLFormElement;
    expect(form).toBeTruthy();
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
  }

  it('renders pending applicant details, reason and dates with review actions', () => {
    start();
    const row: HTMLElement = fixture.nativeElement.querySelector('.application-row');
    for (const text of ['Alex Applicant', 'alex@example.test', 'Community Events', 'Local events', 'PENDING', '2026']) {
      expect(row.textContent).toContain(text);
    }
    expect(row.querySelectorAll('button').length).toBe(2);
    expect(fixture.componentInstance.rangeStart()).toBe(1);
  });

  it('requires confirmation and sends approval through the exact endpoint with the existing bearer interceptor', () => {
    start();
    click('Approve');
    http.expectNone(`${BASE}/application-id/approve`);
    expect(fixture.nativeElement.textContent).toContain('Confirm approval');
    confirm();
    const request = http.expectOne(`${BASE}/application-id/approve`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({});
    expect(request.request.headers.get('Authorization')).toBe(`Bearer ${accessToken}`);
    expect(fixture.componentInstance.applications()[0].status).toBe('PENDING');
    request.flush({ data: applicant('APPROVED') });
    flushList([]);
    expect(fixture.componentInstance.lastReviewed()?.status).toBe('APPROVED');
    expect(snackbar.success).toHaveBeenCalledWith('Host application approved.');
    expect(fixture.nativeElement.querySelector('.application-row')).toBeNull();
  });

  it('asks for a rejection reason and sends only the trimmed reason to the reject endpoint', () => {
    start();
    click('Reject');
    const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    textarea.value = '  Need more information  ';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    confirm();
    const request = http.expectOne(`${BASE}/application-id/reject`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ reason: 'Need more information' });
    request.flush({ data: applicant('REJECTED') });
    flushList([]);
    expect(fixture.nativeElement.textContent).toContain('REJECTED');
    expect(fixture.nativeElement.textContent).toContain('Rejection reason: Need more information');
    expect(snackbar.success).toHaveBeenCalledWith('Host application rejected.');
  });

  for (const status of ['APPROVED', 'REJECTED'] as const) {
    it(`${status} rows show review information without approval or rejection actions`, () => {
      start([]);
      fixture.componentInstance.changeStatus(status);
      const request = flushList([applicant(status)]);
      expect(request.request.params.get('status')).toBe(status);
      const row: HTMLElement = fixture.nativeElement.querySelector('.application-row');
      expect(row.querySelectorAll('button').length).toBe(0);
      expect(row.textContent).toContain(status);
      if (status === 'REJECTED') expect(row.textContent).toContain('Need more information');
      fixture.componentInstance.openReview(applicant(status), 'approve');
      expect(fixture.componentInstance.review()).toBeNull();
    });
  }

  it('prevents duplicate clicks and competing actions until the backend responds', () => {
    start();
    click('Approve');
    confirm();
    fixture.componentInstance.confirmReview();
    fixture.componentInstance.openReview(applicant(), 'reject');
    fixture.componentInstance.load();
    expect(fixture.componentInstance.review()?.action).toBe('approve');
    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('button');
    expect(Array.from(buttons).every((button) => button.disabled)).toBe(true);
    const request = http.expectOne(`${BASE}/application-id/approve`);
    expect(fixture.componentInstance.applications()[0].status).toBe('PENDING');
    request.flush({ data: applicant('APPROVED') });
    flushList([]);
  });

  it('cancels a confirmation without calling a review API', () => {
    start();
    click('Approve');
    click('Cancel');
    expect(fixture.nativeElement.querySelector('.review-form')).toBeNull();
    http.expectNone((request) => request.method === 'PATCH');
  });

  it('rejects blank, whitespace-only and oversized rejection reasons before sending', () => {
    start();
    click('Reject');
    for (const reason of ['', '  ', 'x'.repeat(2001)]) {
      fixture.componentInstance.rejectionReason.setValue(reason);
      fixture.componentInstance.confirmReview();
    }
    http.expectNone((request) => request.method === 'PATCH');
    expect(fixture.componentInstance.reviewing()).toBe(false);
  });

  it('keeps pending status and entered reason after backend failure, with safe feedback and retry enabled', () => {
    start();
    click('Reject');
    fixture.componentInstance.rejectionReason.setValue('Reason');
    confirm();
    http.expectOne(`${BASE}/application-id/reject`).flush({ message: 'private stack trace' }, { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    expect(fixture.componentInstance.applications()[0].status).toBe('PENDING');
    expect(fixture.componentInstance.rejectionReason.value).toBe('Reason');
    expect(fixture.componentInstance.reviewing()).toBe(false);
    expect(snackbar.error).toHaveBeenCalledWith('Unable to review the host application. Please try again.');
    expect(snackbar.success).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).not.toContain('private stack trace');
  });

  it('refreshes stale application data on a 409 without displaying approval success', () => {
    start([applicant()], 11);
    fixture.componentInstance.nextPage();
    flushList([applicant()], 11);
    click('Approve');
    confirm();
    http.expectOne(`${BASE}/application-id/approve`).flush({}, { status: 409, statusText: 'Conflict' });
    const refresh = flushList([]);
    expect(refresh.request.params.get('page')).toBe('0');
    expect(snackbar.warning).toHaveBeenCalledWith('This application is no longer pending. Refreshing the list.');
    expect(snackbar.success).not.toHaveBeenCalled();
    expect(fixture.componentInstance.lastReviewed()).toBeNull();
  });

  it('handles list failures and allows retry instead of showing a misleading empty result', () => {
    fixture = TestBed.createComponent(HostApplicationsComponent);
    http.expectOne((request) => request.url === BASE).flush({}, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Unable to load');
    click('Refresh');
    flushList([applicant()]);
    expect(fixture.nativeElement.querySelector('.application-row')).toBeTruthy();
  });

  it('uses server pagination and resets page to zero when changing status', () => {
    start([applicant()], 21);
    fixture.componentInstance.nextPage();
    let request = flushList([applicant()], 21);
    expect(request.request.params.get('page')).toBe('1');
    fixture.componentInstance.changeStatus('REJECTED');
    request = flushList([applicant('REJECTED')]);
    expect(request.request.params.get('page')).toBe('0');
    expect(request.request.params.get('status')).toBe('REJECTED');
    expect(fixture.componentInstance.hasNextPage()).toBe(false);
  });
});
