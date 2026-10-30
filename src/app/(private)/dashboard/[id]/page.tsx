'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft, Calendar, Check, ShieldCheck } from 'lucide-react';
import WorkspaceImage from '@/components/workspace/workspace-image';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import Badge from '@/components/ui/badge';
import Skeleton from '@/components/ui/skeleton';
import { useI18n } from '@/lib/i18n';

interface Workspace {
  id: string;
  name: string;
  description: string;
  capacity: number;
  pricePerHour: number;
  imageUrl?: string;
  type?: 'DESK' | 'MEETING_ROOM' | 'BOOTH';
  location?: string;
  amenities?: string[];
}

// Horario comercial de 7:00 a 21:00
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7);
const formatHour = (hour: number) => `${String(hour).padStart(2, '0')}:00`;

export default function WorkspaceDetailPage() {
  const { t } = useI18n();

  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-6 w-32" />
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <Skeleton className="h-96 w-full rounded-3xl" />
            <Skeleton className="h-96 w-full rounded-3xl" />
          </div>
        </div>
      }
    >
      <WorkspaceDetailContent />
    </Suspense>
  );
}

function WorkspaceDetailContent() {
  const { t } = useI18n();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados del formulario de reserva
  const [date, setDate] = useState('');
  const [startHour, setStartHour] = useState(10);
  const [endHour, setEndHour] = useState(12);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        const res = await fetch(`/api/workspaces/${id}`);
        if (!res.ok) throw new Error('Error al cargar el espacio');
        const data = await res.json();
        setWorkspace(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar el espacio');
      } finally {
        setLoading(false);
      }
    };

    void fetchWorkspace();
  }, [id]);

  const handleStartChange = (value: number) => {
    setStartHour(value);
    if (endHour <= value) setEndHour(value + 1);
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: id,
          startTime: new Date(`${date}T${formatHour(startHour)}`).toISOString(),
          endTime: new Date(`${date}T${formatHour(endHour)}`).toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al reservar');

      router.push('/mis-reservas');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al reservar');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyles =
    'w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-xs text-ink outline-none transition focus:border-accent focus:ring-1 focus:ring-accent';
  const labelStyles = 'mb-1.5 block text-xs font-medium text-ink';

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-32" />
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Skeleton className="h-80 w-full rounded-3xl" />
          <Skeleton className="h-80 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="rounded-3xl border border-danger/30 bg-danger-soft p-8 text-center text-xs font-medium text-danger">
        {error || t('Espacio no encontrado')}
        <div className="mt-4">
          <Link href="/dashboard" className="text-ink font-semibold underline">
            {t('Volver al catálogo')}
          </Link>
        </div>
      </div>
    );
  }

  const totalHours = endHour - startHour;
  const totalPrice = totalHours * workspace.pricePerHour;

  return (
    <div className="space-y-6">
      {/* Botón de retroceso */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs text-muted transition hover:text-ink"
      >
        <ArrowLeft size={14} />
        <span>{t('Volver al catálogo')}</span>
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Columna izquierda: Imagen y detalles del espacio */}
        <div className="space-y-6">
          <div className="h-72 w-full overflow-hidden rounded-3xl border border-line bg-background sm:h-96">
            <WorkspaceImage
              imageUrl={workspace.imageUrl}
              type={workspace.type}
              alt={workspace.name}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="rounded-3xl border border-line bg-surface p-6 sm:p-8 space-y-5 shadow-xs">
            {workspace.location && (
              <Badge variant="neutral">
                {workspace.location}
              </Badge>
            )}

            <div>
              <h1 className="font-heading text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                {workspace.name}
              </h1>
              <p className="mt-2.5 text-sm text-muted leading-relaxed">
                {workspace.description}
              </p>
            </div>

            {workspace.amenities && workspace.amenities.length > 0 && (
              <div className="pt-4 border-t border-line">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
                  {t('Comodidades')}
                </h2>
                <ul className="grid gap-2.5 sm:grid-cols-2">
                  {workspace.amenities.map((amenity) => (
                    <li
                      key={amenity}
                      className="flex items-center gap-2 text-xs text-ink"
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-accent-soft text-ink">
                        <Check size={12} strokeWidth={2} />
                      </span>
                      <span>{amenity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Columna derecha: Formulario de reserva */}
        <aside>
          <Card className="rounded-3xl p-6 sm:p-8 shadow-sm sticky top-24">
            <form onSubmit={handleBooking} className="flex flex-col gap-5">
              <div className="flex items-center justify-between pb-4 border-b border-line">
                <div>
                  <h2 className="font-heading text-base font-semibold text-ink">
                    {t('Reserva tu espacio')}
                  </h2>
                  <p className="text-[11px] text-muted">Confirmación inmediata</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-background border border-line">
                  <Calendar size={16} className="text-muted" />
                </div>
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-xs font-medium text-danger"
                >
                  {error}
                </p>
              )}

              <div>
                <label htmlFor="date" className={labelStyles}>
                  {t('Fecha')}
                </label>
                <input
                  id="date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputStyles}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="startHour" className={labelStyles}>
                    {t('Hora inicio')}
                  </label>
                  <select
                    id="startHour"
                    value={startHour}
                    onChange={(e) => handleStartChange(Number(e.target.value))}
                    className={inputStyles}
                  >
                    {HOURS.slice(0, -1).map((hour) => (
                      <option key={hour} value={hour}>
                        {formatHour(hour)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="endHour" className={labelStyles}>
                    {t('Hora fin')}
                  </label>
                  <select
                    id="endHour"
                    value={endHour}
                    onChange={(e) => setEndHour(Number(e.target.value))}
                    className={inputStyles}
                  >
                    {HOURS.filter((hour) => hour > startHour).map((hour) => (
                      <option key={hour} value={hour}>
                        {formatHour(hour)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cálculo del precio total */}
              <div className="flex items-end justify-between border-t border-line pt-5 mt-2">
                <div>
                  <p className="text-xs font-medium text-muted">{t('Precio Total')}</p>
                  <p className="text-[11px] text-muted mt-0.5">
                    {totalHours} {t(totalHours === 1 ? 'hora' : 'horas')} × {workspace.pricePerHour} €
                  </p>
                </div>
                <p className="font-heading text-3xl font-semibold text-ink">
                  {totalPrice} €
                </p>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                variant="primary"
                className="w-full py-3 mt-2 shadow-xs"
              >
                {submitting ? t('Reservando...') : t('Confirmar Reserva')}
                {!submitting && <ArrowRight size={15} />}
              </Button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted pt-2 border-t border-line">
                <ShieldCheck size={14} className="text-accent" />
                <span>{t('Pago seguro · Cancelación flexible')}</span>
              </div>
            </form>
          </Card>
        </aside>
      </div>
    </div>
  );
}