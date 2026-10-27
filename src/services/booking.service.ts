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

interface ValidatedBooking {
  start: dayjs.Dayjs;
  end: dayjs.Dayjs;
  workspace: NonNullable<Awaited<ReturnType<typeof prisma.workspace.findUnique>>>;
  hours: number;
}

async function validateBooking(data: CreateBookingDTO, ignoredBookingId?: string): Promise<ValidatedBooking> {
  const start = dayjs(data.startTime);
  const end = dayjs(data.endTime);
  const now = dayjs();

  if (!start.isValid() || !end.isValid()) {
    throw { status: 400, message: 'La fecha de inicio o fin no es válida.' };
  }

  const hours = end.diff(start, 'hour', true);
  if (hours < 1 || hours > 4 || hours % 1 !== 0) {
    throw { status: 400, message: 'La reserva debe ser de 1 a 4 horas exactas.' };
  }

  if (start.hour() < 7 || end.hour() > 21 || (end.hour() === 21 && end.minute() > 0)) {
    throw { status: 400, message: 'El horario permitido es de 07:00 a 21:00.' };
  }

  if (start.isBefore(now)) {
    throw { status: 400, message: 'No puedes reservar en el pasado.' };
  }
  if (start.isAfter(now.add(30, 'day'))) {
    throw { status: 400, message: 'Máximo 30 días de anticipación.' };
  }

  const [workspace, user] = await Promise.all([
    prisma.workspace.findUnique({ where: { id: data.workspaceId } }),
    prisma.user.findUnique({ where: { id: data.userId }, select: { id: true } }),
  ]);
  if (!workspace || !workspace.isActive) {
    throw { status: 404, message: 'El espacio no existe o está archivado.' };
  }
  if (!user) throw { status: 404, message: 'Usuario no encontrado.' };

  const excludedBooking = ignoredBookingId ? { id: { not: ignoredBookingId } } : {};
  const futureBookings = await prisma.booking.count({
    where: {
      userId: data.userId,
      status: BookingStatus.CONFIRMED,
      startTime: { gt: now.toDate() },
      ...excludedBooking,
    },
  });
  if (futureBookings >= 3) {
    throw { status: 400, message: 'El usuario alcanzó el límite de 3 reservas futuras.' };
  }

  const overlap = {
    status: BookingStatus.CONFIRMED,
    startTime: { lt: end.toDate() },
    endTime: { gt: start.toDate() },
    ...excludedBooking,
  };
  const [spaceOverlap, userOverlap] = await Promise.all([
    prisma.booking.findFirst({ where: { ...overlap, workspaceId: data.workspaceId } }),
    prisma.booking.findFirst({ where: { ...overlap, userId: data.userId } }),
  ]);

  if (spaceOverlap) {
    throw { status: 409, message: 'El espacio ya está reservado en ese horario.' };
  }
  if (userOverlap) {
    throw { status: 409, message: 'El usuario ya tiene otra reserva en ese horario.' };
  }

  return { start, end, workspace, hours };
}

export const bookingService = {
  async createBooking(data: CreateBookingDTO) {
    const { start, end, workspace, hours } = await validateBooking(data);
    return await prisma.booking.create({
      data: {
        userId: data.userId,
        workspaceId: data.workspaceId,
        startTime: start.toDate(),
        endTime: end.toDate(),
        totalPrice: hours * workspace.pricePerHour,
      },
    });
  },

  async updateBooking(bookingId: string, data: CreateBookingDTO) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw { status: 404, message: 'Reserva no encontrada.' };
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw { status: 400, message: 'Solo se pueden editar reservas confirmadas.' };
    }

    const { start, end, workspace, hours } = await validateBooking(data, bookingId);
    return prisma.booking.update({
      where: { id: bookingId },
      data: {
        userId: data.userId,
        workspaceId: data.workspaceId,
        startTime: start.toDate(),
        endTime: end.toDate(),
        totalPrice: hours * workspace.pricePerHour,
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