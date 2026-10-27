import { bookingService } from '@/services/booking.service';
import { Role } from '@prisma/client';

interface CreateBookingDTO {
  userId: string;
  workspaceId: string;
  startTime: string; // ISO String
  endTime: string;   // ISO String
}

export const bookingProxy = {
  // Intercepta la creación para auditoría
  async createBooking(data: CreateBookingDTO, userRole: Role) {
    console.log(`[AUDIT - ${new Date().toISOString()}] Usuario ${data.userId} (Rol: ${userRole}) intentando crear reserva en espacio ${data.workspaceId}.`);

    // Si todo está bien, pasamos la petición al servicio real
    const result = await bookingService.createBooking({
      userId: data.userId,
      workspaceId: data.workspaceId,
      startTime: data.startTime,
      endTime: data.endTime,
    });

    console.log(`[AUDIT] Reserva creada exitosamente.`);
    return result;
  },

  // Intercepta la cancelación para auditoría
  async cancelBooking(bookingId: string, userId: string, userRole: Role) {
    console.log(`[AUDIT - ${new Date().toISOString()}] Usuario ${userId} (Rol: ${userRole}) intentando cancelar reserva ${bookingId}.`);

    // Delegamos al servicio real
    const result = await bookingService.cancelBooking(bookingId, userId, userRole);

    console.log(`[AUDIT] Reserva cancelada exitosamente.`);
    return result;
  }
};