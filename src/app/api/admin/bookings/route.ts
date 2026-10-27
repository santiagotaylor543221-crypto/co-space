import { NextResponse } from 'next/server';
import { BookingStatus } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { bookingService } from '@/services/booking.service';

const createBookingSchema = z.object({
  userId: z.string().min(1),
  workspaceId: z.string().min(1),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
});

export async function GET() {
  try {
    // Traemos las reservas confirmadas para que las canceladas no reaparezcan.
    const allBookings = await prisma.booking.findMany({
      where: { status: BookingStatus.CONFIRMED },
      include: {
        workspace: { select: { id: true, name: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { startTime: 'desc' },
    });

    return NextResponse.json(allBookings, { status: 200 });
  } catch (error) {
    console.error('Error en admin/bookings:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const input = createBookingSchema.safeParse(await request.json());
    if (!input.success) {
      return NextResponse.json({ error: 'Datos de reserva inválidos' }, { status: 400 });
    }

    const booking = await bookingService.createBooking(input.data);
    const bookingWithDetails = await prisma.booking.findUniqueOrThrow({
      where: { id: booking.id },
      include: {
        workspace: { select: { id: true, name: true } },
        user: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json(bookingWithDetails, { status: 201 });
  } catch (error) {
    console.error('Error al crear reserva desde administración:', error);
    const status =
      typeof error === 'object' && error !== null && 'status' in error &&
      typeof error.status === 'number'
        ? error.status
        : 500;
    const message =
      typeof error === 'object' && error !== null && 'message' in error &&
      typeof error.message === 'string'
        ? error.message
        : 'No se pudo crear la reserva';
    return NextResponse.json({ error: message }, { status });
  }
}