import { Injectable, computed, signal } from '@angular/core';
import {
  ActivityRecord,
  BookingRecord,
  DashboardStat,
  EventRecord,
  NotificationRecord,
  TrendPoint,
  UserRecord,
} from '../../models';
import { mockActivities, mockBookings, mockEvents, mockNotifications, mockUsers } from './mock-data';

type Snapshot = {
  events: EventRecord[];
  bookings: BookingRecord[];
  users: UserRecord[];
  notifications: NotificationRecord[];
  activities: ActivityRecord[];
};

@Injectable({ providedIn: 'root' })
export class AdminDataService {
  private readonly eventsSignal = signal<EventRecord[]>(mockEvents);
  private readonly bookingsSignal = signal<BookingRecord[]>(mockBookings);
  private readonly usersSignal = signal<UserRecord[]>(mockUsers);
  private readonly notificationsSignal = signal<NotificationRecord[]>(mockNotifications);
  private readonly activitiesSignal = signal<ActivityRecord[]>(mockActivities);
  private readonly undoStack = signal<Snapshot[]>([]);
  private readonly redoStack = signal<Snapshot[]>([]);

  readonly events = this.eventsSignal.asReadonly();
  readonly bookings = this.bookingsSignal.asReadonly();
  readonly users = this.usersSignal.asReadonly();
  readonly notifications = this.notificationsSignal.asReadonly();
  readonly activities = this.activitiesSignal.asReadonly();
  readonly canUndo = computed(() => this.undoStack().length > 0);
  readonly canRedo = computed(() => this.redoStack().length > 0);

  readonly dashboardStats = computed<DashboardStat[]>(() => {
    const bookings = this.bookings();
    const revenue = bookings
      .filter((booking) => booking.paymentStatus === 'completed')
      .reduce((sum, booking) => sum + booking.totalAmount, 0);

    return [
      { label: 'Total Users', value: this.formatInteger(this.users().length), trend: '+8.2%', direction: 'up' },
      { label: 'Total Events', value: this.formatInteger(this.events().length), trend: '+3 new', direction: 'up' },
      { label: 'Total Bookings', value: this.formatInteger(bookings.length), trend: '+12.4%', direction: 'up' },
      { label: 'Revenue', value: this.formatCurrency(revenue), trend: '-1.8%', direction: 'down' },
    ];
  });

