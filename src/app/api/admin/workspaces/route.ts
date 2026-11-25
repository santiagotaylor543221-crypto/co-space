import { NextResponse } from 'next/server';
import { workspaceSchema } from '@/lib/workspace-schema';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const workspaces = await prisma.workspace.findMany({
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });

    return NextResponse.json(workspaces);
  } catch (error) {
    console.error('Error al listar espacios para administración:', error);
    return NextResponse.json({ error: 'Error al cargar los espacios' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const input = workspaceSchema.safeParse(await request.json());
    if (!input.success) {
      return NextResponse.json({ error: 'Revisa los campos del espacio.', fieldErrors: input.error.flatten().fieldErrors }, { status: 400 });
    }

    const workspace = await prisma.workspace.create({ data: input.data });
    return NextResponse.json(workspace, { status: 201 });
  } catch (error) {
    console.error('Error al crear espacio:', error);
    return NextResponse.json({ error: 'Error al crear el espacio' }, { status: 500 });
  }
}
