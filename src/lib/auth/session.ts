import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { generateTokens, REFRESH_TTL, verifyAccessToken, verifyRefreshToken } from '@/utils/auth';

type SessionClaims = NonNullable<Awaited<ReturnType<typeof verifyRefreshToken>>>;

const sessionPrefix = (sessionId: string) => `v1:${sessionId}:`;

function sessionRecord(sessionId: string, token: string) {
  return sessionPrefix(sessionId) + createHash('sha256').update(token).digest('hex');
}

function matchesRecord(current: string, expected: string) {
  const stored = Buffer.from(current);
  const digest = Buffer.from(expected);
  return stored.length === digest.length && timingSafeEqual(stored, digest);
}

function findSession(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, refreshTokenHash: true },
  });
}

export async function getAccessSession(token?: string) {
  const claims = await verifyAccessToken(token);
  if (!claims) return null;
  const user = await findSession(claims.sub);
  if (!user?.refreshTokenHash?.startsWith(sessionPrefix(claims.sid))) return null;
  return { id: user.id, role: user.role };
}

export async function startSession(userId: string) {
  const sessionId = randomUUID();
  const expiresAt = Math.floor(Date.now() / 1000) + REFRESH_TTL;
  const tokens = await generateTokens(userId, sessionId, expiresAt);
  await prisma.user.update({
    where: { id: userId },
    data: { refreshTokenHash: sessionRecord(sessionId, tokens.refreshToken) },
  });
  return tokens;
}

export async function getRefreshSession(claims: SessionClaims, token: string) {
  const user = await findSession(claims.sub);
  const stored = user?.refreshTokenHash;
  if (!stored?.startsWith(sessionPrefix(claims.sid))) return { state: 'inactive' } as const;
  if (!matchesRecord(stored, sessionRecord(claims.sid, token))) return { state: 'rotated' } as const;
  return { state: 'active', stored } as const;
}

export async function rotateSession(claims: SessionClaims, stored: string) {
  const tokens = await generateTokens(claims.sub, claims.sid, claims.exp);
  // Solo la primera solicitud con el hash vigente puede emitir nuevas cookies.
  const result = await prisma.user.updateMany({
    where: { id: claims.sub, refreshTokenHash: stored },
    data: { refreshTokenHash: sessionRecord(claims.sid, tokens.refreshToken) },
  });
  return result.count === 1 ? tokens : null;
}

export async function revokeSession(refresh?: string, access?: string) {
  // Un access token vigente identifica la sesión del navegador aun durante una rotación.
  const claims = await verifyAccessToken(access) ?? await verifyRefreshToken(refresh);
  if (!claims) return;
  await prisma.user.updateMany({
    where: { id: claims.sub, refreshTokenHash: { startsWith: sessionPrefix(claims.sid) } },
    data: { refreshTokenHash: null },
  });
}
