import { inBookingZone } from '@/lib/booking-hours';
import type { WorkspaceType } from '@/lib/workspace-schema';

export interface HistoryBooking {
  id: string;
  startTime: string;
  endTime: string;
  updatedAt: string;
  totalPrice: number;
  status: 'CONFIRMED' | 'CANCELLED';
  workspace: { name: string; imageUrl: string; type: WorkspaceType };
}

export type BookingTab = 'upcoming' | 'finished' | 'cancelled';

export function bookingState(booking: HistoryBooking, now: number) {
  if (booking.status === 'CANCELLED') return 'cancelled';
  return bookingTimeState(booking, now);
}

export function bookingTimeState(booking: Pick<HistoryBooking, 'startTime' | 'endTime'>, now: number) {
  if (Date.parse(booking.endTime) <= now) return 'finished';
  return Date.parse(booking.startTime) <= now ? 'ongoing' : 'upcoming';
}

export function sortBookingHistory(bookings: HistoryBooking[], now: number) {
  const tabs: Record<BookingTab, HistoryBooking[]> = { upcoming: [], finished: [], cancelled: [] };
  for (const booking of bookings) {
    const state = bookingState(booking, now);
    tabs[state === 'ongoing' ? 'upcoming' : state].push(booking);
  }
  tabs.upcoming.sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime));
  tabs.finished.sort((a, b) => Date.parse(b.startTime) - Date.parse(a.startTime));
  tabs.cancelled.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  return tabs;
}

export function matchesBookingFilters(
  booking: HistoryBooking,
  { search, type, from, to }: { search: string; type: string; from: string; to: string },
) {
  const normalized = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  if (!normalized(booking.workspace.name).includes(normalized(search))) return false;
  if (type && booking.workspace.type !== type) return false;
  if (!from && !to) return true;
  const day = inBookingZone(booking.startTime).format('YYYY-MM-DD');
  return (!from || day >= from) && (!to || day <= to);
}
