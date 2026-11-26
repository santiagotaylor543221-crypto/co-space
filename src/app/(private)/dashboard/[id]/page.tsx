'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, CalendarDays, ChevronDown, Clock, LoaderCircle, Users } from 'lucide-react';
import WorkspaceImage from '@/components/workspace/workspace-image';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import Skeleton from '@/components/ui/skeleton';
import { useI18n } from '@/lib/i18n';
import {
  bookingDays, bookingHour, BOOKING_CLOSE_HOUR, BOOKING_MAX_HOURS, BOOKING_OPEN_HOUR,
  BOOKING_TIME_ZONE, formatBookingHour, inBookingZone, upcomingBookingBlocks, type BookingHours,
} from '@/lib/booking-hours';
import { catalogWorkspaceImage } from '@/lib/catalog-workspace-image';
import type { WorkspaceType } from '@/lib/workspace-schema';

interface Workspace {
  id: string;
  name: string;
  description: string;
  capacity: number;
  pricePerHour: number;
  imageUrl?: string;
  type?: WorkspaceType;
  location?: string;
  amenities?: string[];
}

type Selection = { day: string; start?: number; end?: number };
type BookingBlock = Required<Selection>;
type Availability = { key: string; days?: Record<string, BookingHours>; error?: string };
const inputClass =
  'w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink focus-visible:outline-2 focus-visible:outline-accent disabled:bg-background disabled:text-muted';
const durations = Array.from({ length: BOOKING_MAX_HOURS }, (_, index) => index + 1);

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-64 w-full rounded-3xl" />
      <Skeleton className="h-96 w-full rounded-3xl" />
    </div>
  );
}

