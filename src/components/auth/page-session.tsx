import { Suspense, type ReactNode } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAccessSession } from '@/lib/auth/session';
import { LOGIN_PATH, panelPath } from '@/lib/auth/paths';
import { ACCESS_COOKIE } from '@/utils/auth';

type Props = Readonly<{ policy: 'guest' | 'admin' | 'private'; children: ReactNode }>;

async function CheckPageSession({ policy, children }: Props) {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  const session = await getAccessSession(token).catch(() => {
    throw new Error('No se pudo validar la sesión');
  });

  if (policy === 'guest') {
    if (session) redirect(panelPath(session.role));
  } else {
    if (!session) redirect(LOGIN_PATH);
    if (policy === 'admin' && session.role !== 'ADMIN') redirect(panelPath(session.role));
  }
  return children;
}

export default function PageSession(props: Props) {
  return <Suspense fallback={null}><CheckPageSession {...props} /></Suspense>;
}
