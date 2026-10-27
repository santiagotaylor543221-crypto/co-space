import { prisma } from '@/lib/prisma';
import dayjs from 'dayjs';
import { BookingStatus, Role } from '@prisma/client';

// Tipado estricto
interface CreateBookingDTO {
  userId: string;
  workspaceId: string;
  startTime: string; // ISO String
  endTime: string;   // ISO String
}

export const bookingService = {
  async createBooking(data: CreateBookingDTO) {
    const start = dayjs(data.startTime);
    const end = dayjs(data.endTime);
    const now = dayjs();

    // Regla 1: Duración entre 1 y 4 horas exactas (sin fracciones)
    const hours = end.diff(start, 'hour', true);
    if (hours < 1 || hours > 4 || hours % 1 !== 0) {
      throw { status: 400, message: 'La reserva debe ser de 1 a 4 horas exactas.' };
    }

    // Regla 2: Horario de 07:00 a 21:00
    if (start.hour() < 7 || end.hour() > 21 || (end.hour() === 21 && end.minute() > 0)) {
      throw { status: 400, message: 'El horario permitido es de 07:00 a 21:00.' };
    }

    // Regla 3: Ventana de tiempo (no pasado, no más de 30 días)
    if (start.isBefore(now)) {
      throw { status: 400, message: 'No puedes reservar en el pasado.' };
    }
    if (start.isAfter(now.add(30, 'day'))) {
      throw { status: 400, message: 'Máximo 30 días de anticipación.' };
    }

    // Regla 7 y 8: Espacio activo y cálculo de precio en backend
    const workspace = await prisma.workspace.findUnique({
      where: { id: data.workspaceId },
    });
    if (!workspace) throw { status: 404, message: 'Espacio no encontrado.' };
    if (!workspace.isActive) throw { status: 400, message: 'El espacio está inactivo.' };

    const totalPrice = hours * workspace.pricePerHour;

    // Regla 6: Límite de 3 reservas futuras por usuario
    const futureBookings = await prisma.booking.count({
      where: {
        userId: data.userId,
        status: BookingStatus.CONFIRMED,
        startTime: { gt: now.toDate() },
      },
    });
    if (futureBookings >= 3) {
      throw { status: 400, message: 'Alcanzaste el límite de 3 reservas futuras.' };
    }

    // Regla 4: Solapamiento de espacio (excluyendo canceladas)
    const spaceOverlap = await prisma.booking.findFirst({
      where: {
        workspaceId: data.workspaceId,
        status: BookingStatus.CONFIRMED,
        startTime: { lt: end.toDate() }, // Empieza antes de que mi reserva termine
        endTime: { gt: start.toDate() }, // Termina después de que mi reserva empiece
      },
    });
    if (spaceOverlap) throw { status: 409, message: 'El espacio ya está reservado en ese horario.' };

    // Regla 5: Solapamiento de usuario
    const userOverlap = await prisma.booking.findFirst({
      where: {
        userId: data.userId,
        status: BookingStatus.CONFIRMED,
        startTime: { lt: end.toDate() },
        endTime: { gt: start.toDate() },
      },
    });
    if (userOverlap) throw { status: 409, message: 'Tienes otra reserva que se cruza en ese horario.' };

    // Creación final
    return await prisma.booking.create({
      data: {
        userId: data.userId,
        workspaceId: data.workspaceId,
        startTime: start.toDate(),
        endTime: end.toDate(),
        totalPrice,
      },
    });
  },

  async cancelBooking(bookingId: string, userId: string, userRole: Role) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw { status: 404, message: 'Reserva no encontrada.' };

    // Regla 9 y 14: Solo el dueño o el ADMIN pueden cancelar (Anti-IDOR)
    if (booking.userId !== userId && userRole !== Role.ADMIN) {
      throw { status: 403, message: 'No tienes permiso para cancelar esta reserva.' };
    }

    // Regla 10: Cancelación hasta 2 horas antes
    const start = dayjs(booking.startTime);
    const now = dayjs();
    if (start.diff(now, 'hour', true) < 2) {
      throw { status: 400, message: 'Debes cancelar con al menos 2 horas de anticipación.' };
    }

    // Regla 11: Soft-cancel (No eliminar, cambiar estado)
    return await prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED },
    });
  }
};