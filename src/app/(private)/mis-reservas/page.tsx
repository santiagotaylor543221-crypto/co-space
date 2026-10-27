'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { AlertCircle, Calendar, Clock, LogOut } from 'lucide-react';

dayjs.locale('es');

interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  totalPrice: number;
  workspace: { name: string; imageUrl?: string };
}

export default function MisReservasPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/bookings');
      if (!res.ok) throw new Error('Error al cargar tus reservas');
      const data = await res.json();
      setBookings(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm('¿Estás seguro de cancelar esta reserva?')) return;

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error al cancelar');

      alert('Reserva cancelada con éxito');
      fetchBookings(); // Recargar la lista para ver el cambio de estado
    } catch (err: any) {
      alert(err.message); // Aquí saltarán las reglas de "menos de 2 horas" del proxy
    }
  };

  // Ajusta la ruta si tu endpoint de logout es otro
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  // Reservas confirmadas que todavía no han empezado
  const futureConfirmed = bookings.filter(
    (b) => b.status === 'CONFIRMED' && dayjs(b.startTime).isAfter(dayjs())
  ).length;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#09090b]">
        <p className="text-xs text-zinc-500">Cargando tus reservas...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#09090b] px-4">
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] px-4 py-4">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 sm:px-6">
          <Link href="/" className="text-base font-semibold text-white">
            <span className="text-zinc-400">Co</span>Space
          </Link>

          <div className="flex items-center gap-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[9px] font-bold text-black">
              MS
            </span>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              className="text-zinc-400 transition hover:text-white"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <main className="px-0 py-16 sm:px-6">
          <section className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-3 flex items-center gap-3 text-[9px] uppercase tracking-[0.25em] text-zinc-500">
                <span className="h-px w-5 bg-zinc-600" />
                Tu espacio personal
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                Mis Reservas
              </h1>
            </div>

            <p className="text-[11px] text-zinc-500">Gestiona tus próximas sesiones.</p>
          </section>

          {bookings.length === 0 ? (
            <p className="text-xs text-zinc-500">No tienes reservas aún.</p>
          ) : (
            <>
              {/* Aviso */}
              <aside className="mb-5 flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                <AlertCircle size={16} className="shrink-0 text-amber-400" />
                <div>
                  <p className="text-[11px] font-medium text-amber-300">
                    Tienes {futureConfirmed} de {bookings.length} reservas futuras confirmadas
                  </p>
                  <p className="mt-0.5 text-[9px] text-zinc-500">
                    Recuerda que puedes cancelar hasta 24 h antes.
                  </p>
                </div>
              </aside>

              {/* Lista de reservas */}
              <section className="flex flex-col gap-3">
                {bookings.map((booking, index) => {
                  const isConfirmed = booking.status === 'CONFIRMED';

                  return (
                    <article
                      key={booking.id}
                      className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 sm:flex-row sm:items-center"
                    >
                      <div className="h-32 w-full shrink-0 overflow-hidden rounded-lg bg-zinc-900 sm:h-[72px] sm:w-[120px]">
                        {booking.workspace.imageUrl && (
                          <img
                            src={booking.workspace.imageUrl}
                            alt={booking.workspace.name}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>

                      <div className="flex-1 px-1">
                        <p className="text-[8px] uppercase tracking-widest text-zinc-600">
                          Reserva {String(index + 1).padStart(2, '0')}
                        </p>
                        <h2 className="mt-1 text-sm font-semibold text-white">
                          {booking.workspace.name}
                        </h2>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-[9px] uppercase text-zinc-500">
                          <span className="flex items-center gap-1.5">
                            <Calendar size={11} />
                            {dayjs(booking.startTime).format('DD MMM YYYY')}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock size={11} />
                            {dayjs(booking.startTime).format('HH:mm')} —{' '}
                            {dayjs(booking.endTime).format('HH:mm')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 px-1 sm:justify-end">
                        <div className="flex flex-col items-start gap-1.5 sm:items-end">
                          <p className="text-sm font-semibold text-white">{booking.totalPrice} €</p>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[8px] font-medium ${
                              isConfirmed
                                ? 'border-green-500/20 bg-green-500/10 text-green-400'
                                : 'border-red-500/20 bg-red-500/10 text-red-400'
                            }`}
                          >
                            {isConfirmed ? 'Confirmada' : 'Cancelada'}
                          </span>
                        </div>

                        {isConfirmed && (
                          <button
                            type="button"
                            onClick={() => handleCancel(booking.id)}
                            className="rounded-lg border border-white/15 px-4 py-2.5 text-[9px] font-semibold text-zinc-200 transition hover:bg-white/10"
                          >
                            Cancelar Reserva
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}