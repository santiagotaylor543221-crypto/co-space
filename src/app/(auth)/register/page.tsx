'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import FormField from '@/components/ui/form-field';
import TextInput from '@/components/ui/text-input';
import Brand from '@/components/layout/brand';
import { responseError } from '@/lib/auth/client';
import { useI18n } from '@/lib/i18n';

// Pantalla de registro limpia, con tarjeta centrada sobre fondo claro y feedback visual
export default function RegisterPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const pending = useRef(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending.current) return;
    const fields = new FormData(event.currentTarget);
    const credentials = { name: fields.get('name'), email: fields.get('email'), password: fields.get('password') };
    const fallback = 'Error al registrarse';
    pending.current = true;
    setError('');
    setLoading(true);

    try {
      const send = () => fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const res = await send();
      if (!res.ok) throw new Error(await responseError(res, fallback));

      router.replace('/login?registered=true');
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
          {t('Únete a CoSpace')}
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {t('Crear cuenta')}
        </h1>
        <p className="mt-2 text-xs text-muted max-w-xs">
          {t('Empieza a trabajar a tu manera.')}
        </p>
      </header>

      {/* Tarjeta de registro */}
      <Card className="w-full rounded-3xl p-6 sm:p-8 shadow-sm">
        {error && (
          <p
            role="alert"
            className="mb-5 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-xs font-medium text-danger"
          >
            {error}
          </p>
        )}

        <form action="/api/auth/register" method="post" onSubmit={handleSubmit} className="flex flex-col gap-5">
          <FormField label={t('Nombre Completo')} htmlFor="name">
            <TextInput
              id="name"
              name="name"
              autoComplete="name"
              maxLength={120}
              type="text"
              required
              placeholder="Marina Santos"
              hasError={Boolean(error)}
            />
          </FormField>

          <FormField label={t('Correo Electrónico')} htmlFor="email">
            <TextInput
              id="email"
              name="email"
              autoComplete="username"
              type="email"
              required
              placeholder="tu@correo.com"
              hasError={Boolean(error)}
            />
          </FormField>

          <FormField label={t('Contraseña')} htmlFor="password">
            <TextInput
              id="password"
              name="password"
              autoComplete="new-password"
              minLength={8}
              aria-describedby="password-policy"
              type="password"
              required
              placeholder="••••••••"
              hasError={Boolean(error)}
            />
          </FormField>

          <p id="password-policy" className="-mt-3 text-xs text-muted">
            {t('Usa al menos 8 caracteres y un máximo de 72 bytes (UTF-8).')}
          </p>

          <Button
            type="submit"
            disabled={loading}
            variant="primary"
            className="w-full py-3 mt-2 shadow-xs"
          >
            {loading ? t('Procesando...') : t('Registrarse')}
            {!loading && <ArrowRight size={15} />}
          </Button>
        </form>

        <footer className="mt-6 border-t border-line pt-5 text-center text-xs text-muted">
          {t('¿Ya tienes cuenta?')}{' '}
          <Link prefetch={false} href="/login" className="font-semibold text-ink hover:underline">
            {t('Inicia sesión')}
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
