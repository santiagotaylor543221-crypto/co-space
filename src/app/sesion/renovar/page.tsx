'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Button from '@/components/ui/button';
import { refreshAccess, replaceDocument, responseError } from '@/lib/auth/client';
import { LOGIN_PATH, renewalDestination } from '@/lib/auth/paths';

const loadingMessage = 'Renovando tu sesión…';

function Renewal() {
  const destination = renewalDestination(useSearchParams().get('returnTo'));
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const renew = async () => {
      try {
        const response = await refreshAccess();
        if (!active) return;
        if (response.ok || response.status === 401) {
          replaceDocument(response.ok ? destination : LOGIN_PATH);
          return;
        }
        const message = await responseError(response, 'No se pudo renovar la sesión.');
        if (active) setError(message);
      } catch {
        if (active) setError('No se pudo renovar la sesión. Verifica tu conexión.');
      }
    };
    void renew();
    return () => { active = false; };
  }, [attempt, destination]);

  if (!error) return <p role="status">{loadingMessage}</p>;
  return (
    <div className="space-y-4">
      <p role="alert">{error}</p>
      <Button type="button" onClick={() => { setError(''); setAttempt(attempt + 1); }}>
        Reintentar
      </Button>
    </div>
  );
}

export default function RenewalPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 font-body text-ink">
      <Suspense fallback={<p role="status">{loadingMessage}</p>}><Renewal /></Suspense>
    </main>
  );
}
