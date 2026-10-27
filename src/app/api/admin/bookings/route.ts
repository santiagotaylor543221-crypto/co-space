import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Traemos TODAS las reservas del sistema
    // Incluimos los datos del espacio y del usuario que hizo la reserva
    const allBookings = await prisma.booking.findMany({
      include: {
        workspace: { select: { name: true } },
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