import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { bookingService } from '@/services/booking.service';

const updateBookingSchema = z.object({
  userId: z.string().min(1),
  workspaceId: z.string().min(1),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const input = updateBookingSchema.safeParse(await request.json());
    if (!input.success) {
      return NextResponse.json({ error: 'Datos de reserva inválidos' }, { status: 400 });
    }

    const booking = await bookingService.updateBooking(id, input.data);
    const bookingWithDetails = await prisma.booking.findUniqueOrThrow({
      where: { id: booking.id },
      include: {
        workspace: { select: { id: true, name: true } },
        user: { select: { name: true, email: true } },
      },
    });
    return NextResponse.json(bookingWithDetails);
  } catch (error) {
    console.error('Error al actualizar reserva desde administración:', error);
    const status =
      typeof error === 'object' && error !== null && 'status' in error &&
      typeof error.status === 'number'
        ? error.status
        : 500;
    const message =
      typeof error === 'object' && error !== null && 'message' in error &&
      typeof error.message === 'string'
        ? error.message
        : 'No se pudo actualizar la reserva';
    return NextResponse.json({ error: message }, { status });
  }
}
