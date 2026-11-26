import { NextResponse, type NextRequest } from 'next/server';
import { ACCESS_COOKIE, clearAuthCookies, REFRESH_COOKIE, verifyRefreshToken } from '@/utils/auth';
import { authUnavailable, pageRedirect, privateResponse } from '@/lib/auth/http';
import { LOGIN_PATH, pageAccess, panelPath, renewalDestination, RENEW_PATH } from '@/lib/auth/paths';
import { getAccessSession, getRefreshSession } from '@/lib/auth/session';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const policy = pageAccess(pathname);
  if (policy === 'public') return privateResponse(NextResponse.next());

  try {
    const access = request.cookies.get(ACCESS_COOKIE)?.value;
    const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
    const session = await getAccessSession(access);
    if (session) {
      if (policy === 'guest' || (policy === 'admin' && session.role !== 'ADMIN')) {
        return pageRedirect(request, panelPath(session.role));
      }
      return privateResponse(NextResponse.next());
    }

    let clearCookies = Boolean(access || refresh);
    if (refresh) {
      const claims = await verifyRefreshToken(refresh);
      if (claims) {
        const { state } = await getRefreshSession(claims, refresh);
        if (state === 'active') {
          const params = new URLSearchParams({ returnTo: renewalDestination(pathname) });
          return pageRedirect(request, `${RENEW_PATH}?${params}`);
        }
        // Una respuesta con un token ya rotado no debe borrar las cookies recién emitidas.
        if (state === 'rotated') clearCookies = false;
      }
    }

    const response = policy === 'guest'
      ? privateResponse(NextResponse.next())
      : pageRedirect(request, LOGIN_PATH);
    if (clearCookies) clearAuthCookies(response);
    return response;
  } catch (error) {
    return authUnavailable('protección de página', error);
  }
}

export const config = {
  matcher: ['/login', '/register', '/sesion/renovar', '/dashboard/:path*', '/mis-reservas', '/admin/:path*'],
};
