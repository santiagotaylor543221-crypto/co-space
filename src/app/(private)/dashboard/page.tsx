'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Workspace {
  id: string;
  name: string;
  description: string;
  capacity: number;
  pricePerHour: number;
}

export default function DashboardPage() {
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
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-100 mb-2">Catálogo de Espacios</h1>
        <p className="text-gray-400">Encuentra y reserva el entorno ideal para tu próxima sesión de trabajo.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workspaces.map((workspace) => (
          <Link
            href={`/dashboard/${workspace.id}`}
            key={workspace.id}
            className="group block"
          >
            <div className="h-full p-6 rounded-2xl bg-gray-900/40 border border-gray-800/60 backdrop-blur-xl hover:bg-gray-800/60 hover:border-indigo-500/50 transition-all duration-300 relative overflow-hidden">

              {/* Brillo sutil al hacer hover */}
              <div className="absolute -inset-px bg-gradient-to-r from-indigo-500/0 via-indigo-500/10 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold text-gray-100 group-hover:text-indigo-400 transition-colors">
                    {workspace.name}
                  </h2>
                  <span className="px-3 py-1 text-xs font-semibold bg-gray-800 text-gray-300 rounded-full border border-gray-700">
                    {workspace.capacity} pax
                  </span>
                </div>

                <p className="text-gray-400 text-sm mb-6 line-clamp-2">
                  {workspace.description}
                </p>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-800/50">
                  <div className="text-gray-200">
                    <span className="text-2xl font-extrabold text-white">${workspace.pricePerHour}</span>
                    <span className="text-sm text-gray-500"> / hora</span>
                  </div>
                  <div className="text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0 duration-300">
                    Reservar &rarr;
                  </div>
                </div>
              </div>

            </div>
          </Link>
        ))}
      </div>

      {workspaces.length === 0 && (
        <div className="text-center py-20 bg-gray-900/20 rounded-2xl border border-gray-800/50 border-dashed">
          <p className="text-gray-500">No hay espacios disponibles en este momento.</p>
        </div>
      )}
    </div>
  );
}