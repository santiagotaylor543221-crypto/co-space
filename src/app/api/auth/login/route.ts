import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { generateTokens, setAuthCookies } from '@/utils/auth';
import { z } from 'zod';

// Validación estricta de entrada con Zod
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
    }

    const parsedData = loginSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const { email, password } = parsedData.data;

    // 1. Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
    }

    // 2. Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
    }

    // 3. Generar ambos tokens
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    const { accessToken, refreshToken } = await generateTokens(payload);

    // 4. Hashear el refresh token antes de guardarlo en BD
    const salt = await bcrypt.genSalt(10);
    const hashedRefreshToken = await bcrypt.hash(refreshToken, salt);

    // 5. Guardar el hash en el usuario
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: hashedRefreshToken },
    });

    // 6. Inyectar las cookies seguras
    await setAuthCookies(accessToken, refreshToken);

    return NextResponse.json(
      {
        message: 'Login exitoso',
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}