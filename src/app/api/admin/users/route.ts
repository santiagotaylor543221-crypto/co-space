import { protectApi } from '@/lib/auth/api';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const GET = protectApi('ADMIN', async () => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'USER' },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error al listar usuarios para administración:', error);
    return NextResponse.json({ error: 'Error al cargar los usuarios' }, { status: 500 });
  }
});
