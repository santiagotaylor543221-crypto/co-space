'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Clock, Plus, Search, Trash2 } from 'lucide-react';
import Badge, { type BadgeVariant } from '@/components/ui/badge';
import Button from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import Skeleton from '@/components/ui/skeleton';
import WorkspaceImage from '@/components/workspace/workspace-image';
import { BOOKING_TIME_ZONE, inBookingZone } from '@/lib/booking-hours';
import {
  bookingState, matchesBookingFilters, sortBookingHistory, type BookingTab, type HistoryBooking,
} from '@/lib/booking-history';
import { catalogWorkspaceImage } from '@/lib/catalog-workspace-image';
import { useI18n } from '@/lib/i18n';
import { workspaceLabels, type WorkspaceType } from '@/lib/workspace-schema';

const tabs: { id: BookingTab; label: string; empty: string }[] = [
  { id: 'upcoming', label: 'Próximas', empty: 'No tienes próximas reservas.' },
  { id: 'finished', label: 'Finalizadas', empty: 'Todavía no tienes reservas finalizadas.' },
  { id: 'cancelled', label: 'Canceladas', empty: 'No tienes reservas canceladas.' },
];
const states: Record<ReturnType<typeof bookingState>, { label: string; variant: BadgeVariant }> = {
  upcoming: { label: 'Confirmada', variant: 'success' },
  ongoing: { label: 'En curso', variant: 'accent' },
  finished: { label: 'Finalizada', variant: 'neutral' },
  cancelled: { label: 'Cancelada', variant: 'danger' },
};
const emptyFilters = { search: '', type: '', from: '', to: '' };
const control = 'mt-1.5 block min-h-10 w-full min-w-0 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-accent';
const catalogueLink = 'inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-accent/90';

function bookingFormatters(language: 'es' | 'en') {
  const locale = language === 'en' ? 'en-IE' : 'es-CO';
  return {
    date: new Intl.DateTimeFormat(locale, {
      timeZone: BOOKING_TIME_ZONE, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    }),
    time: new Intl.DateTimeFormat(locale, {
      timeZone: BOOKING_TIME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }),
    price: new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }),
    number: new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }),
  };
}

function bookingSummary(
  booking: HistoryBooking,
  format: ReturnType<typeof bookingFormatters>,
  t: (text: string) => string,
) {
  const start = Date.parse(booking.startTime);
  const end = Date.parse(booking.endTime);
  const hours = (end - start) / 3_600_000;
  const release = format.time.format(end);
  return {
    date: format.date.format(start),
    range: `${format.time.format(start)}–${format.time.format(end - 60_000)}`,
    duration: `${format.number.format(hours)} ${t(hours === 1 ? 'hora' : 'horas')}`,
    release: t('El espacio se libera a las {time}').replace('{time}', release),
    total: format.price.format(booking.totalPrice),
  };
}

