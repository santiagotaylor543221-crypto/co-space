import { LOGIN_PATH, REFRESH_ROTATED, SESSION_REQUIRED } from './paths';

export async function withSessionLock<T>(action: () => Promise<T>): Promise<T> {
  return navigator.locks ? navigator.locks.request('cospace-session', action) : action();
}

let replacingDocument = false;

export function isReplacingDocument() {
  return replacingDocument;
}

export function replaceDocument(path: string) {
  if (replacingDocument) return;
  replacingDocument = true;
  document.documentElement.style.visibility = 'hidden';
  window.location.replace(path);
}

let sessionChannel: BroadcastChannel | undefined;

export function getSessionChannel() {
  if (typeof BroadcastChannel === 'undefined') return null;
  sessionChannel ??= new BroadcastChannel('cospace-session');
  return sessionChannel;
}

export function publishSessionChange() {
  getSessionChannel()?.postMessage('changed');
}

export async function responseError(response: Response, fallback: string) {
  const data: unknown = await response.json().catch(() => null);
  return typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string'
    ? data.error
    : fallback;
}

let pendingRefresh: Promise<Response> | undefined;

export function refreshAccess() {
  pendingRefresh ??= withSessionLock(async () => {
    const refresh = () => fetch('/api/auth/refresh', { method: 'POST', cache: 'no-store' });
    const response = await refresh();
    if (response.status !== 409 && response.headers.get(REFRESH_ROTATED) !== '1') return response;
    // La otra solicitud puede estar recibiendo todavía las cookies nuevas.
    await new Promise((resolve) => setTimeout(resolve, 150));
    return refresh();
  }).finally(() => { pendingRefresh = undefined; });
  return pendingRefresh;
}

export async function authFetch(path: string, init?: RequestInit) {
  const options = { ...init, cache: 'no-store' as const };
  const response = await fetch(path, options);
  if (response.status !== 401 || !response.headers.has(SESSION_REQUIRED) || init?.signal?.aborted) return response;

  // El guard envía este 401 antes de ejecutar el handler, incluso para escrituras.
  const refreshed = await refreshAccess();
  if (refreshed.ok) {
    const retried = await fetch(path, options);
    if (retried.status === 401 && retried.headers.has(SESSION_REQUIRED)) replaceDocument(LOGIN_PATH);
    return retried;
  }
  if (refreshed.status === 401) replaceDocument(LOGIN_PATH);
  return refreshed.clone();
}
