import { BookingStatus } from '@prisma/client';

export function confirmedBookingOverlap(startTime: Date, endTime: Date) {
  return {
    status: BookingStatus.CONFIRMED,
    startTime: { lt: endTime },
    endTime: { gt: startTime },
  };
}
