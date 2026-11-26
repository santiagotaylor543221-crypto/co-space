import { protectApi } from '@/lib/auth/api';
import { NextRequest, NextResponse } from 'next/server';
import { bookingService } from '@/services/booking.service';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Validación estricta con Zod para las fechas ISO 8601
const createBookingSchema = z.object({
  workspaceId: z.string().min(1, 'El ID del espacio es requerido'),
  startTime: z.string().datetime({ message: 'Formato de fecha de inicio inválido' }),
  endTime: z.string().datetime({ message: 'Formato de fecha de fin inválido' }),
});

export const POST = protectApi(null, async (user, req: NextRequest) => {
  try {
    const body = await req.json();
    const parsedData = createBookingSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ error: 'Datos incompletos o incorrectos.' }, { status: 400 });
    }

    // 3. Delegar la lógica pesada al Service
    const booking = await bookingService.createBooking({
      userId: user.id,
      workspaceId: parsedData.data.workspaceId,
      startTime: parsedData.data.startTime,
      endTime: parsedData.data.endTime,
    });

    // 4. Retornar éxito (201 Created según estándar REST)
    return NextResponse.json(
      { message: 'Reserva creada con éxito', booking },
      { status: 201 }
    );

  } catch (error: unknown) {
    console.error('Error en POST /api/bookings:', error);
    // Si el error viene de nuestro Service (con status), lo usamos. Si no, es un 500.
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



export const GET = protectApi(null, async (user) => {
  try {
    const userBookings = await prisma.booking.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        status: true,
        startTime: true,
        endTime: true,
        updatedAt: true,
        totalPrice: true,
        workspace: {
          select: { name: true, imageUrl: true, type: true }
        }
      },
      orderBy: { startTime: 'desc' }
    });

    return NextResponse.json(userBookings);
  } catch (error: unknown) {
    console.error('Error obteniendo reservas:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
});
