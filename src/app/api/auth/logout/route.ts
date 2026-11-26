import { NextResponse, type NextRequest } from 'next/server';
import { ACCESS_COOKIE, clearAuthCookies, REFRESH_COOKIE } from '@/utils/auth';
import { authUnavailable, checkOrigin, privateResponse } from '@/lib/auth/http';
import { LOGIN_PATH, LOGOUT_QUERY } from '@/lib/auth/paths';
import { revokeSession } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const blocked = checkOrigin(request);
    if (blocked) return blocked;
    await revokeSession(
      request.cookies.get(REFRESH_COOKIE)?.value,
      request.cookies.get(ACCESS_COOKIE)?.value,
    );
    const response = request.headers.get('sec-fetch-mode') === 'navigate'
      ? new NextResponse(null, { status: 303, headers: { Location: `${LOGIN_PATH}?${LOGOUT_QUERY}=1` } })
      : new NextResponse(null, { status: 204 });
    clearAuthCookies(response);
    return privateResponse(response);
  } catch (error) {
    return authUnavailable('logout', error);
  }
}
