import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
import { authError } from './http';

type Bucket = { attempts: number; expiresAt: number };
type Operation = 'login' | 'register' | 'refresh';

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 20_000;
let nextCleanup = 0;

const limits = {
  login: { window: 15 * 60, ip: 40, identity: 8 },
  register: { window: 15 * 60, ip: 20, identity: 5 },
  refresh: { window: 60, ip: 120, identity: 12 },
};

function clientIp(request: Request) {
  const candidate = request.headers.get('x-cospace-client-ip');
  return process.env.AUTH_TRUST_PROXY === '1' && candidate && isIP(candidate) ? candidate : 'shared';
}

function keyFor(operation: Operation, request: Request, identity?: string) {
  const scope = identity === undefined ? 'ip' : 'identity';
  const digest = createHash('sha256').update(identity ?? clientIp(request)).digest('hex');
  return `${operation}:${scope}:${digest}`;
}

export function enforceRateLimit(operation: Operation, request: Request, identity?: string) {
  const now = Date.now();
  if (now >= nextCleanup) {
    for (const [key, bucket] of buckets) {
      if (bucket.expiresAt <= now) buckets.delete(key);
    }
    nextCleanup = now + 5_000;
  }

  const policy = limits[operation];
  const limit = identity === undefined ? policy.ip : policy.identity;
  const key = keyFor(operation, request, identity);
  let bucket = buckets.get(key);
  if (!bucket || bucket.expiresAt <= now) {
    if (!bucket && buckets.size >= MAX_BUCKETS) return rateLimited(nextCleanup - now);
    bucket = { attempts: 0, expiresAt: now + policy.window * 1000 };
    buckets.set(key, bucket);
  }
  if (bucket.attempts >= limit) return rateLimited(bucket.expiresAt - now);
  bucket.attempts += 1;
  return null;
}

function rateLimited(remainingMs: number) {
  const response = authError('Demasiados intentos. Intenta más tarde.', 429);
  response.headers.set('Retry-After', String(Math.max(1, Math.ceil(remainingMs / 1000))));
  return response;
}

export function clearLoginAttempts(request: Request, identity: string) {
  buckets.delete(keyFor('login', request, identity));
}
