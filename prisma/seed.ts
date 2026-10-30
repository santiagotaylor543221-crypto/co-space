import { PrismaClient, Role, SpaceType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 1. Encriptar contraseñas
  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  const hashedUserPassword = await bcrypt.hash('user123', 10);


  await prisma.user.upsert({
    where: { email: 'admin@coworking.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@coworking.com',
      password: hashedAdminPassword,
      role: Role.ADMIN,
    },
  });

  // 3. Crear un Usuario normal de prueba
  await prisma.user.upsert({
    where: { email: 'santiago@coworking.com' },
    update: {},
    create: {
      name: 'Santiago (User)',
      email: 'santiago@coworking.com',
      password: hashedUserPassword,
      role: Role.USER,
    },
  });

  // 4. Crear Espacios de Coworking Iniciales
  const count = await prisma.workspace.count();
  if (count === 0) {
    await prisma.workspace.createMany({
      data: [
        {
          name: 'Escritorio Flex - Zona A',
          description: 'Escritorio flexible en zona compartida con buena iluminación.',
          type: SpaceType.DESK,
          capacity: 1,
          pricePerHour: 10000,
          imageUrl: '/images/desk-1.svg',
          isActive: true,
        },
        {
          name: 'Sala de Reuniones Creativa',
          description: 'Sala insonorizada con tablero de cristal y pantalla 4K.',
          type: SpaceType.MEETING_ROOM,
          capacity: 6,
          pricePerHour: 45000,
          imageUrl: '/images/meeting-1.svg',
          isActive: true,
        },
        {
          name: 'Cabina Privada para Llamadas',
          description: 'Cabina individual insonorizada ideal para videollamadas.',
          type: SpaceType.BOOTH,
          capacity: 1,
          pricePerHour: 15000,
          imageUrl: '/images/booth-1.svg',
          isActive: true,
        },
      ],
    });
    console.log('✅ Espacios de prueba creados.');
  }

  console.log('✅ Base de datos poblada con éxito.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });