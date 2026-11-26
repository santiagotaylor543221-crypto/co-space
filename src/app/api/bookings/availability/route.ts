import { protectApi } from '@/lib/auth/api';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  availableBookingHours,
  bookingDays,
  bookingHour,
  BOOKING_CLOSE_HOUR,
  BOOKING_OPEN_HOUR,
} from '@/lib/booking-hours';
import { confirmedBookingOverlap } from '@/lib/booking-overlap';

export const GET = protectApi(null, async (user, request: NextRequest) => {
  const now = new Date();
  const days = bookingDays(now);
  const workspaceId = request.nextUrl.searchParams.get('workspaceId');
  const day = request.nextUrl.searchParams.get('day');
  if (!workspaceId || (day !== null && !days.includes(day))) {
    return NextResponse.json({ error: 'Fecha o espacio inválidos.' }, { status: 400 });
  }

  const dates = day ? [day] : days;
  const start = bookingHour(dates[0], BOOKING_OPEN_HOUR);
  const end = bookingHour(dates[dates.length - 1], BOOKING_CLOSE_HOUR);

  try {
    const [workspace, conflicts] = await Promise.all([
      prisma.workspace.findUnique({ where: { id: workspaceId }, select: { isActive: true } }),
      prisma.booking.findMany({
        where: {
          ...confirmedBookingOverlap(start, end),
          OR: [{ workspaceId }, { userId: user.id }],
        },
        select: { startTime: true, endTime: true },
      }),
    ]);
    if (!workspace?.isActive) return NextResponse.json({ error: 'Espacio no encontrado' }, { status: 404 });

    const hoursByDay = Object.fromEntries(
      dates.map((date) => [date, availableBookingHours(date, now, conflicts)]),
    );
    return NextResponse.json(day ? hoursByDay[day] : hoursByDay, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    console.error('Error al consultar disponibilidad:', error);
    return NextResponse.json({ error: 'No se pudo consultar la disponibilidad.' }, { status: 500 });
  }
});
