'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export default function RegisterPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al registrarse');
      }

      // Registro exitoso, lo enviamos al login
      router.push('/login?registered=true');
    } catch (err: unknown) {
      setError(err instanceof Error ? t(err.message) : t('Error al registrarse'));
    } finally {
      setLoading(false);
    }
  };

  const labelStyles = 'mb-2 block text-[10px] font-medium text-zinc-400';
  const inputStyles =
    'w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3.5 text-xs text-white placeholder:text-zinc-600 outline-none transition focus:border-white/30';

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center bg-[#08080a] px-4 py-10 font-sans"
      style={{
        backgroundImage:
          'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
      }}
    >
      {/* Logo */}
      <Link href="/" className="mb-10 text-lg font-semibold tracking-tight text-white">
        <span className="font-normal text-zinc-300">Co</span>Space
      </Link>

      {/* Encabezado */}
      <div className="mb-8 text-center">
        <p className="mb-3 text-[8px] uppercase tracking-[0.3em] text-zinc-600">{t('Únete a CoSpace')}</p>
        <h1 className="text-4xl font-semibold tracking-tight text-white">{t('Crear cuenta')}</h1>
        <p className="mt-3 text-xs text-zinc-500">{t('Empieza a trabajar a tu manera.')}</p>
      </div>

      {/* Tarjeta */}
      <div className="w-full max-w-[315px] rounded-2xl border border-white/10 bg-[#0e0e10] p-5">
        {error && (
          <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-[10px] text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label htmlFor="name" className={labelStyles}>
              {t('Nombre Completo')}
            </label>
            <input
              id="name"
              type="text"
              required
              placeholder="Marina Santos"
              className={inputStyles}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="email" className={labelStyles}>
              {t('Correo Electrónico')}
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="tu@correo.com"
              className={inputStyles}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="password" className={labelStyles}>
              {t('Contraseña')}
            </label>
            <input
              id="password"
              type="password"
              required
              placeholder="••••••••"
              className={inputStyles}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-xs font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
          >
            {loading ? t('Procesando...') : t('Registrarse')}
            {!loading && <ArrowRight size={14} />}
          </button>
        </form>

        <div className="mt-5 border-t border-white/10 pt-5 text-center text-[10px] text-zinc-500">
          {t('¿Ya tienes cuenta?')}{' '}
          <Link href="/login" className="font-semibold text-white transition hover:underline">
            {t('Inicia sesión')}
          </Link>
        </div>
      </div>

      <Link
        href="/"
        className="mt-8 flex items-center gap-1.5 text-[10px] text-zinc-600 transition hover:text-zinc-400"
      >
        <ArrowLeft size={10} />
        {t('Volver al inicio')}
      </Link>
    </div>
  );
}