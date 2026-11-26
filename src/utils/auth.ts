import { randomUUID } from 'node:crypto';
import { SignJWT, jwtVerify, errors } from 'jose';
import type { NextResponse } from 'next/server';
import { z } from 'zod';

export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';
export const ACCESS_TTL = 15 * 60;
export const REFRESH_TTL = 7 * 24 * 60 * 60;

const issuer = 'cospace';
const algorithm = 'HS256';
const tokenClaims = z.object({
  sub: z.uuid(),
  sid: z.uuid(),
  jti: z.uuid(),
  exp: z.int(),
});

type TokenType = 'access' | 'refresh';
type Claims = z.infer<typeof tokenClaims>;

function tokenKey(type: TokenType) {
  const access = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
  const refresh = process.env.JWT_REFRESH_SECRET;
  if (!access || !refresh || Buffer.byteLength(access) < 32 || Buffer.byteLength(refresh) < 32 || access === refresh) {
    throw new Error('Configuración de claves JWT inválida');
  }
  return new TextEncoder().encode(type === 'access' ? access : refresh);
}

function tokenType(type: TokenType) {
  return `cospace-${type}+jwt`;
}

export async function generateTokens(userId: string, sessionId: string, sessionExpiresAt: number) {
  const now = Math.floor(Date.now() / 1000);
  const accessExpiresAt = Math.min(now + ACCESS_TTL, sessionExpiresAt);
  const sign = (type: TokenType, expiresAt: number) => new SignJWT({ sid: sessionId })
    .setProtectedHeader({ alg: algorithm, typ: tokenType(type) })
    .setSubject(userId)
    .setIssuer(issuer)
    .setAudience(type)
    .setJti(randomUUID())
    .setIssuedAt(now)
    .setExpirationTime(expiresAt)
    .sign(tokenKey(type));

  const [accessToken, refreshToken] = await Promise.all([
    sign('access', accessExpiresAt),
    sign('refresh', sessionExpiresAt),
  ]);
  return { accessToken, refreshToken, accessExpiresAt, sessionExpiresAt };
}

async function verifyToken(token: string | undefined, type: TokenType): Promise<Claims | null> {
  if (!token || token.length > 2048) return null;
  const key = tokenKey(type);
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: [algorithm],
      issuer,
      audience: type,
      typ: tokenType(type),
      requiredClaims: ['sub', 'sid', 'jti', 'iat', 'exp'],
      maxTokenAge: type === 'access' ? ACCESS_TTL : REFRESH_TTL,
    });
    const parsed = tokenClaims.safeParse(payload);
    return parsed.success ? parsed.data : null;
  } catch (error) {
    if (error instanceof errors.JOSEError) return null;
    throw error;
  }
}

export const verifyAccessToken = (token?: string) => verifyToken(token, 'access');
export const verifyRefreshToken = (token?: string) => verifyToken(token, 'refresh');

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  } as const;
}

export function setAuthCookies(response: NextResponse, tokens: Awaited<ReturnType<typeof generateTokens>>) {
  response.cookies.set(ACCESS_COOKIE, tokens.accessToken, {
    ...cookieOptions(), expires: new Date(tokens.accessExpiresAt * 1000),
  });
  response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
    ...cookieOptions(), expires: new Date(tokens.sessionExpiresAt * 1000),
  });
}

export function clearAuthCookies(response: NextResponse) {
  const expired = { ...cookieOptions(), expires: new Date(0), maxAge: 0 };
  response.cookies.set(ACCESS_COOKIE, '', expired);
  response.cookies.set(REFRESH_COOKIE, '', expired);
}
