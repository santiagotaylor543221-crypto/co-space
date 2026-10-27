# CoSpace - Sistema de reservas de coworking

CoSpace es una aplicación fullstack desarrollada con Next.js 16 para explorar y reservar espacios de coworking, como escritorios, salas de reuniones y cabinas. Incluye autenticación, gestión de reservas y un panel de administración para gestionar espacios.

## Requisitos previos

- Node.js 20.9 o superior.
- npm.
- Una base de datos PostgreSQL local o alojada, por ejemplo, en Supabase.

## Configuración

1. Clona el repositorio e instala las dependencias:

   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd co-space
   npm install
   ```

2. Crea el archivo de variables de entorno:

   ```bash
   cp .env.example .env
   ```

3. En `.env`, configura `DATABASE_URL` con la URI de tu base de datos PostgreSQL, y define secretos distintos para `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET`. Puedes generar cada secreto con:

   ```bash
   openssl rand -base64 32
   ```

4. Aplica las migraciones incluidas:

   ```bash
   npx prisma migrate dev
   ```

5. Crea las cuentas y espacios iniciales:

   ```bash
   npm run seed
   ```

6. Inicia el servidor de desarrollo:

   ```bash
   npm run dev
   ```

Abre [http://localhost:3000](http://localhost:3000) para usar la aplicación.

## Ejecutar con Docker

Necesitas Docker Engine y Docker Compose. Desde la raíz del proyecto:

1. Crea y edita el archivo de entorno:

   ```bash
   cp .env.example .env
   ```

   Reemplaza los valores de ejemplo por secretos propios. Puedes generar valores aleatorios con `openssl rand -hex 32`; usa valores distintos para `POSTGRES_PASSWORD`, `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET`. La contraseña de PostgreSQL debe ser hexadecimal para que pueda usarse directamente en la URI de conexión.

2. Construye e inicia la aplicación y PostgreSQL:

   ```bash
   docker compose up --build -d
   ```

   Compose espera a que PostgreSQL esté listo y la aplicación aplica las migraciones antes de iniciar. Abre [http://localhost:3000](http://localhost:3000).

3. (Opcional) Carga las cuentas y espacios iniciales:

   ```bash
   docker compose exec app npm run seed
   ```

Los datos de PostgreSQL se conservan en el volumen `postgres_data` al detener los contenedores con `docker compose down`. Para borrar también la base de datos, usa `docker compose down -v`.

## Cuentas de prueba

El seed crea estas cuentas para desarrollo:

| Rol | Correo | Contraseña |
|-----|--------|------------|
| Administrador | `admin@coworking.com` | `admin123` |
| Usuario | `santiago@coworking.com` | `user123` |

No uses estas credenciales en producción. Los espacios iniciales se crean únicamente si la tabla de espacios está vacía.

## Comandos disponibles

- `npm run dev`: inicia el servidor de desarrollo.
- `npm run build`: compila la aplicación para producción.
- `npm run start`: inicia la aplicación compilada.
- `npm run lint`: ejecuta ESLint.
- `npm run seed`: ejecuta el seed de Prisma.

## Estructura principal

- `src/app/`: páginas, layouts y API de Next.js.
- `src/components/`: componentes de interfaz.
- `src/lib/`: cliente de Prisma.
- `src/services/`: lógica de negocio.
- `src/utils/`: utilidades de autenticación.
- `prisma/`: esquema, migraciones y seed de la base de datos.

Para más información sobre la configuración y estructura, consulta [la documentación del proyecto](./documentaci_n_del_proyecto.md).

## Despliegue

La aplicación puede ejecutarse con Docker Compose siguiendo la sección anterior o desplegarse en una plataforma compatible con Next.js, como Vercel. En otros entornos, configura las variables de entorno necesarias y aplica las migraciones antes de ponerla en servicio.
