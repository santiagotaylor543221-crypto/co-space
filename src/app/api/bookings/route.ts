import { NextRequest, NextResponse } from 'next/server';
import { bookingService } from '@/services/booking.service';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/utils/auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Validación estricta con Zod para las fechas ISO 8601
const createBookingSchema = z.object({
  workspaceId: z.string().min(1, 'El ID del espacio es requerido'),
  startTime: z.string().datetime({ message: 'Formato de fecha de inicio inválido' }),
  endTime: z.string().datetime({ message: 'Formato de fecha de fin inválido' }),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Seguridad: Extraer y verificar el token de la cookie
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No autorizado. Inicia sesión.' }, { status: 401 });
    }

    const payload = await verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido o expirado.' }, { status: 401 });
    }

    // 2. Validación de datos de entrada
    const body = await req.json();
    const parsedData = createBookingSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ error: 'Datos incompletos o incorrectos.' }, { status: 400 });
    }

    // 3. Delegar la lógica pesada al Service
    const booking = await bookingService.createBooking({
      userId: payload.id as string,
      workspaceId: parsedData.data.workspaceId,
      startTime: parsedData.data.startTime,
      endTime: parsedData.data.endTime,
    });

    // 4. Retornar éxito (201 Created según estándar REST)
    return NextResponse.json(
      { message: 'Reserva creada con éxito', booking },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error en POST /api/bookings:', error);
    // Si el error viene de nuestro Service (con status), lo usamos. Si no, es un 500.
    const status = error.status || 500;
    const message = error.message || 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status });
  }
}



export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;

    if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const payload = await verifyAccessToken(token);
    if (!payload) return NextResponse.json({ error: 'Token inválido' }, { status: 401 });

    // Traemos las reservas del usuario junto con la info del workspace
    const userBookings = await prisma.booking.findMany({
      where: { userId: payload.id as string },
      include: {
        workspace: {
          select: { name: true } // Solo traemos el nombre para la UI
        }
      },
      orderBy: { startTime: 'desc' }
    });

    return NextResponse.json(userBookings, { status: 200 });
  } catch (error: any) {
    console.error('Error obteniendo reservas:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}