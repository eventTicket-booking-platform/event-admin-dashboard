import {
  ActivityRecord,
  BookingRecord,
  EventRecord,
  NotificationRecord,
  UserRecord,
} from '../../models';

const categories = ['Concert', 'Conference', 'Sports', 'Festival', 'Workshop', 'Theatre'];
const cities = ['New York', 'Chicago', 'Austin', 'Seattle', 'Los Angeles', 'Denver'];
const venues = ['Grand Hall', 'Skyline Arena', 'Harbor Center', 'Summit Pavilion', 'Metro Dome'];
const eventNames = [
  'Pulse Live',
  'Tech Forward',
  'City Marathon Expo',
  'Lunar Beats',
  'Founders Forum',
  'Summer Food Fest',
  'Design Summit',
  'Indie Spotlight',
  'Arena Clash',
  'Future of Commerce',
  'Wellness Retreat',
  'Cinema Under Stars',
  'Startup Week',
  'Digital Creators Day',
  'Jazz Collective',
  'Innovation Exchange',
  'Night Market Sessions',
  'Women in Product',
];

const userNames = [
  'Sophia Turner',
  'Ethan Brooks',
  'Ava Mitchell',
  'Noah Collins',
  'Mia Sanders',
  'Liam Foster',
  'Isabella Reed',
  'Mason Hayes',
  'Charlotte Perry',
  'James Kelly',
  'Amelia Ward',
  'Benjamin Price',
  'Harper Long',
  'Lucas Diaz',
  'Evelyn Stone',
  'Henry Cooper',
  'Ella Ross',
  'Alexander Gray',
];

const bookingStatuses: BookingRecord['status'][] = ['confirmed', 'pending', 'cancelled'];
const paymentStatuses: BookingRecord['paymentStatus'][] = ['completed', 'pending', 'failed'];
const eventStatuses: EventRecord['status'][] = ['published', 'draft', 'cancelled'];
const roles: UserRecord['role'][] = ['admin', 'manager', 'user'];
const userStatuses: UserRecord['status'][] = ['active', 'inactive'];
const notificationTypes: NotificationRecord['type'][] = ['email', 'sms', 'push'];
const notificationStatuses: NotificationRecord['status'][] = ['sent', 'pending', 'failed'];

export const mockEvents: EventRecord[] = eventNames.map((name, index) => {
  const capacity = 220 + index * 35;
  const sold = Math.max(45, capacity - (index % 4) * 30 - 18);
  const ticketPrice = 35 + index * 6;
  const date = new Date(2026, 3 + (index % 6), 6 + index).toISOString();

  return {
    id: `EVT-${1000 + index}`,
    name,
    category: categories[index % categories.length],
    date,
    time: `${String(9 + (index % 8)).padStart(2, '0')}:30`,
    location: `${cities[index % cities.length]} · ${venues[index % venues.length]}`,
    capacity,
    sold,
    status: eventStatuses[index % eventStatuses.length],
    description: `${name} delivers a premium attendee experience with tiered ticketing, curated sessions, and live engagement touchpoints.`,
    ticketPrice,
    revenue: sold * ticketPrice,
    thumbnail: `https://picsum.photos/seed/event-${index}/320/180`,
  };
});

export const mockUsers: UserRecord[] = userNames.map((name, index) => ({
  id: `USR-${2000 + index}`,
  name,
  email: name.toLowerCase().replaceAll(' ', '.') + '@eventhub.com',
  role: roles[index % roles.length],
  joinDate: new Date(2025, index % 12, 4 + index).toISOString(),
  lastLogin: new Date(2026, 3, 14 - (index % 9), 8 + (index % 10), 15).toISOString(),
  status: userStatuses[index % userStatuses.length],
  bookingCount: 2 + index * 3,
  totalSpent: 140 + index * 82,
}));

export const mockBookings: BookingRecord[] = Array.from({ length: 18 }, (_, index) => {
  const event = mockEvents[index % mockEvents.length];
  const user = mockUsers[index % mockUsers.length];
  const ticketsCount = 1 + (index % 5);

  return {
    id: `BKG-${5000 + index}`,
    customerId: user.id,
    customerName: user.name,
    customerEmail: user.email,
    eventId: event.id,
    eventName: event.name,
    ticketsCount,
    totalAmount: ticketsCount * event.ticketPrice,
    bookingDate: new Date(2026, 2 + (index % 2), 3 + index, 10 + (index % 7), 10).toISOString(),
    status: bookingStatuses[index % bookingStatuses.length],
    paymentStatus: paymentStatuses[index % paymentStatuses.length],
  };
});

export const mockNotifications: NotificationRecord[] = Array.from({ length: 18 }, (_, index) => {
  const user = mockUsers[index % mockUsers.length];

  return {
    id: `NTF-${8000 + index}`,
    type: notificationTypes[index % notificationTypes.length],
    recipientId: user.id,
    recipient: user.email,
    message: [
      'Your tickets are confirmed and ready to download.',
      'A schedule update was published for your event.',
      'Payment verification is pending additional checks.',
      'Reminder: your selected event starts in 24 hours.',
      'Delivery failed. Please verify recipient details.',
    ][index % 5],
    sentAt: new Date(2026, 3, 14 - (index % 10), 9 + (index % 8), 30).toISOString(),
    status: notificationStatuses[index % notificationStatuses.length],
    retryCount: index % 4,
  };
});

export const mockActivities: ActivityRecord[] = [
  {
    id: 'ACT-1',
    title: 'Revenue milestone reached',
    detail: 'Monthly gross ticket revenue exceeded $180K.',
    type: 'system',
    timestamp: new Date(2026, 3, 14, 9, 10).toISOString(),
  },
  {
    id: 'ACT-2',
    title: 'Booking cancelled',
    detail: 'Booking BKG-5002 was cancelled with automatic refund queued.',
    type: 'booking',
    timestamp: new Date(2026, 3, 14, 8, 42).toISOString(),
  },
  {
    id: 'ACT-3',
    title: 'Event published',
    detail: 'Innovation Exchange was published and opened to public sales.',
    type: 'event',
    timestamp: new Date(2026, 3, 14, 8, 5).toISOString(),
  },
  {
    id: 'ACT-4',
    title: 'Manager invited',
    detail: 'A manager account was provisioned for west-region operations.',
    type: 'user',
    timestamp: new Date(2026, 3, 13, 18, 25).toISOString(),
  },
  {
    id: 'ACT-5',
    title: 'Notification retry succeeded',
    detail: 'Failed email delivery was retried successfully for Sophia Turner.',
    type: 'notification',
    timestamp: new Date(2026, 3, 13, 16, 48).toISOString(),
  },
  {
    id: 'ACT-6',
    title: 'Capacity updated',
    detail: 'Pulse Live capacity increased by 80 seats after venue approval.',
    type: 'event',
    timestamp: new Date(2026, 3, 13, 14, 12).toISOString(),
  },
];
