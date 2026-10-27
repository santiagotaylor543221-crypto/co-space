import { NextRequest, NextResponse } from 'next/server';
import { bookingService } from '@/services/booking.service';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/utils/auth';
import { Role } from '@prisma/client';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;

    // Verificar Auth
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const payload = await verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Ejecutar cancelación delegada al servicio
    const cancelledBooking = await bookingService.cancelBooking(
      bookingId,
      payload.id as string,
      payload.role as Role
    );

    return NextResponse.json(
      { message: 'Reserva cancelada con éxito', booking: cancelledBooking },
      { status: 200 }
    );

  } catch (error: any) {
    const status = error.status || 500;
    const message = error.message || 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status });
  }
}