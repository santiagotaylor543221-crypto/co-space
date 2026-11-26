'use client';

import { Suspense, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import FormField from '@/components/ui/form-field';
import TextInput from '@/components/ui/text-input';
import Brand from '@/components/layout/brand';
import { publishSessionChange, replaceDocument, responseError, withSessionLock } from '@/lib/auth/client';
import { panelPath } from '@/lib/auth/paths';
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
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get('registered') === 'true';

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const pending = useRef(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending.current) return;
    const fields = new FormData(event.currentTarget);
    const credentials = { email: fields.get('email'), password: fields.get('password') };
    const fallback = 'Error al iniciar sesión';
    pending.current = true;
    setError('');
    setLoading(true);

    try {
      const send = () => fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const res = await withSessionLock(send);
      if (!res.ok) throw new Error(await responseError(res, fallback));

      const data: unknown = await res.json();
      if (typeof data !== 'object' || data === null || !('user' in data) ||
          typeof data.user !== 'object' || data.user === null || !('role' in data.user) ||
          (data.user.role !== 'USER' && data.user.role !== 'ADMIN')) {
        throw new Error(fallback);
      }
      publishSessionChange();
      replaceDocument(panelPath(data.user.role));
    } catch (error) {
      setError(t(error instanceof Error ? error.message : fallback));
      pending.current = false;
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
            <span>Solicitud de registro recibida. Intenta iniciar sesión.</span>
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

        <form action="/api/auth/login" method="post" onSubmit={handleSubmit} className="flex flex-col gap-5">
          <FormField label={t('Correo Electrónico')} htmlFor="email">
            <TextInput
              id="email"
              name="email"
              autoComplete="username"
              type="email"
              placeholder="tu@correo.com"
              hasError={Boolean(error)}
              required
            />
          </FormField>

          <FormField label={t('Contraseña')} htmlFor="password">
            <TextInput
              id="password"
              name="password"
              autoComplete="current-password"
              type="password"
              placeholder="••••••••"
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
          <Link prefetch={false} href="/register" className="font-semibold text-ink hover:underline">
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
