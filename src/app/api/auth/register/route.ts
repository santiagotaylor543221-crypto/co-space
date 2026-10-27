import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

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