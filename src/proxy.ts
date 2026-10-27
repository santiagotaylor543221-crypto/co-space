import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAccessToken } from '@/utils/auth';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Definir qué rutas están protegidas
  const isPrivatePath = pathname.startsWith('/dashboard') || pathname.startsWith('/api/bookings');
  const isAdminPath = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');

  // Si es ruta pública, pasa directo
  if (!isPrivatePath && !isAdminPath) {
    return NextResponse.next();
  }

  // 2. Extraer token de la cookie
  const token = request.cookies.get('access_token')?.value;

  if (!token) {
    return handleUnauthorized(request);
  }

  // 3. Verificar el token usando jose (compatible con Edge)
  const payload = await verifyAccessToken(token);

  if (!payload) {
    return handleUnauthorized(request);
  }

  // 4. Control de Acceso por Roles (RBAC) para el Admin
  if (isAdminPath && payload.role !== 'ADMIN') {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Acceso denegado: Se requiere rol ADMIN' }, { status: 403 });
    }
    // Si intenta entrar a /admin desde el navegador sin ser admin, al dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 5. Todo en orden, permitir acceso
  return NextResponse.next();
}

// Función para manejar el rechazo limpiamente
function handleUnauthorized(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'No autorizado. Inicia sesión.' }, { status: 401 });
  }
  // Redirigir al login si entra desde la interfaz web
  return NextResponse.redirect(new URL('/auth/login', request.url));
}

// 6. Configurar en qué rutas se dispara el proxy para ahorrar recursos
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/api/bookings/:path*',
    '/api/admin/:path*'
  ],
};