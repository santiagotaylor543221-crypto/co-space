import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { insensitiveEmail, normalizeEmail, passwordPolicy, readCredentials, registerSchema } from '@/lib/auth/credentials';
import { authError, authUnavailable, checkOrigin, privateResponse } from '@/lib/auth/http';
import { enforceRateLimit } from '@/lib/auth/rate-limit';

function registrationAccepted() {
  return privateResponse(NextResponse.json({
    success: true,
    message: 'Solicitud de registro recibida. Intenta iniciar sesión.',
  }, { status: 201 }));
}

export async function POST(request: Request) {
  try {
    const blocked = checkOrigin(request) ?? enforceRateLimit('register', request);
    if (blocked) return blocked;
    const body = await readCredentials(request);
    if (body instanceof Response) return body;
    const input = registerSchema.safeParse(body.value);
    if (!input.success) {
      return authError(input.error.issues.some((issue) => issue.path[0] === 'password')
        ? passwordPolicy : 'Datos inválidos', 400);
    }

    const { name, password } = input.data;
    const email = normalizeEmail(input.data.email);
    const accountLimit = enforceRateLimit('register', request, email);
    if (accountLimit) return accountLimit;

    const [hash, existing] = await Promise.all([
      bcrypt.hash(password, 10),
      prisma.user.findFirst({
        where: { email: { equals: insensitiveEmail(email), mode: 'insensitive' } },
        select: { id: true },
      }),
    ]);
    if (!existing) {
      await prisma.user.create({ data: { name, email, password: hash, role: 'USER' } });
    }
    return registrationAccepted();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return registrationAccepted();
    }
    return authUnavailable('registro', error);
  }
}
