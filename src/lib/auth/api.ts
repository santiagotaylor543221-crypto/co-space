import { cookies } from 'next/headers';
import type { Role } from '@prisma/client';
import { ACCESS_COOKIE } from '@/utils/auth';
import { authError, authUnavailable, checkOrigin, privateResponse } from './http';
import { SESSION_REQUIRED } from './paths';
import { getAccessSession } from './session';

type ApiUser = NonNullable<Awaited<ReturnType<typeof getAccessSession>>>;

async function withApiSession(
  request: Request,
  role: Role | null,
  handler: (user: ApiUser) => Promise<Response>,
) {
  const cookieStore = await cookies();
  let user: ApiUser | null;
  try {
    user = await getAccessSession(cookieStore.get(ACCESS_COOKIE)?.value);
  } catch (error) {
    return authUnavailable('protección de API', error);
  }

  if (!user) {
    const response = authError('No autorizado. Inicia sesión.', 401);
    response.headers.set(SESSION_REQUIRED, '1');
    return response;
  }
  if (role && user.role !== role) return authError('Acceso denegado.', 403);
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    try {
      const blocked = checkOrigin(request);
      if (blocked) return blocked;
    } catch (error) {
      return authUnavailable('protección de origen', error);
    }
  }
  return privateResponse(await handler(user));
}

export function protectApi<R extends Request, Args extends unknown[]>(
  role: Role | null,
  handler: (user: ApiUser, request: R, ...args: Args) => Promise<Response>,
) {
  return (request: R, ...args: Args) => withApiSession(request, role, (user) => handler(user, request, ...args));
}
