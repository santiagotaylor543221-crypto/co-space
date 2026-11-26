import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export const BOOKING_TIME_ZONE = 'America/Bogota';
export const BOOKING_OPEN_HOUR = 7;
export const BOOKING_CLOSE_HOUR = 21;
export const BOOKING_MAX_HOURS = 4;
export const BOOKING_MAX_DAYS = 30;

export const formatBookingHour = (hour: number) => `${String(hour).padStart(2, '0')}:00`;
export const inBookingZone = (value: Date | number | string) => dayjs(value).tz(BOOKING_TIME_ZONE);

export function bookingDays(now: Date | number) {
  const today = inBookingZone(now);
  return Array.from({ length: BOOKING_MAX_DAYS + 1 }, (_, offset) =>
    today.add(offset, 'day').format('YYYY-MM-DD'),
  );
}

export function bookingHour(day: string, hour: number) {
  return dayjs.tz(`${day}T${formatBookingHour(hour)}:00`, BOOKING_TIME_ZONE).toDate();
}

export type BookingHours = Record<number, number[]>;

export function availableBookingHours(
  day: string,
  now: Date,
  conflicts: { startTime: Date; endTime: Date }[],
): BookingHours {
  const options: BookingHours = {};
  const boundaries = Array.from({ length: BOOKING_CLOSE_HOUR - BOOKING_OPEN_HOUR + 1 }, (_, index) =>
    bookingHour(day, BOOKING_OPEN_HOUR + index),
  );

  for (let start = BOOKING_OPEN_HOUR; start < BOOKING_CLOSE_HOUR; start++) {
    const startTime = boundaries[start - BOOKING_OPEN_HOUR];
    if (startTime < now) continue;

    const ends = [];
    for (let end = start + 1; end <= Math.min(start + BOOKING_MAX_HOURS, BOOKING_CLOSE_HOUR); end++) {
      const endTime = boundaries[end - BOOKING_OPEN_HOUR];
      if (conflicts.some((booking) => booking.startTime < endTime && booking.endTime > startTime)) break;
      ends.push(end);
    }
    if (ends.length) options[start] = ends;
  }

  return options;
}

export function upcomingBookingBlocks(
  availability: Record<string, BookingHours>,
  days: string[],
  earliestHourToday: number,
  duration: number,
) {
  const blocks: { day: string; start: number; end: number }[] = [];
  for (const day of days.slice(0, 8)) {
    const hours = availability[day] ?? {};
    for (const start of Object.keys(hours).map(Number)) {
      const end = start + duration;
      if ((day === days[0] && start < earliestHourToday) || !hours[start].includes(end)) continue;
      blocks.push({ day, start, end });
      if (blocks.length === 3) return blocks;
    }
  }
  return blocks;
}
