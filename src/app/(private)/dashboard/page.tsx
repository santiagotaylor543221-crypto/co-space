'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users } from 'lucide-react';
import WorkspaceImage from '@/components/workspace/workspace-image';
import { useI18n } from '@/lib/i18n';

interface Workspace {
  id: string;
  name: string;
  description: string;
  capacity: number;
  pricePerHour: number;
  imageUrl?: string;
  type?: 'DESK' | 'MEETING_ROOM' | 'BOOTH';
}

export default function DashboardPage() {
  const { t } = useI18n();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const res = await fetch('/api/workspaces');
        const data = await res.json();
        setWorkspaces(data);
      } catch (error) {
        console.error('Error cargando espacios:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaces();
  }, []);

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
            {t('Descubre tu espacio')}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            {t('Espacios Disponibles')}
          </h1>
        </div>

        <p className="max-w-[200px] text-[11px] leading-relaxed text-zinc-500 sm:text-right">
          {t('Selecciona un espacio que se adapte a tu forma de trabajar.')}
        </p>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {workspaces.map((workspace) => (
          <Link key={workspace.id} href={`/dashboard/${workspace.id}`}>
            <article className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition hover:border-white/20">
              <div className="relative h-44 w-full bg-zinc-900">
                <WorkspaceImage
                  imageUrl={workspace.imageUrl}
                  type={workspace.type}
                  alt={workspace.name}
                  className="h-full w-full object-cover"
                />
                <span className="absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-[8px] font-medium uppercase tracking-widest text-white">
                  {t('Disponible')}
                </span>
              </div>

              <div className="flex items-start justify-between px-4 py-4">
                <div>
                  <h2 className="text-sm font-semibold text-white">{workspace.name}</h2>
                  <p className="mt-1.5 flex items-center gap-1.5 text-[10px] text-zinc-500">
                    <Users size={12} />
                    {workspace.capacity} {t(workspace.capacity === 1 ? 'persona' : 'personas')}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{workspace.pricePerHour} €</p>
                  <p className="mt-1.5 text-[9px] text-zinc-600">{t('/ hora')}</p>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </section>

      {workspaces.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/10 py-20 text-center">
          <p className="text-xs text-zinc-500">{t('No hay espacios disponibles en este momento.')}</p>
        </div>
      )}
    </div>
  );
}