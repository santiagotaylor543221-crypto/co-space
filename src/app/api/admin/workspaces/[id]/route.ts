import { NextResponse } from 'next/server';
import { SpaceType } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const workspaceUpdateSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    description: z.string().trim().min(1).optional(),
    type: z.nativeEnum(SpaceType).optional(),
    capacity: z.number().int().positive().optional(),
    pricePerHour: z.number().positive().optional(),
    imageUrl: z.string().trim().min(1).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, 'Debes enviar al menos un campo');

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const input = workspaceUpdateSchema.safeParse(await request.json());
    if (!input.success) {
      return NextResponse.json({ error: 'Datos del espacio inválidos' }, { status: 400 });
    }

    const existing = await prisma.workspace.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Espacio no encontrado' }, { status: 404 });
    }

    const updated = await prisma.workspace.update({
      where: { id },
      data: input.data,
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error al actualizar espacio:', error);
    return NextResponse.json({ error: 'No se pudo actualizar el espacio' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const existing = await prisma.workspace.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Espacio no encontrado' }, { status: 404 });
    }

    const archived = await prisma.workspace.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json(archived);
  } catch (error) {
    console.error('Error al archivar espacio:', error);
    return NextResponse.json({ error: 'No se pudo archivar el espacio' }, { status: 500 });
  }
}
