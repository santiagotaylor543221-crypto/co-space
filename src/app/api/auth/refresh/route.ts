import { NextResponse, type NextRequest } from 'next/server';
import { clearAuthCookies, REFRESH_COOKIE, setAuthCookies, verifyRefreshToken } from '@/utils/auth';
import { authError, authUnavailable, checkOrigin, privateResponse } from '@/lib/auth/http';
import { REFRESH_ROTATED } from '@/lib/auth/paths';
import { enforceRateLimit } from '@/lib/auth/rate-limit';
import { getRefreshSession, rotateSession } from '@/lib/auth/session';

function expiredSession(clear: boolean) {
  const response = authError('La sesión ya no es válida. Inicia sesión de nuevo.', 401);
  if (clear) clearAuthCookies(response);
  else response.headers.set(REFRESH_ROTATED, '1');
  return response;
}

export async function POST(request: NextRequest) {
  try {
    const blocked = checkOrigin(request) ?? enforceRateLimit('refresh', request);
    if (blocked) return blocked;
    const token = request.cookies.get(REFRESH_COOKIE)?.value;
    if (!token) return expiredSession(true);
    const claims = await verifyRefreshToken(token);
    if (!claims) return expiredSession(true);
    const accountLimit = enforceRateLimit('refresh', request, claims.sub);
    if (accountLimit) return accountLimit;

    const session = await getRefreshSession(claims, token);
    if (session.state !== 'active') return expiredSession(session.state === 'inactive');

    const tokens = await rotateSession(claims, session.stored);
    if (!tokens) return authError('La sesión cambió durante la renovación.', 409);

    const response = privateResponse(new NextResponse(null, { status: 204 }));
    setAuthCookies(response, tokens);
    return response;
  } catch (error) {
    return authUnavailable('renovación', error);
  }
}
