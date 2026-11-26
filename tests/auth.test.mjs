import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { decodeJwt, SignJWT } from 'jose';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import {
  ACCESS_TTL, REFRESH_TTL, generateTokens, verifyAccessToken, verifyRefreshToken,
} from '../src/utils/auth.ts';
import { loginSchema, registerSchema } from '../src/lib/auth/credentials.ts';
import { pageRedirect, checkOrigin } from '../src/lib/auth/http.ts';
import { renewalDestination } from '../src/lib/auth/paths.ts';
import { enforceRateLimit } from '../src/lib/auth/rate-limit.ts';

process.env.JWT_ACCESS_SECRET ??= 'only-local-tests-access-secret-omitting-real-keys';
process.env.JWT_REFRESH_SECRET ??= 'only-local-tests-refresh-secret-distinct-key';

const encoder = new TextEncoder();
const now = () => Math.floor(Date.now() / 1000);

function jwt(kind, sub, sid, { issued = now(), exp, alg = 'HS256' }) {
  const secret = kind === 'access' ? process.env.JWT_ACCESS_SECRET : process.env.JWT_REFRESH_SECRET;
  return new SignJWT({ sid }).setProtectedHeader({ alg, typ: `cospace-${kind}+jwt` })
    .setIssuer('cospace').setAudience(kind).setSubject(sub).setJti(randomUUID())
    .setIssuedAt(issued).setExpirationTime(exp).sign(encoder.encode(secret));
}

test('JWT valida firma, algoritmo, propósito, claims y expiración', async () => {
  const sub = randomUUID();
  const sid = randomUUID();
  const expiration = now() + REFRESH_TTL;
  const first = await generateTokens(sub, sid, expiration);
  const second = await generateTokens(sub, sid, expiration);
  assert.equal((await verifyAccessToken(first.accessToken)).sub, sub);
  assert.equal((await verifyRefreshToken(first.refreshToken)).sid, sid);
  assert.notEqual(first.refreshToken, second.refreshToken);
  assert.equal(first.sessionExpiresAt, second.sessionExpiresAt);
  assert.equal(await verifyAccessToken(first.refreshToken), null);
  assert.equal(await verifyRefreshToken(first.accessToken), null);
  assert.equal(await verifyAccessToken(first.accessToken + 'invalid'), null);
  assert.equal(await verifyAccessToken(await jwt('access', sub, sid, { alg: 'HS384', exp: now() + ACCESS_TTL })), null);
  assert.equal(await verifyAccessToken(await jwt('access', sub, sid, { issued: now() - ACCESS_TTL, exp: now() - 1 })), null);
  assert.equal(await verifyRefreshToken(await jwt('refresh', sub, sid, { exp: now() - 1 })), null);
});

test('registro comprueba bytes de bcrypt y login conserva credenciales históricas', () => {
  const form = { email: '  Someone_1@Example.com ', name: 'Someone', password: '🔑'.repeat(18) };
  assert.equal(registerSchema.safeParse(form).success, true);
  assert.equal(registerSchema.safeParse({ ...form, password: form.password + 'x' }).success, false);
  assert.equal(registerSchema.safeParse({ ...form, password: 'short' }).success, false);
  assert.equal(registerSchema.safeParse({ ...form, role: 'ADMIN' }).success, false);
  assert.deepEqual(loginSchema.parse({ email: form.email, password: ' x ' }), {
    email: 'Someone_1@Example.com', password: ' x ',
  });
});

test('redirect público fijo y destinos de renovación limitados a rutas internas', () => {
  const incoming = new Request('http://internal:3000/dashboard', {
    headers: { host: 'unexpected.test', 'x-forwarded-host': 'unexpected.test', origin: 'https://unexpected.test' },
  });
  const previous = process.env.AUTH_ORIGIN;
  process.env.AUTH_ORIGIN = 'https://cospace.example.test';
  try {
    assert.equal(pageRedirect(incoming, '/login').headers.get('Location'), 'https://cospace.example.test/login');
    assert.equal(checkOrigin(incoming).status, 403);
    assert.throws(() => pageRedirect(incoming, '//unexpected.test'));
    assert.throws(() => pageRedirect(incoming, '/\\unexpected.test'));
    for (const input of ['//unexpected.test', '/dashboard/../admin', '/dashboard/%2fexample', '/login?next=/admin']) {
      assert.equal(renewalDestination(input), '/dashboard');
    }
    assert.equal(renewalDestination('/dashboard/space-1'), '/dashboard/space-1');
  } finally {
    if (previous === undefined) delete process.env.AUTH_ORIGIN;
    else process.env.AUTH_ORIGIN = previous;
  }
});

