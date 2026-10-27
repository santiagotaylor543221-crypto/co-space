'use client';

import { useEffect, useState } from 'react';
import dayjs from 'dayjs';

interface AdminBooking {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  totalPrice: number;
  workspace: { name: string };
  user: { name: string; email: string };
}

export default function AdminDashboardPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGlobalBookings();
  }, []);

  const fetchGlobalBookings = async () => {
    try {
      const res = await fetch('/api/admin/bookings');
      if (!res.ok) throw new Error('Error al cargar las reservas globales');
      const data = await res.json();
      setBookings(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm('¿Estás seguro de cancelar esta reserva como administrador?')) return;
    try {
      // Usamos el mismo endpoint DELETE que ya creaste.
      // Tu proxy/servicio ya sabe que si el rol es ADMIN, lo deja pasar (Regla 9 y 14)
      const res = await fetch(`/api/bookings/${bookingId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cancelar');
      alert('Reserva cancelada por el administrador');
      fetchGlobalBookings();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <p className="p-10">Cargando panel de administración...</p>;
  if (error) return <p className="p-10 text-red-500">{error}</p>;

  return (
    <div className="p-10 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Panel de Administración</h1>
      <p className="text-gray-600 mb-8">Vista global de todas las reservas del sistema.</p>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 shadow-sm rounded-lg">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="py-3 px-4 text-left text-sm font-semibold">Usuario</th>
              <th className="py-3 px-4 text-left text-sm font-semibold">Espacio</th>
              <th className="py-3 px-4 text-left text-sm font-semibold">Horario</th>
              <th className="py-3 px-4 text-left text-sm font-semibold">Estado</th>
              <th className="py-3 px-4 text-center text-sm font-semibold">Acción Admin</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-gray-50 border-b">
                <td className="py-3 px-4">
                  <p className="font-bold">{booking.user.name}</p>
                  <p className="text-xs text-gray-500">{booking.user.email}</p>
                </td>
                <td className="py-3 px-4">{booking.workspace.name}</td>
                <td className="py-3 px-4 text-sm">
                  {dayjs(booking.startTime).format('DD/MM HH:mm')} - {dayjs(booking.endTime).format('HH:mm')}
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {booking.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  {booking.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleCancel(booking.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                    >
                      Forzar Cancelación
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}