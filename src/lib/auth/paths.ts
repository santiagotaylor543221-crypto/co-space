export const LOGIN_PATH = '/login';
export const LOGOUT_QUERY = 'loggedOut';
export const RENEW_PATH = '/sesion/renovar';
export const SESSION_REQUIRED = 'x-cospace-session-required';
export const REFRESH_ROTATED = 'x-cospace-refresh-rotated';

export function panelPath(role: string) {
  return role === 'ADMIN' ? '/admin' : '/dashboard';
}

export function pageAccess(path: string) {
  if (path === LOGIN_PATH || path === '/register') return 'guest';
  if (path === '/admin' || path.startsWith('/admin/')) return 'admin';
  if (path === '/dashboard' || path.startsWith('/dashboard/') || path === '/mis-reservas') return 'private';
  return 'public';
}

export function renewalDestination(path: string | null | undefined) {
  if (path && (path === '/admin' || path === '/dashboard' || path === '/mis-reservas' ||
      path === LOGIN_PATH || path === '/register' || /^\/dashboard\/[a-z0-9_-]{1,128}$/i.test(path))) {
    return path;
  }
  return '/dashboard';
}
