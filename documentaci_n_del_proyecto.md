# CoSpace - Sistema de Reservas de Coworking 🏢

CoSpace es una plataforma fullstack desarrollada con Next.js 16 diseñada para la gestión y reserva de espacios de coworking (escritorios, salas de reuniones y cabinas). Permite a los usuarios explorar el catálogo, realizar reservas por horas y gestionar sus espacios, mientras que los administradores controlan el inventario y las disponibilidades.

## 📋 1. Requisitos Previos
Para ejecutar este proyecto, necesitas tener instalado:
- **Node.js**: Versión 20.x o superior.
- **Gestor de paquetes**: `npm` (incluido con Node.js).
- **Docker** y **Docker Compose**: Para la ejecución contenerizada (Opcional).
- **Cuenta de Supabase**: Para desplegar la base de datos PostgreSQL alojada.

## 🔐 2. Variables de Entorno (`.env.example`)
Debes crear un archivo `.env` en la raíz del proyecto basándote en el `.env.example`.

| Variable | Descripción | Cómo obtenerla / Valor esperado |
|----------|-------------|---------------------------------|
| `DATABASE_URL` | Cadena de conexión a PostgreSQL. | Obtener desde el panel de Supabase: *Project Settings > Database > Connection string (URI)*. |
| `JWT_ACCESS_SECRET` | Secreto para firmar el Access Token. | Generar en terminal: `openssl rand -base64 32` |
| `JWT_REFRESH_SECRET` | Secreto para firmar el Refresh Token. | Generar en terminal: `openssl rand -base64 32` |

## 🚀 3. Ejecución en Entorno de Desarrollo (Paso a Paso)

Sigue estos comandos en estricto orden para levantar la aplicación:

1. **Clonar el repositorio e instalar dependencias:**
   ```bash
   git clone <tu-repositorio-url>
   cd cospace-app
   npm install
   ```

2. **Configurar el entorno:**
   Crea el archivo `.env` y pega tus credenciales de Supabase y secretos JWT.
   ```bash
   cp .env.example .env
   ```

3. **Ejecutar migraciones en la base de datos:**
   ```bash
   npx prisma migrate dev --name init
   ```

4. **Ejecutar el Seed (Población de datos iniciales):**
   ```bash
   npm run seed
   ```

5. **Levantar el proyecto en modo desarrollo:**
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en `http://localhost:3000`.

## 🛡️ 4. Credenciales de Administrador (Creadas por el Seed)
Para evaluar las funcionalidades del rol de administrador (crear, editar y desactivar espacios), utiliza las siguientes credenciales:
- **Email:** `admin@coworking.com`
- **Contraseña:** `admin123`

## 🐳 5. Ejecución con Docker
Si prefieres ejecutar el proyecto utilizando contenedores, asegúrate de tener tu `.env` configurado y ejecuta:

```bash
# Construir la imagen y levantar el contenedor inyectando el .env
docker build -t cospace-app .
docker run -p 3000:3000 --env-file .env cospace-app
```

## 📜 6. Scripts Disponibles (`package.json`)
- `npm run dev`: Inicia el servidor de Next.js en modo desarrollo.
- `npm run build`: Compila la aplicación para producción (optimiza SSG y SSR).
- `npm run start`: Inicia el servidor de producción tras el build.
- `npm run lint`: Ejecuta ESLint para analizar la calidad del código.
- `npm run seed`: Ejecuta el script `prisma/seed.ts` para sembrar el admin y el catálogo inicial.

## 📂 7. Estructura del Proyecto
- `src/app/`: Implementa **Route Groups** para mantener layouts separados:
  - `(public)`: Home y catálogo de espacios.
  - `(auth)`: Login y Registro.
  - `(private)`: Dashboard de usuario (reservas).
  - `(admin)`: Panel de administración.
- `src/api/`: Route Handlers (Controladores de API).
- `src/services/`: Lógica de negocio estricta y consultas a Prisma (Cruce de horarios, validaciones).
- `src/schemas/`: Esquemas de validación de datos usando Zod.
- `src/utils/`: Funciones de utilidad (Autenticación JWT manual con `jose`, Rate Limiting).

## 🌐 8. URL de Despliegue
- **Aplicación Frontend (Vercel):** `[INSERTA-TU-URL-DE-VERCEL-AQUI]`
- **Base de Datos:** Supabase PostgreSQL.

---
*Autor: Santiago Taylor*