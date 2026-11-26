import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { setAuthCookies } from '@/utils/auth';
import { findLoginUser, loginSchema, normalizeEmail, readCredentials } from '@/lib/auth/credentials';
import { authError, authUnavailable, checkOrigin, privateResponse } from '@/lib/auth/http';
import { clearLoginAttempts, enforceRateLimit } from '@/lib/auth/rate-limit';
import { startSession } from '@/lib/auth/session';

// Hash ficticio con el mismo coste que los hashes generados en el registro.
const dummyHash = '$2b$10$AAJgEjODBExtbwf6fmRgiOn0a1znPoKFp8BAitOH6.IenLF7JYLD6';

export async function POST(request: Request) {
  try {
    const blocked = checkOrigin(request) ?? enforceRateLimit('login', request);
    if (blocked) return blocked;
    const body = await readCredentials(request);
    if (body instanceof Response) return body;
    const input = loginSchema.safeParse(body.value);
    if (!input.success) return authError('Datos inválidos', 400);

    const { email, password } = input.data;
    const identity = normalizeEmail(email);
    const accountLimit = enforceRateLimit('login', request, identity);
    if (accountLimit) return accountLimit;

    const user = await findLoginUser(email);
    const passwordMatches = await bcrypt.compare(password, user?.password ?? dummyHash);
    if (!user || !passwordMatches) return authError('Credenciales incorrectas', 401);

    const tokens = await startSession(user.id);
    clearLoginAttempts(request, identity);
    const response = privateResponse(NextResponse.json({
      message: 'Login exitoso',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    }));
    setAuthCookies(response, tokens);
    return response;
  } catch (error) {
    return authUnavailable('login', error);
  }
}
