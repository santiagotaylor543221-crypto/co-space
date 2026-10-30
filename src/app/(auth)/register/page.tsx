'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import FormField from '@/components/ui/form-field';
import TextInput from '@/components/ui/text-input';
import Brand from '@/components/layout/brand';
import { useI18n } from '@/lib/i18n';

// Pantalla de registro limpia, con tarjeta centrada sobre fondo claro y feedback visual
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

      // Registro exitoso, redirigimos a login con parámetro para mostrar confirmación
      router.push('/login?registered=true');
    } catch (err: unknown) {
      setError(err instanceof Error ? t(err.message) : t('Error al registrarse'));
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <FormField label={t('Nombre Completo')} htmlFor="name">
            <TextInput
              id="name"
              type="text"
              required
              placeholder="Marina Santos"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              hasError={Boolean(error)}
            />
          </FormField>

          <FormField label={t('Correo Electrónico')} htmlFor="email">
            <TextInput
              id="email"
              type="email"
              required
              placeholder="tu@correo.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              hasError={Boolean(error)}
            />
          </FormField>

          <FormField label={t('Contraseña')} htmlFor="password">
            <TextInput
              id="password"
              type="password"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              hasError={Boolean(error)}
            />
          </FormField>

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
          <Link href="/login" className="font-semibold text-ink hover:underline">
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