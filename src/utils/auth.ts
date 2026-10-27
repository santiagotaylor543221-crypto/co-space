import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { cookies } from 'next/headers';

// Tipado estricto exigido por la rúbrica (Cero any)
export interface TokenPayload {
  id: string;
  email: string;
  role: string;
  [key: string]: unknown;
}

const getAccessSecret = () => new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
const getRefreshSecret = () => new TextEncoder().encode(process.env.JWT_REFRESH_SECRET);

/**
 * Genera ambos tokens con sus respectivos tiempos de expiración
 */
export async function generateTokens(payload: { id: string; email: string; role: string }) {
  const accessToken = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m') // Requisito: Access Token de corta duración
    .sign(getAccessSecret());

  const refreshToken = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // Requisito: Refresh Token de larga duración
    .sign(getRefreshSecret());

  return { accessToken, refreshToken };
}

/**
 * Verifica el Access Token
 */
export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getAccessSecret());
    return payload as TokenPayload;
  } catch (error) {
    return null; // Si expira o es inválido, retorna null para que el middleware actúe
  }
}

/**
 * Verifica el Refresh Token
 */
export async function verifyRefreshToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getRefreshSecret());
    return payload as TokenPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Inyecta las cookies de forma segura cumpliendo los requisitos técnicos del PDF
 */
export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === 'production';

  cookieStore.set('access_token', accessToken, {
    httpOnly: true, // Prohíbe el acceso desde document.cookie
    secure: isProduction, // Solo HTTPS en producción
    sameSite: 'lax', // Protección CSRF
    path: '/',
    maxAge: 15 * 60, // 15 minutos en segundos
  });

  cookieStore.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 días en segundos
  });
}

/**
 * Limpia las cookies en el Logout
 */
export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete('access_token');
  cookieStore.delete('refresh_token');
}