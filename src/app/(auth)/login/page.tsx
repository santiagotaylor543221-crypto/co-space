'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import FormField from '@/components/ui/form-field';
import TextInput from '@/components/ui/text-input';
import Brand from '@/components/layout/brand';
import { useI18n } from '@/lib/i18n';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center text-xs text-muted">Cargando...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}

function LoginFormContent() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get('registered') === 'true';

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

      // Redirección según rol conservando la cookie HTTP-Only inyectada por el servidor
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
    <main className="flex w-full flex-col items-center">
      {/* Cabecera centrada con logotipo */}
      <header className="mb-8 text-center flex flex-col items-center">
        <div className="mb-6">
          <Brand />
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-accent mb-2">
          {t('Bienvenido a CoSpace')}
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {t('Iniciar sesión')}
        </h1>
        <p className="mt-2 text-xs text-muted max-w-xs">
          {t('Inicia sesión para gestionar tus reservas.')}
        </p>
      </header>

      {/* Tarjeta de formulario con superficie blanca y sombra suave */}
      <Card className="w-full rounded-3xl p-6 sm:p-8 shadow-sm">
        {/* Aviso de registro completado */}
        {justRegistered && !error && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-success/30 bg-success-soft px-4 py-3 text-xs text-success">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>Cuenta creada correctamente. Ya puedes iniciar sesión.</span>
          </div>
        )}

        {/* Mensaje de error de validación */}
        {error && (
          <p
            role="alert"
            className="mb-5 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-xs font-medium text-danger"
          >
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <FormField label={t('Correo Electrónico')} htmlFor="email">
            <TextInput
              id="email"
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              hasError={Boolean(error)}
              required
            />
          </FormField>

          <FormField label={t('Contraseña')} htmlFor="password">
            <TextInput
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              hasError={Boolean(error)}
              required
            />
          </FormField>

          <Button
            type="submit"
            disabled={loading}
            variant="primary"
            className="w-full py-3 mt-2 shadow-xs"
          >
            {loading ? t('Iniciando sesión...') : t('Entrar')}
            {!loading && <ArrowRight size={15} />}
          </Button>
        </form>

        <footer className="mt-6 border-t border-line pt-5 text-center text-xs text-muted">
          {t('¿No tienes cuenta?')}{' '}
          <Link href="/register" className="font-semibold text-ink hover:underline">
            {t('Regístrate')}
          </Link>
        </footer>
      </Card>

      <Link
        href="/"
        className="mt-6 flex items-center gap-1.5 text-xs text-muted transition hover:text-ink"
      >
        <ArrowLeft size={13} />
        <span>{t('Volver al inicio')}</span>
      </Link>
    </main>
  );
}