  readonly bookingTrend7 = computed(() => this.createTrend(7, 48));
  readonly bookingTrend30 = computed(() => this.createTrend(30, 36));
  readonly eventPerformance = computed<TrendPoint[]>(() =>
    this.events()
      .slice()
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 6)
      .map((event) => ({ label: event.name, value: event.sold })),
  );
  readonly revenuePerformance = computed<TrendPoint[]>(() =>
    this.events()
      .slice()
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6)
      .map((event) => ({ label: event.name, value: event.revenue })),
  );
  readonly bookingStatusDistribution = computed<TrendPoint[]>(() => {
    const bookings = this.bookings();
    return [
      { label: 'Confirmed', value: bookings.filter((item) => item.status === 'confirmed').length },
      { label: 'Pending', value: bookings.filter((item) => item.status === 'pending').length },
      { label: 'Cancelled', value: bookings.filter((item) => item.status === 'cancelled').length },
    ];
  });
  readonly notificationStats = computed(() => {
    const notifications = this.notifications();
    return {
      sent: notifications.filter((item) => item.status === 'sent').length,
      pending: notifications.filter((item) => item.status === 'pending').length,
      failed: notifications.filter((item) => item.status === 'failed').length,
    };
  });

  addEvent(event: EventRecord): void {
    this.captureSnapshot();
    this.eventsSignal.update((events) => [event, ...events]);
    this.prependActivity('Event added', `${event.name} was created and saved to the catalog.`, 'event');
  }

  updateEvent(updated: EventRecord): void {
    this.captureSnapshot();
    this.eventsSignal.update((events) => events.map((event) => (event.id === updated.id ? updated : event)));
    this.prependActivity('Event updated', `${updated.name} details were updated by admin.`, 'event');
  }

  deleteEvent(eventId: string): void {
    const event = this.events().find((item) => item.id === eventId);
    if (!event) {
      return;
    }

    this.captureSnapshot();
    this.eventsSignal.update((events) => events.filter((item) => item.id !== eventId));
    this.prependActivity('Event removed', `${event.name} was removed from the catalog.`, 'event');
  }

  cancelBooking(bookingId: string): void {
    this.captureSnapshot();
    this.bookingsSignal.update((bookings) =>
      bookings.map((booking) =>
        booking.id === bookingId ? { ...booking, status: 'cancelled', paymentStatus: 'failed' } : booking,
      ),
    );
    this.prependActivity('Booking cancelled', `${bookingId} was cancelled and marked for customer follow-up.`, 'booking');
  }

  toggleUserStatus(userId: string): void {
    this.captureSnapshot();
    this.usersSignal.update((users) =>
      users.map((user) =>
        user.id === userId
          ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' }
          : user,
      ),
    );
    const user = this.usersSignal().find((item) => item.id === userId);
    if (user) {
      this.prependActivity('User access changed', `${user.name} access state was updated.`, 'user');
    }
  }

  retryNotification(notificationId: string): void {
    this.captureSnapshot();
    this.notificationsSignal.update((items) =>
      items.map((notification) =>
        notification.id === notificationId
          ? { ...notification, retryCount: notification.retryCount + 1, status: 'sent', sentAt: new Date().toISOString() }
          : notification,
      ),
    );
    this.prependActivity('Notification retried', `${notificationId} was retried successfully and delivered.`, 'notification');
  }

  resendNotification(notificationId: string): void {
    this.captureSnapshot();
    this.notificationsSignal.update((items) =>
      items.map((notification) =>
        notification.id === notificationId
          ? { ...notification, status: 'sent', sentAt: new Date().toISOString() }
          : notification,
      ),
    );
    this.prependActivity('Notification resent', `${notificationId} was resent from the admin console.`, 'notification');
  }

  undo(): void {
    const previous = this.undoStack().at(-1);
    if (!previous) {
      return;
    }

    this.redoStack.update((stack) => [...stack, this.snapshot()]);
    this.restore(previous);
    this.undoStack.update((stack) => stack.slice(0, -1));
  }

  redo(): void {
    const next = this.redoStack().at(-1);
    if (!next) {
      return;
    }

    this.undoStack.update((stack) => [...stack, this.snapshot()]);
    this.restore(next);
    this.redoStack.update((stack) => stack.slice(0, -1));
  }

  exportCsv(kind: 'events' | 'bookings' | 'users' | 'notifications'): string {
    const map = {
      events: this.events(),
      bookings: this.bookings(),
      users: this.users(),
      notifications: this.notifications(),
    };
    const rows = map[kind];
    const headers = Object.keys(rows[0] ?? {});
    const body = rows.map((row) =>
      headers.map((header) => JSON.stringify(String(row[header as keyof typeof row] ?? ''))).join(','),
    );

    return [headers.join(','), ...body].join('\n');
  }

  private createTrend(days: number, baseline: number): TrendPoint[] {
    return Array.from({ length: days }, (_, index) => ({
      label: days === 7 ? `D${index + 1}` : `${index + 1}`,
      value: baseline + ((index * 7) % 21) + (index % 3) * 5,
    }));
  }

  private captureSnapshot(): void {
    this.undoStack.update((stack) => [...stack, this.snapshot()]);
    this.redoStack.set([]);
  }

  private snapshot(): Snapshot {
    return {
      events: structuredClone(this.events()),
      bookings: structuredClone(this.bookings()),
      users: structuredClone(this.users()),
      notifications: structuredClone(this.notifications()),
      activities: structuredClone(this.activities()),
    };
  }

  private restore(snapshot: Snapshot): void {
    this.eventsSignal.set(snapshot.events);
    this.bookingsSignal.set(snapshot.bookings);
    this.usersSignal.set(snapshot.users);
    this.notificationsSignal.set(snapshot.notifications);
    this.activitiesSignal.set(snapshot.activities);
  }

  private prependActivity(title: string, detail: string, type: ActivityRecord['type']): void {
    this.activitiesSignal.update((activities) => [
      {
        id: `ACT-${Date.now()}`,
        title,
        detail,
        type,
        timestamp: new Date().toISOString(),
      },
      ...activities,
    ]);
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  }

  private formatInteger(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
  }
}
