'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Clock, Trash2, CalendarDays } from 'lucide-react';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/badge';
import EmptyState from '@/components/ui/empty-state';
import Skeleton from '@/components/ui/skeleton';
import { useI18n } from '@/lib/i18n';

interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  workspace: {
    name: string;
  };
}

export default function MisReservasPage() {
  const { t, language } = useI18n();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch('/api/bookings');
        if (!res.ok) throw new Error('Error al cargar las reservas');
        const data = await res.json();
        setBookings(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? t(err.message) : t('Error al cargar las reservas'));
      } finally {
        setLoading(false);
      }
    };

    void fetchBookings();
  }, [t]);

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm(t('¿Estás seguro de que deseas cancelar esta reserva?'))) return;

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
    } catch (err: unknown) {
      alert(err instanceof Error ? t(err.message) : t('Error al cancelar la reserva'));
    } finally {
      setCancelingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pb-6 border-b border-line">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-accent mb-2">
            {t('Panel Personal')}
          </p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {t('Mis Reservas')}
          </h1>
          <p className="mt-2 text-xs text-muted max-w-xl">
            {t('Gestiona tus próximos espacios de trabajo.')}
          </p>
        </div>
      </section>

      {/* Alerta de error */}
      {error && (
        <div className="rounded-2xl border border-danger/30 bg-danger-soft p-4 text-xs font-medium text-danger">
          {error}
        </div>
      )}

      {/* Estado de carga con Skeletons */}
      {loading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((idx) => (
            <div key={idx} className="rounded-2xl border border-line bg-surface p-6 space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-10 w-full rounded-xl pt-4" />
            </div>
          ))}
        </div>
      )}

      {/* Estado vacío cuando no hay reservas */}
      {!loading && !error && bookings.length === 0 && (
        <EmptyState
          icon={CalendarDays}
          title={t('No tienes reservas activas en este momento.')}
          description="Reserva tu primer escritorio, sala o cabina desde nuestro catálogo."
          action={
            <Link href="/dashboard">
              <Button variant="primary" size="md">
                {t('Explorar espacios')}
              </Button>
            </Link>
          }
        />
      )}

      {/* Grid de reservas */}
      {!loading && !error && bookings.length > 0 && (
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {bookings.map((booking) => {
            const startDate = new Date(booking.startTime);
            const endDate = new Date(booking.endTime);

            return (
              <article
                key={booking.id}
                className="flex flex-col justify-between overflow-hidden rounded-2xl border border-line bg-surface shadow-xs transition-all hover:border-line/80 hover:shadow-sm"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="success">
                      {t('Confirmado')}
                    </Badge>
                  </div>

                  <h2 className="font-heading text-lg font-semibold text-ink">
                    {booking.workspace.name}
                  </h2>

                  <div className="mt-4 space-y-2 text-xs text-muted">
                    <div className="flex items-center gap-2.5">
                      <Calendar size={14} className="text-muted" />
                      <span>{startDate.toLocaleDateString(language)}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Clock size={14} className="text-muted" />
                      <span>
                        {startDate.toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' })} -{' '}
                        {endDate.toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="border-t border-line bg-background/50 p-4">
                  <button
                    type="button"
                    onClick={() => handleCancelBooking(booking.id)}
                    disabled={cancelingId === booking.id}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-danger/20 bg-danger-soft py-2.5 text-xs font-medium text-danger transition hover:bg-danger-soft/80 disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                    <span>{cancelingId === booking.id ? t('Cancelando...') : t('Cancelar reserva')}</span>
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