function WorkspaceSummary({ workspace, compact = false }: { workspace: Workspace; compact?: boolean }) {
  const { t } = useI18n();
  return (
    <article className={`grid overflow-hidden rounded-2xl border border-line bg-surface ${compact ? 'sm:grid-cols-[9rem_1fr]' : 'sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]'}`}>
      <div className={`overflow-hidden bg-background ${compact ? 'h-28 sm:h-full' : 'h-48 sm:h-full sm:min-h-56'}`}>
        <WorkspaceImage
          imageUrl={catalogWorkspaceImage(workspace.name, workspace.type, workspace.imageUrl)}
          type={workspace.type}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>
      <div className={`min-w-0 self-center ${compact ? 'p-4' : 'p-5 sm:p-8'}`}>
        {compact ? <h3 className="font-heading text-lg font-semibold">{workspace.name}</h3> : (
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">{workspace.name}</h1>
        )}
        <p className={`mt-2 wrap-break-word text-sm leading-relaxed text-muted ${compact ? 'line-clamp-2' : ''}`}>
          {workspace.description}
        </p>
        {!compact && workspace.location && <p className="mt-3 text-xs text-muted">{workspace.location}</p>}
        {!compact && !!workspace.amenities?.length && (
          <ul aria-label={t('Comodidades')} className="mt-3 flex flex-wrap gap-1.5">
            {workspace.amenities.map((amenity) => (
              <li key={amenity} className="rounded-md bg-background px-2 py-1 text-xs">{amenity}</li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Users size={14} aria-hidden="true" />
            {workspace.capacity} {t(workspace.capacity === 1 ? 'persona' : 'personas')}
          </span>
          <span>{workspace.pricePerHour} € {t('/ hora')}</span>
        </div>
      </div>
    </article>
  );
}

export default function WorkspaceDetailPage() {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <WorkspaceDetailContent />
    </Suspense>
  );
}

function WorkspaceDetailContent() {
  const { t, language } = useI18n();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [workspaceError, setWorkspaceError] = useState('');
  const [error, setError] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [selection, setSelection] = useState<Selection>({ day: '' });
  const [review, setReview] = useState<BookingBlock | null>(null);
  const [durationWanted, setDurationWanted] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [refresh, setRefresh] = useState(0);

  const currentTime = now === null ? null : inBookingZone(now);
  const today = currentTime?.format('YYYY-MM-DD') ?? '';
  const days = now === null ? [] : bookingDays(now);
  const day = days.includes(selection.day) ? selection.day : today;
  const availabilityKey = `${id}/${today}/${refresh}`;
  const activeAvailability = availability?.key === availabilityKey ? availability : null;
  const hoursByDay = activeAvailability?.days;
  const availabilityError = activeAvailability?.error;
  const earliestHour = currentTime
    ? Math.max(BOOKING_OPEN_HOUR, currentTime.hour() + Number(currentTime.startOf('hour').valueOf() < currentTime.valueOf()))
    : BOOKING_OPEN_HOUR;
  const hours = hoursByDay?.[day] ?? {};
  const starts = Object.keys(hours).map(Number).filter((hour) => day !== today || hour >= earliestHour);
  const unavailableStarts = Array.from({ length: BOOKING_CLOSE_HOUR - BOOKING_OPEN_HOUR }, (_, i) => BOOKING_OPEN_HOUR + i)
    .filter((hour) => (day !== today || hour >= earliestHour) && !starts.includes(hour));
  const selectedStart = selection.day === day ? selection.start : undefined;
  const start = selectedStart !== undefined && starts.includes(selectedStart) ? selectedStart : undefined;
  const ends = start === undefined ? [] : hours[start];
  const end = selection.end !== undefined && ends.includes(selection.end) ? selection.end : undefined;
  const totalHours = start !== undefined && end !== undefined ? end - start : 0;
  const suggestions = hoursByDay && durationWanted !== ''
    ? upcomingBookingBlocks(hoursByDay, days, earliestHour, durationWanted)
    : [];

  useEffect(() => {
    const controller = new AbortController();
    async function loadWorkspace() {
      try {
        const response = await fetch(`/api/workspaces/${id}`, { cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error('Espacio no encontrado');
        const data: Workspace = await response.json();
        if (!controller.signal.aborted) {
          setWorkspace(data);
          setWorkspaceError('');
          setNow(Date.now());
        }
      } catch {
        if (!controller.signal.aborted) setWorkspaceError('Error al cargar el espacio');
      }
    }

    void loadWorkspace();
    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    const update = () => setNow(Date.now());
    const timer = window.setInterval(update, 5_000);
    window.addEventListener('focus', update);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', update);
    };
  }, []);

  useEffect(() => {
    if (!today || workspace?.id !== id) return;

    const controller = new AbortController();
    const query = new URLSearchParams({ workspaceId: id });
    let pending = false;
    async function loadAvailability() {
      if (pending || document.hidden) return;
      pending = true;
      try {
        const response = await fetch(`/api/bookings/availability?${query}`, {
          cache: 'no-store', signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(response.status === 401 ? 'Tu sesión venció. Inicia sesión de nuevo.' : 'No se pudo consultar la disponibilidad.');
        }
        const days: Record<string, BookingHours> = await response.json();
        if (!controller.signal.aborted) setAvailability({ key: availabilityKey, days });
      } catch (failure) {
        if (!controller.signal.aborted) {
          setAvailability({
            key: availabilityKey,
            error: failure instanceof Error ? failure.message : 'No se pudo consultar la disponibilidad.',
          });
        }
      } finally {
        pending = false;
      }
    }

    void loadAvailability();
    const timer = window.setInterval(loadAvailability, 30_000);
    window.addEventListener('focus', loadAvailability);
    document.addEventListener('visibilitychange', loadAvailability);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      window.removeEventListener('focus', loadAvailability);
      document.removeEventListener('visibilitychange', loadAvailability);
    };
  }, [availabilityKey, id, today, workspace?.id]);

  useEffect(() => {
    const element = dialog.current;
    if (!review || !element) return;
    const previousOverflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [review]);

  function closeReview() {
    if (submitting) return;
    setReview(null);
    setReviewError('');
  }

  function choose(next: Selection) {
    setSelection(next);
    setError('');
  }

  function refreshAfterConflict(message: string) {
    setReview(null);
    setSelection((previous) => ({ ...previous, end: undefined }));
    setError(message);
    setRefresh((value) => value + 1);
    setSubmitting(false);
  }

  async function confirmBooking() {
    if (!review || submitting) return;
    const startTime = bookingHour(review.day, review.start);
    if (+startTime < Date.now()) {
      refreshAfterConflict('Ese horario ya pasó. Elige otro.');
      return;
    }
    if (hoursByDay && !hoursByDay[review.day]?.[review.start]?.includes(review.end)) {
      refreshAfterConflict('La disponibilidad cambió. Vuelve a elegir un horario.');
      return;
    }

    setReviewError('');
    setSubmitting(true);
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: id,
          startTime: startTime.toISOString(),
          endTime: bookingHour(review.day, review.end).toISOString(),
        }),
      });
      if (response.status === 409) {
        refreshAfterConflict('La disponibilidad cambió. Vuelve a elegir un horario.');
        return;
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al reservar');
      router.push('/mis-reservas');
    } catch (failure) {
      setReviewError(failure instanceof Error ? failure.message : 'Error al reservar');
      setSubmitting(false);
    }
  }

  if (workspaceError) {
    return (
      <Card className="space-y-4 p-6" role="alert">
        <p>{t(workspaceError)}</p>
        <Link href="/dashboard" className="text-sm font-semibold underline">{t('Volver al catálogo')}</Link>
      </Card>
    );
  }
  if (!workspace || workspace.id !== id || now === null) return <DetailSkeleton />;

  const locale = language === 'en' ? 'en' : 'es-CO';
  const formatters = {
    day: new Intl.DateTimeFormat(locale, { timeZone: BOOKING_TIME_ZONE, weekday: 'short' }),
    month: new Intl.DateTimeFormat(locale, { timeZone: BOOKING_TIME_ZONE, month: 'short' }),
    full: new Intl.DateTimeFormat(locale, { timeZone: BOOKING_TIME_ZONE, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
  };
  const dateLabel = (date: string) => formatters.full.format(bookingHour(date, 12));
  const durationLabel = (hours: number) => `${hours} ${t(hours === 1 ? 'hora' : 'horas')}`;
  const rangeLabel = (block: BookingBlock) => `${formatBookingHour(block.start)}–${String(block.end - 1).padStart(2, '0')}:59`;

  return (
    <div className="space-y-5">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
        <ArrowLeft size={16} aria-hidden="true" />{t('Volver al catálogo')}
      </Link>

      <WorkspaceSummary workspace={workspace} />

      <details className="group rounded-2xl border border-line bg-surface">
        <summary className="flex cursor-pointer list-none items-center gap-3 rounded-2xl p-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
          <Clock size={16} className="shrink-0 text-accent" aria-hidden="true" />
          <span className="flex-1">{t('¿Necesitas ayuda para encontrar un bloque de horas?')}</span>
          <ChevronDown size={16} className="shrink-0 group-open:rotate-180 motion-safe:transition-transform" aria-hidden="true" />
        </summary>
        <div className="space-y-3 border-t border-line p-4">
          <p className="text-xs text-muted">{t('Busca para este espacio desde hoy hasta siete días después.')}</p>
          <label className="flex flex-wrap items-center gap-2 text-sm font-medium">
            <span>{t('Buscar un bloque de')}</span>
            <select
              className={`${inputClass} max-w-40`}
              value={durationWanted}
              onChange={(event) => setDurationWanted(event.target.value === '' ? '' : Number(event.target.value))}
            >
              <option value="">{t('Elige la duración')}</option>
              {durations.map((duration) => <option key={duration} value={duration}>{durationLabel(duration)}</option>)}
            </select>
          </label>
          <div aria-live="polite">
            {durationWanted !== '' && !hoursByDay && (
              <p className="text-xs text-muted">{availabilityError ? t(availabilityError) : t('Consultando horarios…')}</p>
            )}
            {durationWanted !== '' && hoursByDay && (
              suggestions.length ? (
                <ul className="grid gap-2 sm:grid-cols-3">
                  {suggestions.map((block) => (
                    <li key={`${block.day}/${block.start}`}>
                      <a
                        href="#reserva-espacio"
                        onClick={() => choose(block)}
                        className="flex h-full flex-col gap-1 rounded-xl border border-line bg-background p-3 text-sm hover:border-accent focus-visible:outline-2 focus-visible:outline-accent"
                      >
                        <span className="text-xs capitalize text-muted">{dateLabel(block.day)}</span>
                        <span className="inline-flex items-center gap-2 font-semibold">
                          {rangeLabel(block)}
                          <ArrowRight size={14} aria-hidden="true" />
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-muted">{t('No hay bloques de esa duración en los próximos siete días.')}</p>
            )}
          </div>
        </div>
      </details>

      <section id="reserva-espacio" className="scroll-mt-20 rounded-3xl border border-line bg-surface p-3 shadow-xs sm:p-7">
        <form className="space-y-6" onSubmit={(event) => {
          event.preventDefault();
          if (start !== undefined && end !== undefined) setReview({ day, start, end });
        }}>
          <header className="flex items-center gap-3 border-b border-line pb-4">
            <CalendarDays size={24} className="text-accent" aria-hidden="true" />
            <div>
              <h2 className="font-heading text-xl font-semibold">{t('Reserva tu espacio')}</h2>
              <p className="mt-1 text-xs text-muted">{t('Horario de Colombia · 07:00–21:00')}</p>
            </div>
          </header>

          <fieldset className="min-w-0 space-y-3">
            <legend className="font-semibold">{t('Día de la reserva')}</legend>
            <div className="grid w-full grid-cols-5 gap-1 sm:gap-1.5">
              {days.map((date) => {
                const instant = bookingHour(date, 12);
                const options = hoursByDay?.[date];
                const full = options !== undefined && !Object.keys(options).some((hour) => date !== today || Number(hour) >= earliestHour);
                const selected = date === day;
                const status = full ? t('Sin cupo') : selected && options ? t('Disponible') : '';
                return (
                  <button
                    key={date}
                    type="button"
                    aria-pressed={selected}
                    aria-label={`${dateLabel(date)}${status ? `, ${status}` : ''}`}
                    onClick={() => choose({ day: date })}
                    className={`flex h-11 min-w-0 flex-col items-center justify-center rounded-lg border px-0.5 py-0.5 text-center text-[10px] leading-tight transition-colors focus-visible:outline-2 focus-visible:outline-accent sm:text-xs xl:flex-row xl:justify-between xl:gap-1.5 xl:px-2 ${selected ? 'border-accent' : 'border-line hover:border-accent'} ${full
                      ? 'bg-line/70 text-danger/90'
                      : selected ? 'bg-accent-soft text-ink' : 'bg-surface text-ink'}`}
                  >
                    <span className="capitalize">{date === today ? t('Hoy') : formatters.day.format(instant)}</span>
                    {selected && status && (
                      <span className={`whitespace-nowrap text-[9px] leading-none font-semibold sm:text-[10px] ${full ? 'text-danger' : 'text-success'}`}>
                        {status}
                      </span>
                    )}
                    <span className="inline-flex items-baseline gap-0.5 whitespace-nowrap">
                      <span className="font-heading text-sm font-semibold leading-none">{date.slice(-2)}</span>
                      <span>{formatters.month.format(instant)}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="space-y-4 border-t border-line pt-5">
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1.5 text-xs font-medium">
                <span>{t('Hora inicio')}</span>
                <select className={inputClass} value={start ?? ''} disabled={!starts.length} required onChange={(event) => {
                  choose({ day, start: event.target.value ? Number(event.target.value) : undefined });
                }}>
                  <option value="">{t('Elige la hora')}</option>
                  {starts.map((hour) => <option key={hour} value={hour}>{formatBookingHour(hour)}</option>)}
                </select>
              </label>
              <label className="space-y-1.5 text-xs font-medium">
                <span>{t('Última hora incluida')}</span>
                <select className={inputClass} value={end ?? ''} disabled={!ends.length} required onChange={(event) => {
                  choose({ day, start, end: event.target.value ? Number(event.target.value) : undefined });
                }}>
                  <option value="">{t('Elige la hora')}</option>
                  {ends.map((hour) => <option key={hour} value={hour}>{formatBookingHour(hour - 1)}</option>)}
                </select>
              </label>
            </div>
            <div role="status" className="space-y-2 text-xs text-muted">
              {!activeAvailability && <p className="flex items-center gap-2"><LoaderCircle size={14} className="motion-safe:animate-spin" aria-hidden="true" />{t('Consultando horarios…')}</p>}
              {availabilityError && (
                <div className="flex flex-wrap items-center gap-2">
                  <span>{t(availabilityError)}</span>
                  <button type="button" className="font-semibold underline" onClick={() => setRefresh((value) => value + 1)}>{t('Reintentar')}</button>
                </div>
              )}
              {hoursByDay && !starts.length && <p>{t('No quedan horarios para este día. Elige otro.')}</p>}
              {starts.length > 0 && unavailableStarts.length > 0 && (
                <p>{t('Inicios no disponibles')} · {unavailableStarts.map(formatBookingHour).join(', ')}</p>
              )}
            </div>

          </div>

          {error && <p role="alert" className="rounded-xl bg-danger-soft p-3 text-sm text-danger">{t(error)}</p>}

          <div className="flex flex-col gap-3 rounded-2xl bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
            <div aria-live="polite">
              <p className="text-xs font-medium text-muted">{t('Precio Total')}</p>
              <p className="mt-1 font-heading text-xl font-semibold">
                {totalHours ? `${totalHours * workspace.pricePerHour} € · ${durationLabel(totalHours)}` : '—'}
              </p>
            </div>
            <Button type="submit" disabled={!totalHours}>
              {t('Revisar reserva')}<ArrowRight size={15} aria-hidden="true" />
            </Button>
          </div>
        </form>
      </section>

      <dialog
        ref={dialog}
        aria-labelledby="booking-review-title"
        onCancel={(event) => {
          event.preventDefault();
          closeReview();
        }}
        className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_1.5rem)] max-w-xl overflow-y-auto rounded-3xl border border-line bg-surface p-4 text-ink shadow-xl backdrop:bg-ink/45 sm:p-6"
      >
        {review && (
          <div className="space-y-4">
            <h2 id="booking-review-title" className="font-heading text-xl font-semibold">{t('Confirma tu reserva')}</h2>
            <WorkspaceSummary workspace={workspace} compact />
            <dl className="grid grid-cols-2 gap-3 rounded-2xl bg-background p-4 text-sm">
              <div className="col-span-2">
                <dt className="text-muted">{t('Día de la reserva')}</dt>
                <dd className="font-semibold capitalize">{dateLabel(review.day)}</dd>
              </div>
              <div>
                <dt className="text-muted">{t('Horario')}</dt>
                <dd className="font-semibold">{rangeLabel(review)}</dd>
                <dd className="text-xs text-muted">{t('El espacio se libera a las {time}').replace('{time}', formatBookingHour(review.end))}</dd>
              </div>
              <div>
                <dt className="text-muted">{t('Duración')}</dt>
                <dd className="font-semibold">{durationLabel(review.end - review.start)}</dd>
              </div>
              <div className="col-span-2 flex items-center justify-between border-t border-line pt-3">
                <dt>{t('Precio Total')}</dt>
                <dd className="font-heading text-xl font-semibold">{(review.end - review.start) * workspace.pricePerHour} €</dd>
              </div>
            </dl>
            {reviewError && <p role="alert" className="rounded-xl bg-danger-soft p-3 text-sm text-danger">{t(reviewError)}</p>}
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="secondary" disabled={submitting} onClick={closeReview}>{t('Editar horario')}</Button>
              <Button type="button" disabled={submitting} onClick={confirmBooking}>
                {t(submitting ? 'Reservando...' : 'Confirmar Reserva')}
              </Button>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
