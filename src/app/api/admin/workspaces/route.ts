import { NextResponse } from 'next/server';
import { SpaceType } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const workspaceSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio'),
  description: z.string().trim().min(1, 'La descripción es obligatoria'),
  type: z.nativeEnum(SpaceType),
  capacity: z.number().int().positive(),
  pricePerHour: z.number().positive(),
  imageUrl: z.string().trim().min(1, 'La imagen es obligatoria'),
});

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
      return NextResponse.json({ error: 'Datos del espacio inválidos' }, { status: 400 });
    }

    const workspace = await prisma.workspace.create({ data: input.data });
    return NextResponse.json(workspace, { status: 201 });
  } catch (error) {
    console.error('Error al crear espacio:', error);
    return NextResponse.json({ error: 'Error al crear el espacio' }, { status: 500 });
  }
}
