'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      // El backend ya inyectó la cookie segura. Redirigimos según el rol.
      if (data.user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const inputStyles =
    'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-xs text-white placeholder:text-zinc-500 outline-none transition focus:border-white/30';

  const labelStyles = 'mb-2 block text-[10px] font-medium text-zinc-400';

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#09090b] px-4 py-10">
      <header className="mb-8 text-center">
        <p className="mb-10 text-sm font-semibold text-white">
          <span className="text-zinc-400">Co</span>Space
        </p>
        <p className="mb-2 text-[9px] uppercase tracking-[0.25em] text-zinc-600">
          Bienvenido a CoSpace
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Iniciar sesión
        </h1>
        <p className="mt-2 text-xs text-zinc-500">
          Inicia sesión para gestionar tus reservas.
        </p>
      </header>

      <section className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400"
            >
              {error}
            </p>
          )}

          <div>
            <label htmlFor="email" className={labelStyles}>
              Correo Electrónico
            </label>
            <input
              id="email"
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputStyles}
            />
          </div>

          <div>
            <label htmlFor="password" className={labelStyles}>
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={inputStyles}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-white py-3 text-xs font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
          >
            {loading ? 'Iniciando sesión...' : 'Entrar'}
            {!loading && <ArrowRight size={14} />}
          </button>
        </form>

        <footer className="mt-5 border-t border-white/10 pt-4 text-center text-[11px] text-zinc-500">
          ¿No tienes cuenta?{' '}
          <Link href="/register" className="font-semibold text-white hover:underline">
            Regístrate
          </Link>
        </footer>
      </section>

      <Link
        href="/"
        className="mt-6 text-[11px] text-zinc-500 transition hover:text-white"
      >
        ← Volver al inicio
      </Link>
    </main>
  );
}