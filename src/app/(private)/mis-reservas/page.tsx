'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Clock, Trash2, MapPin } from 'lucide-react';

interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  workspace: {
    name: string;
  };
}

export default function MisReservasPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/bookings');
      if (!res.ok) throw new Error('Error al cargar las reservas');
      const data = await res.json();
      setBookings(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta reserva?')) return;
    
    setCancelingId(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al cancelar la reserva');
      }

      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCancelingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  return (
    <div className="py-16">
      <section className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-3 flex items-center gap-3 text-[9px] uppercase tracking-[0.25em] text-zinc-500">
            <span className="h-px w-5 bg-zinc-600" />
            Panel Personal
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            Mis Reservas
          </h1>
        </div>
        <p className="max-w-[200px] text-[11px] leading-relaxed text-zinc-500 sm:text-right">
          Gestiona tus próximos espacios de trabajo.
        </p>
      </section>

      {error && (
        <div className="mb-8 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-400">
          {error}
        </div>
      )}

      {bookings.length === 0 && !error ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-20 text-center">
          <Calendar className="mb-4 text-zinc-600" size={32} />
          <p className="mb-4 text-sm text-zinc-400">No tienes reservas activas en este momento.</p>
          <Link 
            href="/dashboard" 
            className="rounded-lg bg-white px-5 py-2 text-xs font-semibold text-black transition hover:bg-zinc-200"
          >
            Explorar espacios
          </Link>
        </div>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bookings.map((booking) => {
            const startDate = new Date(booking.startTime);
            const endDate = new Date(booking.endTime);
            
            return (
              <article 
                key={booking.id} 
                className="flex flex-col justify-between overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition hover:border-white/20"
              >
                <div className="p-5">
                  <h2 className="mb-4 text-lg font-semibold text-white">{booking.workspace.name}</h2>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-xs text-zinc-400">
                      <Calendar size={14} className="text-zinc-500" />
                      <span>{startDate.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-400">
                      <Clock size={14} className="text-zinc-500" />
                      <span>
                        {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                        {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/10 bg-zinc-900/30 p-4">
                  <button
                    onClick={() => handleCancelBooking(booking.id)}
                    disabled={cancelingId === booking.id}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 py-2.5 text-xs font-medium text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                    {cancelingId === booking.id ? 'Cancelando...' : 'Cancelar reserva'}
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}