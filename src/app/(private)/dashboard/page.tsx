'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, ArrowRight, LayoutGrid } from 'lucide-react';
import WorkspaceImage from '@/components/workspace/workspace-image';
import Badge from '@/components/ui/badge';
import EmptyState from '@/components/ui/empty-state';
import Skeleton from '@/components/ui/skeleton';
import { useI18n } from '@/lib/i18n';
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
}

export default function DashboardPage() {
  const { t } = useI18n();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const res = await fetch('/api/workspaces', { cache: 'no-store' });
        if (!res.ok) throw new Error('Error al cargar espacios');
        const data = await res.json();
        setWorkspaces(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al cargar los espacios');
      } finally {
        setLoading(false);
      }
    };

    void fetchWorkspaces();
  }, []);

  return (
    <div className="space-y-8">
      {/* Encabezado de la vista */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pb-6 border-b border-line">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-accent mb-2">
            {t('Descubre tu espacio')}
          </p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {t('Espacios Disponibles')}
          </h1>
          <p className="mt-2 text-xs text-muted max-w-xl">
            {t('Selecciona un espacio que se adapte a tu forma de trabajar.')}
          </p>
        </div>
      </section>

      {/* Alerta de error si falla la API */}
      {error && (
        <div className="rounded-2xl border border-danger/30 bg-danger-soft p-4 text-xs font-medium text-danger">
          {error}
        </div>
      )}

      {/* Estado de carga con Skeletons */}
      {loading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} className="rounded-2xl border border-line bg-surface p-4 space-y-4">
              <Skeleton className="h-44 w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grid de tarjetas de espacios */}
      {!loading && !error && workspaces.length > 0 && (
        <section className="grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((workspace) => (
            <Link key={workspace.id} href={`/dashboard/${workspace.id}`} className="group block min-w-0 rounded-2xl">
              <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-md">
                {/* Imagen del espacio */}
                <div className="relative h-48 w-full shrink-0 overflow-hidden border-b border-line bg-background">
                  <WorkspaceImage
                    imageUrl={catalogWorkspaceImage(workspace.name, workspace.type, workspace.imageUrl)}
                    type={workspace.type}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Badge de disponibilidad */}
                  <div className="absolute left-3 top-3">
                    <Badge variant="success">
                      {t('Disponible')}
                    </Badge>
                  </div>
                </div>

                {/* Información y tarifa */}
                <div className="flex flex-1 flex-col p-5">
                  <div>
                    <h2 className="line-clamp-2 min-h-[2lh] font-heading text-base leading-snug font-semibold wrap-break-word text-ink transition-colors group-hover:text-accent">
                      {workspace.name}
                    </h2>
                    <p className="mt-1 line-clamp-3 min-h-[3lh] text-xs leading-relaxed wrap-break-word text-muted">
                      {workspace.description}
                    </p>
                  </div>

                  <div className="mt-auto pt-6">
                    <div className="flex items-center justify-between gap-2 border-t border-line pt-4">
                      <div className="flex items-center gap-1.5 text-xs text-muted">
                        <Users size={14} className="text-muted" />
                        <span>
                          {workspace.capacity} {t(workspace.capacity === 1 ? 'persona' : 'personas')}
                        </span>
                      </div>

                      <div className="text-right flex items-center gap-2">
                        <div>
                          <span className="font-heading text-base font-semibold text-ink">
                            {workspace.pricePerHour} €
                          </span>
                          <span className="text-[10px] text-muted ml-1">{t('/ hora')}</span>
                        </div>
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-background border border-line text-ink group-hover:bg-accent group-hover:border-accent transition">
                          <ArrowRight size={13} />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </section>
      )}

      {/* Estado vacío cuando no hay espacios */}
      {!loading && !error && workspaces.length === 0 && (
        <EmptyState
          icon={LayoutGrid}
          title={t('No hay espacios disponibles en este momento.')}
          description="Vuelve a consultar en unos minutos o contacta con el equipo de soporte."
        />
      )}
    </div>
  );
}
