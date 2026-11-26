import { protectApi } from '@/lib/auth/api';
import { NextRequest, NextResponse } from 'next/server';
import { bookingService } from '@/services/booking.service';

export const DELETE = protectApi(null, async (
  user,
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id: bookingId } = await params;

    // Ejecutar cancelación delegada al servicio
    const cancelledBooking = await bookingService.cancelBooking(
      bookingId,
      user.id,
      user.role
    );

    return NextResponse.json(
      { message: 'Reserva cancelada con éxito', booking: cancelledBooking },
      { status: 200 }
    );

  } catch (error: unknown) {
    const status =
      typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number'
        ? error.status || 500
        : 500;
    const message =
      typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string'
        ? error.message || 'Error interno del servidor'
        : 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status });
  }
});
