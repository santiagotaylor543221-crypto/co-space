import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authError } from './http';

const email = z.string().trim();
const maxBodyBytes = 64 * 1024;
export const passwordPolicy = 'Usa al menos 8 caracteres y un máximo de 72 bytes (UTF-8).';
export const normalizeEmail = (value: string) => value.trim().toLowerCase();
export const validNewPassword = (value: string) => [...value].length >= 8 && !bcrypt.truncates(value);

export const loginSchema = z.strictObject({
  email: email.pipe(z.email()),
  // Los hashes previos también pueden contener contraseñas cortas o truncadas por bcrypt.
  password: z.string().min(1),
});

export const registerSchema = z.strictObject({
  email: email.max(254).pipe(z.email()),
  name: z.string().trim().min(1).max(120),
  password: z.string().refine(validNewPassword, passwordPolicy),
});

export async function readCredentials(request: Request) {
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return authError('Se requiere application/json', 415);
  }
  if (Number(request.headers.get('content-length')) > maxBodyBytes) {
    return authError('Solicitud demasiado grande', 413);
  }

  const reader = request.body?.getReader();
  if (!reader) return authError('JSON inválido', 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
      size += chunk.value.length;
      if (size > maxBodyBytes) {
        await reader.cancel();
        return authError('Solicitud demasiado grande', 413);
      }
      chunks.push(chunk.value);
    }
    const value: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks)));
    return { value };
  } catch {
    return authError('JSON inválido', 400);
  } finally {
    reader.releaseLock();
  }
}

export async function findLoginUser(originalEmail: string) {
  const select = { id: true, email: true, name: true, role: true, password: true } as const;
  const exact = await prisma.user.findUnique({ where: { email: originalEmail }, select });
  if (exact) return exact;

  // ILIKE interpreta "_" y "%" en PostgreSQL incluso con el filtro equals de Prisma.
  const matches = await prisma.user.findMany({
    where: { email: { equals: insensitiveEmail(originalEmail), mode: 'insensitive' } },
    select,
    take: 2,
  });
  return matches.length === 1 ? matches[0] : null;
}

export function insensitiveEmail(value: string) {
  return normalizeEmail(value).replace(/[\\%_]/g, '\\$&');
}
