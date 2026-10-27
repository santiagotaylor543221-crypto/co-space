'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, Calendar, Check, ShieldCheck } from 'lucide-react';
import WorkspaceImage from '@/components/workspace/workspace-image';

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

// Horario de 7:00 a 21:00
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7);

const formatHour = (hour: number) => `${String(hour).padStart(2, '0')}:00`;

export default function WorkspaceDetailPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[50vh] items-center justify-center">
          <p className="text-xs text-zinc-500">Cargando espacio...</p>
        </main>
      }
    >
      <WorkspaceDetailContent />
    </Suspense>
  );
}

function WorkspaceDetailContent() {
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
    // Si la hora fin queda antes o igual al inicio, la movemos una hora después
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
    'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-[10px] text-white outline-none transition focus:border-white/30 [color-scheme:dark]';

  const labelStyles = 'mb-2 block text-[9px] font-medium text-zinc-400';

  if (loading) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center">
        <p className="text-xs text-zinc-500">Cargando espacio...</p>
      </main>
    );
  }

  if (!workspace) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center px-4">
        <p role="alert" className="text-xs text-red-400">
          {error || 'Espacio no encontrado'}
        </p>
      </main>
    );
  }

  const totalHours = endHour - startHour;
  const totalPrice = totalHours * workspace.pricePerHour;

  return (
    <div className="py-10">
      <Link
        href="/dashboard"
        className="mb-6 inline-block text-[9px] text-zinc-500 transition hover:text-white"
      >
        ← Volver al catálogo
      </Link>

          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            {/* Imagen + información */}
            <div>
              <div className="h-64 w-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 sm:h-[352px]">
                <WorkspaceImage
                  imageUrl={workspace.imageUrl}
                  type={workspace.type}
                  alt={workspace.name}
                  className="h-full w-full object-cover"
                />
              </div>

              <section className="mt-8 px-1">
                {workspace.location && (
                  <p className="mb-3 flex items-center gap-3 text-[8px] uppercase tracking-[0.25em] text-zinc-500">
                    <span className="h-px w-5 bg-zinc-600" />
                    {workspace.location}
                  </p>
                )}

                <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  {workspace.name}
                </h1>

                <p className="mt-3 max-w-xl text-xs leading-relaxed text-zinc-400">
                  {workspace.description}
                </p>

                {workspace.amenities && workspace.amenities.length > 0 && (
                  <div className="mt-8">
                    <h2 className="text-xs font-semibold text-white">Comodidades</h2>
                    <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                      {workspace.amenities.map((amenity) => (
                        <li
                          key={amenity}
                          className="flex items-center gap-2 text-[10px] text-zinc-400"
                        >
                          <Check size={11} className="text-zinc-500" />
                          {amenity}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            </div>

            {/* Formulario de reserva */}
            <aside className="h-fit rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <form onSubmit={handleBooking} className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-[8px] uppercase tracking-[0.25em] text-zinc-500">
                    Reserva tu espacio
                  </h2>
                  <Calendar size={14} className="text-zinc-400" />
                </div>

                {error && (
                  <p
                    role="alert"
                    className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-[10px] text-red-400"
                  >
                    {error}
                  </p>
                )}

                <div>
                  <label htmlFor="date" className={labelStyles}>
                    Fecha
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
                      Hora inicio
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
                      Hora fin
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

                <div className="flex items-end justify-between border-t border-white/10 pt-4">
                  <div>
                    <p className="text-[9px] text-zinc-400">Precio Total</p>
                    <p className="mt-1 text-[8px] text-zinc-600">
                      {totalHours} {totalHours === 1 ? 'hora' : 'horas'} × {workspace.pricePerHour} €
                    </p>
                  </div>
                  <p className="text-2xl font-semibold text-white">{totalPrice} €</p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-white py-3 text-xs font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
                >
                  {submitting ? 'Reservando...' : 'Confirmar Reserva'}
                  {!submitting && <ArrowRight size={14} />}
                </button>

                <p className="flex items-center justify-center gap-1.5 text-[8px] text-zinc-600">
                  <ShieldCheck size={11} />
                  Pago seguro · Cancelación flexible
                </p>
              </form>
            </aside>
          </div>
    </div>
  );
}