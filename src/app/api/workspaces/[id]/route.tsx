import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;

    const workspace = await prisma.workspace.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!workspace || !workspace.isActive) {
      return NextResponse.json({ error: 'Espacio no encontrado' }, { status: 404 });
    }

    return NextResponse.json(workspace, { status: 200 });
  } catch (error) {
    console.error('Error al obtener el espacio:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}