import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
    }

    const parsedData = registerSchema.safeParse(body);
    if (!parsedData.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }
    const { name, email, password } = parsedData.data;

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'El correo electrónico ya está registrado' }, { status: 400 });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario en base de datos (por defecto rol USER)
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'USER', 
      },
    });

    return NextResponse.json({ success: true, message: 'Usuario creado exitosamente' }, { status: 201 });
  } catch (error) {
    console.error('Error en registro:', error);
    return NextResponse.json({ error: 'Error interno del servidor al registrar' }, { status: 500 });
  }
}