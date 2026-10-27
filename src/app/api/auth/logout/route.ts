import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const response = NextResponse.redirect(new URL('/login', req.url));
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0),
    path: '/',
  } as const;

  response.cookies.set('access_token', '', cookieOptions);
  response.cookies.set('refresh_token', '', cookieOptions);
  return response;
}