function BookingCard({ booking, now, onCancel, highlighted = false }: {
  booking: HistoryBooking;
  now: number;
  onCancel: (booking: HistoryBooking) => void;
  highlighted?: boolean;
}) {
  const { t, language } = useI18n();
  const status = bookingState(booking, now);
  const state = states[status];
  const summary = bookingSummary(booking, bookingFormatters(language), t);
  const today = inBookingZone(now);
  const bookingDay = inBookingZone(booking.startTime).format('YYYY-MM-DD');
  const relativeDay = bookingDay === today.format('YYYY-MM-DD') ? t('Hoy')
    : bookingDay === today.add(1, 'day').format('YYYY-MM-DD') ? t('Mañana') : '';

  return (
    <article className={`grid h-full min-w-0 overflow-hidden rounded-2xl border bg-surface shadow-xs ${highlighted
      ? 'border-accent/45 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]'
      : 'border-line grid-rows-[auto_1fr]'}`}>
      <div className={`relative min-h-36 overflow-hidden bg-background ${highlighted ? 'h-44 sm:h-full' : 'h-36'}`}>
        <WorkspaceImage
          imageUrl={catalogWorkspaceImage(booking.workspace.name, booking.workspace.type, booking.workspace.imageUrl)}
          type={booking.workspace.type}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
      <div className="flex min-w-0 flex-col gap-4 p-4 sm:p-5">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant={state.variant}>{t(state.label)}</Badge>
            <span className="text-xs text-muted">{t(workspaceLabels[booking.workspace.type])}</span>
          </div>
          <h2 className="wrap-break-word font-heading text-lg font-semibold text-ink">{booking.workspace.name}</h2>
        </div>
        <div className="space-y-2 text-sm text-muted">
          <p className="flex items-start gap-2">
            <CalendarDays className="mt-0.5 shrink-0" size={16} aria-hidden="true" />
            <span className="capitalize">{highlighted && relativeDay ? `${relativeDay} · ` : ''}{summary.date}</span>
          </p>
          <div className="flex items-start gap-2">
            <Clock className="mt-0.5 shrink-0" size={16} aria-hidden="true" />
            <div>
              <p className="font-medium text-ink">{summary.range} · {summary.duration}</p>
              <p className="mt-0.5 text-xs">{summary.release}</p>
            </div>
          </div>
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
          <div className="text-xs text-muted">
            {t('Total confirmado')}
            <strong className="block font-heading text-lg text-ink">{summary.total}</strong>
          </div>
          {status === 'upcoming' && (
            <Button type="button" variant="danger" onClick={() => onCancel(booking)}>
              <Trash2 size={14} aria-hidden="true" />{t('Cancelar reserva')}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function MisReservasPage() {
  const { t, language } = useI18n();
  const [bookings, setBookings] = useState<HistoryBooking[] | null>(null);
  const [tab, setTab] = useState<BookingTab>('upcoming');
  const [filters, setFilters] = useState(emptyFilters);
  const [loadError, setLoadError] = useState('');
  const [retry, setRetry] = useState(0);
  const [now, setNow] = useState(0);
  const [bookingToCancel, setBookingToCancel] = useState<HistoryBooking | null>(null);
  const [cancellationError, setCancellationError] = useState('');
  const [canceling, setCanceling] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchBookings() {
      try {
        const response = await fetch('/api/bookings', { cache: 'no-store', signal: controller.signal });
        if (!response.ok) {
          throw new Error(response.status === 401 ? 'Tu sesión venció. Inicia sesión de nuevo.' : 'Error al cargar las reservas');
        }
        const data: HistoryBooking[] = await response.json();
        if (!controller.signal.aborted) {
          setNow(Date.now());
          setBookings(data);
        }
      } catch (failure) {
        if (!controller.signal.aborted) {
          setLoadError(failure instanceof Error ? failure.message : 'Error al cargar las reservas');
        }
      }
    }
    void fetchBookings();
    return () => controller.abort();
  }, [retry]);

  useEffect(() => {
    const update = () => setNow(Date.now());
    const timer = window.setInterval(update, 15_000);
    window.addEventListener('focus', update);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', update);
    };
  }, []);

  useEffect(() => {
    const element = dialog.current;
    if (!bookingToCancel || !element) return;
    element.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [bookingToCancel]);

  const history = sortBookingHistory(bookings ?? [], now);
  const invalidDates = !!(filters.from && filters.to && filters.to < filters.from);
  const hasFilters = Object.values(filters).some((value) => value.trim());
  const visible = invalidDates ? [] : history[tab].filter((booking) => matchesBookingFilters(booking, filters));
  const next = tab === 'upcoming' ? visible.find((booking) => bookingState(booking, now) === 'upcoming') : undefined;
  const rest = visible.filter((booking) => booking.id !== next?.id);
  const cancellation = bookingToCancel ? bookingSummary(bookingToCancel, bookingFormatters(language), t) : null;

  function requestCancellation(booking: HistoryBooking) {
    setCancellationError('');
    setBookingToCancel(booking);
  }

  function closeCancellation() {
    if (!canceling) setBookingToCancel(null);
  }

  async function cancelBooking() {
    if (canceling || !bookingToCancel) return;

    setCanceling(true);
    setCancellationError('');
    try {
      const response = await fetch(`/api/bookings/${bookingToCancel.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al cancelar la reserva');
      }

      const { booking: cancelled } = await response.json() as { booking: Pick<HistoryBooking, 'id' | 'status' | 'updatedAt'> };
      setBookings((previous) => previous?.map((booking) => booking.id === cancelled.id
        ? { ...booking, status: cancelled.status, updatedAt: cancelled.updatedAt }
        : booking) ?? null);
      setBookingToCancel(null);
    } catch (failure) {
      setCancellationError(failure instanceof Error ? failure.message : 'Error al cancelar la reserva');
    } finally {
      setCanceling(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{t('Mis Reservas')}</h1>
          <p className="mt-2 text-sm text-muted">{t('Consulta tus próximas reservas y tu historial.')}</p>
        </div>
        <Link href="/dashboard" className={catalogueLink}>
          <Plus size={16} aria-hidden="true" />{t('Nueva reserva')}
        </Link>
      </header>

      <div role="group" aria-label={t('Estado de la reserva')} className="flex flex-wrap gap-2">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            aria-pressed={tab === id}
            onClick={() => setTab(id)}
            className={`min-h-10 rounded-xl border px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-accent sm:text-sm ${tab === id
              ? 'border-accent bg-accent-soft text-ink' : 'border-line bg-surface text-muted hover:text-ink'}`}
          >
            {t(label)}
            {bookings && <span className="ml-1.5 tabular-nums">{history[id].length}</span>}
          </button>
        ))}
      </div>

      {bookings && (
        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-line bg-surface p-4 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]" role="group" aria-label={t('Filtros de reservas')}>
          <label className="col-span-2 min-w-0 text-xs font-medium text-muted md:col-span-1">
            {t('Buscar por espacio')}
            <span className="relative block">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input type="search" className={`${control} pl-9`} value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
            </span>
          </label>
          <label className="col-span-2 min-w-0 text-xs font-medium text-muted md:col-span-1">
            {t('Tipo de espacio')}
            <select className={control} value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}>
              <option value="">{t('Todos los tipos')}</option>
              {(Object.keys(workspaceLabels) as WorkspaceType[]).map((type) => <option key={type} value={type}>{t(workspaceLabels[type])}</option>)}
            </select>
          </label>
          <label className="min-w-0 text-xs font-medium text-muted">
            {t('Desde')}
            <input type="date" className={control} value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} />
          </label>
          <label className="min-w-0 text-xs font-medium text-muted">
            {t('Hasta')}
            <input type="date" className={control} value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} />
          </label>
          {invalidDates && (
            <p role="alert" className="col-span-full text-xs text-danger">{t('La fecha final debe ser igual o posterior a la inicial.')}</p>
          )}
        </div>
      )}

      {loadError && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger-soft p-4 text-sm text-danger">
          <p>{t(loadError)}</p>
          <Button type="button" variant="secondary" onClick={() => {
            setLoadError('');
            setRetry((value) => value + 1);
          }}>{t('Reintentar')}</Button>
        </div>
      )}

      {!bookings && !loadError && (
        <div aria-busy="true" aria-label={t('Cargando reservas...')} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((index) => <Skeleton key={index} className="h-72 w-full rounded-2xl" />)}
        </div>
      )}

      {bookings && !invalidDates && visible.length === 0 && (
        <EmptyState
          icon={hasFilters ? Search : CalendarDays}
          title={t(hasFilters ? 'No hay reservas con estos filtros.' : (tabs.find(({ id }) => id === tab)?.empty ?? ''))}
          action={hasFilters ? (
            <Button type="button" variant="secondary" onClick={() => setFilters(emptyFilters)}>{t('Limpiar filtros')}</Button>
          ) : tab === 'upcoming' ? (
            <Link href="/dashboard" className={catalogueLink}>{t('Explorar espacios')}</Link>
          ) : null}
        />
      )}

      {next && (
        <section aria-label={t('Tu próxima reserva')} className="space-y-2">
          <p className="text-sm font-semibold text-ink">{t('Tu próxima reserva')}</p>
          <BookingCard booking={next} now={now} onCancel={requestCancellation} highlighted />
        </section>
      )}
      {rest.length > 0 && (
        <section aria-label={t('Reservas')} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((booking) => <BookingCard key={booking.id} booking={booking} now={now} onCancel={requestCancellation} />)}
        </section>
      )}

      <dialog
        ref={dialog}
        aria-labelledby="cancel-booking-title"
        onCancel={(event) => {
          event.preventDefault();
          closeCancellation();
        }}
        className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-md overflow-y-auto rounded-2xl border border-line bg-surface p-5 text-ink shadow-xl backdrop:bg-ink/45 sm:p-6"
      >
        {bookingToCancel && cancellation && (
          <div className="space-y-4">
            <h2 id="cancel-booking-title" className="font-heading text-xl font-semibold">{t('¿Cancelar esta reserva?')}</h2>
            <div className="space-y-1 rounded-xl bg-background p-4 text-sm">
              <p className="wrap-break-word font-semibold">{bookingToCancel.workspace.name}</p>
              <p className="capitalize text-muted">{cancellation.date}</p>
              <p>{cancellation.range} · {cancellation.duration}</p>
            </div>
            {cancellationError && <p role="alert" className="rounded-xl bg-danger-soft p-3 text-sm text-danger">{t(cancellationError)}</p>}
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="secondary" onClick={closeCancellation} disabled={canceling}>{t('Conservar reserva')}</Button>
              <Button type="button" variant="danger" onClick={cancelBooking} disabled={canceling}>
                {t(canceling ? 'Cancelando...' : 'Confirmar cancelación')}
              </Button>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
