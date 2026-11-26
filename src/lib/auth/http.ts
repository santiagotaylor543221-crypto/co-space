import { NextResponse } from 'next/server';

export const PRIVATE_CACHE = 'private, no-store';

function publicOrigin(request: Request) {
  const configured = process.env.AUTH_ORIGIN;
  if (configured) {
    const url = new URL(configured);
    if (configured !== url.origin || !['http:', 'https:'].includes(url.protocol) ||
        (process.env.NODE_ENV === 'production' && url.protocol !== 'https:')) {
      throw new Error('AUTH_ORIGIN inválido');
    }
    return url.origin;
  }
  if (process.env.NODE_ENV === 'production') throw new Error('AUTH_ORIGIN es obligatorio');

  const url = new URL(request.url);
  // Solo en desarrollo directo. Permite localhost y 127.0.0.1 en el mismo listener.
  const host = request.headers.get('host');
  if (host && /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(host)) {
    return `${url.protocol}//${host.toLowerCase()}`;
  }
  return url.origin;
}

export function pageRedirect(request: Request, path: string) {
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\') || /[\t\n\r]/.test(path)) {
    throw new Error('Ruta de redirección inválida');
  }
  // Proxy requiere una URL absoluta. En desarrollo Next la convierte en Location relativo.
  const origin = process.env.NODE_ENV === 'production' || process.env.AUTH_ORIGIN
    ? publicOrigin(request)
    : new URL(request.url).origin;
  return privateResponse(NextResponse.redirect(new URL(path, origin)));
}

export function privateResponse<T extends Response>(response: T) {
  response.headers.set('Cache-Control', PRIVATE_CACHE);
  return response;
}

export function authError(error: string, status: number) {
  return privateResponse(NextResponse.json({ error }, { status }));
}

export function checkOrigin(request: Request) {
  const origin = publicOrigin(request);
  if (request.headers.get('origin') !== origin ||
      ['cross-site', 'same-site'].includes(request.headers.get('sec-fetch-site') ?? '')) {
    return authError('Origen no permitido', 403);
  }
  return null;
}

export function authUnavailable(operation: string, error: unknown) {
  const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
  console.error(`[auth] ${operation}`, typeof code === 'string' && /^P\d{4}$/.test(code) ? code : 'error');
  return authError('No se pudo procesar la sesión. Intenta de nuevo.', 500);
}
