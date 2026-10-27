'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import FormField from '@/components/ui/form-field';
import TextInput from '@/components/ui/text-input';

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

  return (
    <main className="flex w-full flex-col items-center justify-center">
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

      <Card className="w-full max-w-sm rounded-2xl p-5 sm:p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400"
            >
              {error}
            </p>
          )}

          <FormField label="Correo Electrónico" htmlFor="email">
            <TextInput
              id="email"
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Contraseña" htmlFor="password">
            <TextInput
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </FormField>

          <Button
            type="submit"
            disabled={loading}
            className="w-full py-3"
          >
            {loading ? 'Iniciando sesión...' : 'Entrar'}
            {!loading && <ArrowRight size={14} />}
          </Button>
        </form>

        <footer className="mt-5 border-t border-white/10 pt-4 text-center text-[11px] text-zinc-500">
          ¿No tienes cuenta?{' '}
          <Link href="/register" className="font-semibold text-white hover:underline">
            Regístrate
          </Link>
        </footer>
      </Card>

      <Link
        href="/"
        className="mt-6 text-[11px] text-zinc-500 transition hover:text-white"
      >
        ← Volver al inicio
      </Link>
    </main>
  );
}