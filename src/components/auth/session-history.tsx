'use client';

import { useEffect } from 'react';
import { getSessionChannel, publishSessionChange } from '@/lib/auth/client';
import { LOGIN_PATH, LOGOUT_QUERY, pageAccess, RENEW_PATH } from '@/lib/auth/paths';

export default function SessionHistory() {
  useEffect(() => {
    const sensitivePage = () => {
      const { pathname } = window.location;
      return pageAccess(pathname) !== 'public' || pathname === RENEW_PATH;
    };
    const hide = () => { document.documentElement.style.visibility = 'hidden'; };
    const revalidate = () => {
      if (!sensitivePage()) return;
      hide();
      window.location.reload();
    };
    const pageHide = () => { if (sensitivePage()) hide(); };
    const pageShow = (event: PageTransitionEvent) => { if (event.persisted) revalidate(); };

    const channel = getSessionChannel();
    channel?.addEventListener('message', revalidate);
    window.addEventListener('pagehide', pageHide);
    window.addEventListener('pageshow', pageShow);
    window.addEventListener('popstate', revalidate);

    // El POST nativo del formulario puede completarse antes de que hidrate React.
    const current = new URL(window.location.href);
    if (current.pathname === LOGIN_PATH && current.searchParams.get(LOGOUT_QUERY) === '1') {
      current.searchParams.delete(LOGOUT_QUERY);
      window.history.replaceState(window.history.state, '', current);
      publishSessionChange();
    }

    return () => {
      channel?.removeEventListener('message', revalidate);
      window.removeEventListener('pagehide', pageHide);
      window.removeEventListener('pageshow', pageShow);
      window.removeEventListener('popstate', revalidate);
    };
  }, []);

  return null;
}