test('rate limiter ignora cabeceras de IP sin un proxy habilitado', () => {
  const previous = process.env.AUTH_TRUST_PROXY;
  delete process.env.AUTH_TRUST_PROXY;
  const request = (i) => new Request('http://localhost/api/auth/register', {
    headers: { 'x-forwarded-for': `192.0.2.${i}`, 'x-cospace-client-ip': `192.0.2.${i}` },
  });
  try {
    for (let i = 1; i <= 20; i += 1) assert.equal(enforceRateLimit('register', request(i)), null);
    const blocked = enforceRateLimit('register', request(21));
    assert.equal(blocked.status, 429);
    assert.ok(Number(blocked.headers.get('Retry-After')) > 0);

    const account = randomUUID();
    for (let i = 0; i < 12; i += 1) assert.equal(enforceRateLimit('refresh', request(i), account), null);
    assert.equal(enforceRateLimit('refresh', request(12), account).status, 429);
  } finally {
    if (previous !== undefined) process.env.AUTH_TRUST_PROXY = previous;
  }
});

const testUrl = process.env.AUTH_TEST_URL;
const testDatabase = process.env.AUTH_TEST_DATABASE_URL;

test('API y páginas con PostgreSQL temporal', { skip: !testUrl || !testDatabase, timeout: 120_000 }, async () => {
  const url = new URL(testUrl);
  const database = new URL(testDatabase);
  assert.equal(url.hostname, '127.0.0.1', 'Usa un servidor local de pruebas');
  assert.equal(database.hostname, '127.0.0.1', 'Usa PostgreSQL temporal local');
  const prisma = new PrismaClient({ datasourceUrl: testDatabase });
  const marker = randomUUID().slice(0, 8);
  const password = 'A local test password 2';
  const email = `local_${marker}@example.test`;
  const legacyEmail = `Legacy_${marker}@example.test`;
  const adminEmail = `Admin_${marker}@example.test`;
  const redirectPath = (response) => new URL(response.headers.get('Location'), url).pathname;

  function send(path, { method = 'GET', payload, cookie, origin = url.origin, headers: extra } = {}) {
    const headers = new Headers(extra);
    if (method !== 'GET') headers.set('Origin', origin);
    if (cookie) headers.set('Cookie', cookie);
    if (payload !== undefined) headers.set('Content-Type', 'application/json');
    return fetch(new URL(path, url), {
      method, headers, redirect: 'manual', body: payload === undefined ? undefined : JSON.stringify(payload),
    });
  }

  function cookies(response) {
    return response.headers.getSetCookie().map((setCookie) => setCookie.split(';')[0]).join('; ');
  }

  function token(cookie, name) {
    return cookie.split('; ').find((value) => value.startsWith(name + '=')).slice(name.length + 1);
  }

  function login(email, password) {
    return send('/api/auth/login', { method: 'POST', payload: { email, password } });
  }

  try {
    const admin = await prisma.user.create({
      data: { name: 'Local admin fixture', email: adminEmail, password: await bcrypt.hash(password, 10), role: 'ADMIN' },
    });
    // Confirma compatibilidad con contraseña histórica y un correo con guion bajo.
    const legacy = await prisma.user.create({
      data: { name: 'Legacy fixture', email: legacyEmail, password: await bcrypt.hash('old', 10) },
    });
    await prisma.user.create({
      data: { name: 'Similar fixture', email: legacyEmail.replace('_', 'X'), password: await bcrypt.hash('else', 10) },
    });

    const guest = await send('/dashboard');
    assert.equal(guest.status, 307);
    assert.equal(redirectPath(guest), '/login');
    assert.equal(guest.headers.get('Cache-Control'), 'private, no-store');
    assert.equal((await send('/api/bookings')).status, 401);
    assert.equal((await send('/api/admin/users')).status, 401);

    const payload = { name: 'Local user fixture', email: ` ${email.toUpperCase()} `, password };
    const initial = await send('/api/auth/register', { method: 'POST', payload });
    const repeated = await send('/api/auth/register', { method: 'POST', payload: { ...payload, password: 'Another password 3' } });
    assert.equal(initial.status, 201);
    assert.equal(repeated.status, 201);
    assert.deepEqual(await initial.json(), await repeated.json());
    assert.equal((await login(email, 'Another password 3')).status, 401);
    assert.equal((await login(legacyEmail.toLowerCase(), 'old')).status, 200);
    assert.equal((await send('/api/auth/login', {
      method: 'POST', payload: { email, password }, origin: 'https://cross-origin.example.test',
    })).status, 403);

    const authenticated = await login(email.toUpperCase(), password);
    assert.equal(authenticated.status, 200);
    const originalCookies = cookies(authenticated);
    assert.match(authenticated.headers.getSetCookie()[0], /HttpOnly/i);
    assert.match(authenticated.headers.getSetCookie()[0], /SameSite=lax/i);
    for (const guestPath of ['/login', '/register']) {
      assert.equal(redirectPath(await send(guestPath, { cookie: originalCookies })), '/dashboard');
    }
    assert.equal((await send('/dashboard', { cookie: originalCookies })).status, 200);
    assert.equal(redirectPath(await send('/admin', { cookie: originalCookies })), '/dashboard');
    assert.equal((await send('/api/admin/users', { cookie: originalCookies })).status, 403);
    const bookings = await send('/api/bookings', { cookie: originalCookies });
    assert.equal(bookings.status, 200);
    assert.equal(bookings.headers.get('Cache-Control'), 'private, no-store');

    const workspace = await prisma.workspace.create({
      data: { name: 'Local fixture', description: 'Local fixture', type: 'DESK', capacity: 1, pricePerHour: 5, imageUrl: '/test.png' },
    });
    const startTime = new Date(Date.now() + 6 * 60 * 60_000);
    const endTime = new Date(startTime.getTime() + 60 * 60_000);
    const otherBooking = await prisma.booking.create({
      data: { userId: legacy.id, workspaceId: workspace.id, startTime, endTime, totalPrice: 5 },
    });
    assert.equal((await send(`/api/bookings/${otherBooking.id}`, { method: 'DELETE', cookie: originalCookies })).status, 403);
    assert.equal((await prisma.booking.findUnique({ where: { id: otherBooking.id } })).status, 'CONFIRMED');

    const adminLogin = await login(adminEmail.toLowerCase(), password);
    assert.equal(adminLogin.status, 200);
    const adminCookies = cookies(adminLogin);
    assert.equal(redirectPath(await send('/register', { cookie: adminCookies })), '/admin');
    assert.equal(redirectPath(await send('/login', { cookie: adminCookies })), '/admin');
    assert.equal((await send('/api/admin/users', { cookie: adminCookies })).status, 200);
    await prisma.user.update({ where: { id: admin.id }, data: { role: 'USER' } });
    assert.equal((await send('/api/admin/users', { cookie: adminCookies })).status, 403);

    const refresh = token(originalCookies, 'refresh_token');
    const claims = decodeJwt(refresh);
    const expiredAccess = await jwt('access', claims.sub, claims.sid, { issued: now() - ACCESS_TTL, exp: now() - 1 });
    const expiredCookies = `access_token=${expiredAccess}; refresh_token=${refresh}`;
    const renewal = await send('/mis-reservas', { cookie: expiredCookies });
    assert.equal(redirectPath(renewal), '/sesion/renovar');
    assert.equal(new URL(renewal.headers.get('Location'), url).searchParams.get('returnTo'), '/mis-reservas');
    assert.equal((await send('/api/bookings', { cookie: expiredCookies })).status, 401);
    assert.equal((await send('/api/bookings', {
      cookie: `access_token=${token(originalCookies, 'access_token')}invalid`,
    })).status, 401);
    const expiredRefresh = await jwt('refresh', claims.sub, claims.sid, { exp: now() - 1 });
    const expired = await send('/dashboard', { cookie: `access_token=${expiredAccess}; refresh_token=${expiredRefresh}` });
    assert.equal(redirectPath(expired), '/login');
    assert.equal(expired.headers.getSetCookie().length, 2);

    const renew = () => send('/api/auth/refresh', { method: 'POST', cookie: expiredCookies });
    const concurrent = await Promise.all([renew(), renew()]);
    const winner = concurrent.find((response) => response.status === 204);
    const loser = concurrent.find((response) => response !== winner);
    assert.ok(winner);
    assert.ok([401, 409].includes(loser.status));
    assert.equal(loser.headers.getSetCookie().length, 0);
    assert.equal((await renew()).status, 401);

    const renewedCookies = cookies(winner);
    assert.notEqual(token(renewedCookies, 'refresh_token'), refresh);
    assert.equal(decodeJwt(token(renewedCookies, 'refresh_token')).exp, claims.exp);
    assert.equal((await send('/api/bookings', { cookie: renewedCookies })).status, 200);
    const logout = await send('/api/auth/logout', { method: 'POST', cookie: renewedCookies });
    assert.equal(logout.status, 204);
    assert.equal(logout.headers.getSetCookie().length, 2);
    assert.equal((await send('/api/auth/refresh', { method: 'POST', cookie: renewedCookies })).status, 401);
    assert.equal((await send('/api/bookings', { cookie: renewedCookies })).status, 401);
    assert.equal(redirectPath(await send('/mis-reservas', { cookie: renewedCookies })), '/login');

    const displaced = cookies(await login(email, password));
    const replacement = cookies(await login(email, password));
    assert.equal((await send('/api/bookings', { cookie: displaced })).status, 401);
    assert.equal((await send('/api/auth/refresh', { method: 'POST', cookie: displaced })).status, 401);
    assert.equal((await send('/api/auth/logout', { method: 'POST', cookie: displaced })).status, 204);
    assert.equal((await send('/api/bookings', { cookie: replacement })).status, 200);

    const unknown = `missing-${marker}@example.test`;
    for (let attempt = 0; attempt < 8; attempt += 1) assert.equal((await login(unknown, password)).status, 401);
    const blocked = await login(unknown.toUpperCase(), password);
    assert.equal(blocked.status, 429);
    assert.ok(Number(blocked.headers.get('Retry-After')) > 0);
  } finally {
    await prisma.$disconnect();
  }
});
