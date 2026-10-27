import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Regla de negocio: Solo devolver los espacios que estén activos
    const workspaces = await prisma.workspace.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(workspaces, { status: 200 });
  } catch (error) {
    console.error('Error al obtener los espacios:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}