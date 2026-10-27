# CoSpace - Sistema de reservas de coworking

CoSpace es una aplicación fullstack desarrollada con Next.js 16 para explorar y reservar espacios de coworking, como escritorios, salas de reuniones y cabinas. Incluye autenticación, gestión de reservas y un panel de administración para gestionar espacios.

## 1. Requisitos previos

- **Node.js**: versión 20.9 o superior.
- **npm**: incluido con Node.js.
- **Base de datos PostgreSQL**: puedes usar una instancia local o un servicio alojado, como Supabase.

Docker Compose permite ejecutar la aplicación junto con PostgreSQL; consulta la sección de Docker más abajo.

## 2. Variables de entorno

Crea `.env` en la raíz del proyecto a partir de `.env.example`:

```bash
cp .env.example .env
```

Completa los valores de estas variables en `.env`:

| Variable | Descripción | Valor esperado |
|----------|-------------|----------------|
| `DATABASE_URL` | Cadena de conexión a PostgreSQL. | URI de conexión de tu base de datos, con el esquema `public`. En Supabase se obtiene desde *Project Settings > Database > Connection string*. |
| `JWT_ACCESS_SECRET` | Secreto para firmar el token de acceso. | Secreto aleatorio; puedes generarlo con `openssl rand -base64 32`. `JWT_SECRET` se acepta como nombre heredado, pero se recomienda usar `JWT_ACCESS_SECRET`. |
| `JWT_REFRESH_SECRET` | Secreto para firmar el token de renovación. | Otro secreto aleatorio, distinto del anterior. |
| `POSTGRES_DB` | Nombre de la base de datos para Docker Compose. | Se define en `.env.example`. |
| `POSTGRES_USER` | Usuario de PostgreSQL para Docker Compose. | Se define en `.env.example`. |
| `POSTGRES_PASSWORD` | Contraseña de PostgreSQL para Docker Compose. | Usa `openssl rand -hex 32`; el valor hexadecimal puede insertarse directamente en la URI. |

El `.env.example` contiene valores de ejemplo y no permite conectarse hasta que los reemplaces por los datos de tu entorno.

## 3. Instalación y ejecución local

1. **Clona el repositorio e instala las dependencias:**

   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd co-space
   npm install
   ```

2. **Configura las variables de entorno** siguiendo la sección anterior.

3. **Aplica las migraciones incluidas en el repositorio:**

   ```bash
   npx prisma migrate dev
   ```

   Este comando crea o actualiza el esquema de la base de datos usando las migraciones existentes.

4. **Carga los datos iniciales:**

   ```bash
   npm run seed
   ```

5. **Inicia el servidor de desarrollo:**

   ```bash
   npm run dev
   ```

   Abre [http://localhost:3000](http://localhost:3000).

## Ejecución con Docker Compose

Con Docker Engine y Docker Compose instalados, copia `.env.example` a `.env` y sustituye los secretos de ejemplo. Genera valores distintos para `POSTGRES_PASSWORD`, `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET` con `openssl rand -hex 32`. Desde la raíz del repositorio ejecuta:

```bash
docker compose up --build -d
```

Compose inicia PostgreSQL con un volumen persistente, espera a que la base de datos esté lista y aplica las migraciones automáticamente antes de iniciar la aplicación. La aplicación queda disponible en [http://localhost:3000](http://localhost:3000). Para cargar las cuentas y los espacios de prueba:

```bash
docker compose exec app npm run seed
```

`docker compose down` conserva los datos; `docker compose down -v` también elimina el volumen de PostgreSQL.

## 4. Cuentas de prueba

El seed crea esta cuenta de administrador:

- **Correo:** `admin@coworking.com`
- **Contraseña:** `admin123`

También crea el usuario de prueba `santiago@coworking.com` con contraseña `user123`. Estas credenciales son únicamente para desarrollo y evaluación; no las uses en producción. El seed crea los espacios iniciales solo cuando la tabla de espacios está vacía.

## 5. Scripts disponibles

- `npm run dev`: inicia Next.js en modo de desarrollo.
- `npm run build`: compila la aplicación para producción.
- `npm run start`: inicia la aplicación compilada.
- `npm run lint`: ejecuta ESLint.
- `npm run seed`: ejecuta el seed de Prisma definido en `prisma/seed.ts`.

## 6. Estructura principal

- `src/app/`: páginas, layouts y Route Handlers de Next.js.
  - `(auth)/`: páginas de inicio de sesión y registro.
  - `(private)/`: panel del usuario, catálogo y reservas.
  - `(admin)/`: panel de administración.
  - `api/`: endpoints de autenticación, espacios, reservas y administración.
- `src/components/`: componentes de interfaz y navegación.
- `src/lib/prisma.ts`: cliente de Prisma.
- `src/proxies/`: lógica auxiliar para reservas.
- `src/services/`: lógica de negocio de reservas.
- `src/utils/`: utilidades de autenticación con JWT.
- `prisma/schema.prisma`: modelos y configuración del esquema de datos.
- `prisma/migrations/`: migraciones de la base de datos.
- `prisma/seed.ts`: creación de cuentas y espacios de prueba.

La validación con Zod está implementada en los Route Handlers; actualmente no existe una carpeta `src/schemas/`.

## 7. Despliegue

La aplicación puede desplegarse con Docker Compose o en una plataforma compatible con Next.js, como Vercel, y conectarse a una base de datos PostgreSQL. Configura allí las mismas variables de entorno descritas anteriormente y aplica las migraciones antes de usar la aplicación.

- **Aplicación:** pendiente de configurar; reemplaza esta línea con la URL pública cuando esté desplegada.
- **Base de datos:** PostgreSQL (por ejemplo, Supabase).

---

*Autor: Santiago Taylor*
