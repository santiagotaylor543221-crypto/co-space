# CoSpace

\<p align="center">
&#x20; \<strong>Plataforma full-stack de reservas de espacios de coworking\</strong>
\</p>

\<p align="center">
&#x20; Explora, reserva y administra escritorios, salas de reuniones y cabinas desde una aplicación web moderna.
\</p>

\<p align="center">
&#x20; \<img src="[https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white](https://img.shields.io/badge/Next.js-16-black?logo=next.js\&logoColor=white)" alt="Next.js 16">
&#x20; \<img src="[https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript\&logoColor=white)" alt="TypeScript 5">
&#x20; \<img src="[https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white](https://img.shields.io/badge/React-19-149ECA?logo=react\&logoColor=white)" alt="React 19">
&#x20; \<img src="[https://img.shields.io/badge/PostgreSQL-18-4169E1?logo=postgresql&logoColor=white](https://img.shields.io/badge/PostgreSQL-18-4169E1?logo=postgresql\&logoColor=white)" alt="PostgreSQL 18">
&#x20; \<img src="[https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma\&logoColor=white)" alt="Prisma 6">
&#x20; \<img src="[https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker\&logoColor=white)" alt="Docker Compose">
&#x20; \<img src="[https://img.shields.io/badge/AWS-Cloud-FF9900?logo=amazonwebservices&logoColor=white](https://img.shields.io/badge/AWS-Cloud-FF9900?logo=amazonwebservices\&logoColor=white)" alt="AWS">
\</p>

---

## Descripción

**CoSpace** es una aplicación full-stack desarrollada con Next.js, TypeScript y PostgreSQL que permite gestionar reservas de espacios de coworking desde una plataforma centralizada.

El sistema integra autenticación, gestión de usuarios, disponibilidad de espacios, reservas y funcionalidades administrativas.

El proyecto utiliza una arquitectura que combina frontend y backend en Next.js, Prisma como ORM y PostgreSQL como base de datos relacional.

La aplicación admite desarrollo local y despliegue mediante contenedores Docker. Su infraestructura de producción está alojada en Amazon Web Services (AWS).

## Características principales

- **Autenticación:** registro e inicio de sesión con gestión de sesiones mediante JWT.
- **Catálogo de espacios:** exploración de escritorios, salas de reuniones y cabinas.
- **Reservas:** selección de espacios y períodos de utilización.
- **Gestión de disponibilidad:** lógica de negocio para administrar las reservas.
- **Roles de usuario:** diferenciación entre usuarios y administradores.
- **Panel administrativo:** administración de espacios de coworking.
- **Persistencia de datos:** PostgreSQL mediante Prisma ORM.
- **Despliegue contenerizado:** Docker y Docker Compose.

## Stack tecnológico

| Categoría       | Tecnología              |
| --------------- | ----------------------- |
| Framework       | Next.js 16              |
| Lenguaje        | TypeScript 5            |
| Interfaz        | React 19                |
| Estilos         | Tailwind CSS 4          |
| Base de datos   | PostgreSQL              |
| ORM             | Prisma 6                |
| Autenticación   | JWT, JOSE y bcryptjs    |
| Validación      | Zod                     |
| Contenedores    | Docker y Docker Compose |
| Proxy inverso   | Nginx                   |
| Infraestructura | Amazon Web Services     |
| Runtime         | Node.js 22              |

## Arquitectura de producción

CoSpace se encuentra desplegado en AWS utilizando una arquitectura basada en servicios administrados y contenedores.

```text
                     INTERNET
                        |
                        v
                 Elastic IP (EC2)
                        |
                        v
                  Nginx :80
                        |
                        v
              Docker / Next.js :3000
                        |
                        v
                 Prisma ORM
                        |
                        v
              Amazon RDS PostgreSQL
                  (Red privada)
```

### Servicios utilizados

| Servicio        | Responsabilidad                                      |
| --------------- | ---------------------------------------------------- |
| Amazon EC2      | Servidor Ubuntu que ejecuta la aplicación            |
| Amazon RDS      | Base de datos PostgreSQL administrada                |
| Amazon VPC      | Aislamiento y configuración de red                   |
| Security Groups | Control de acceso entre servicios                    |
| Elastic IP      | Dirección IP pública estable                         |
| NAT Gateway     | Salida a Internet para recursos de subredes privadas |
| Docker          | Contenerización de la aplicación                     |
| Nginx           | Proxy inverso para Next.js                           |
| Certbot         | Gestión de certificados TLS, pendiente de configurar |

La base de datos RDS no está expuesta públicamente. La aplicación se conecta a PostgreSQL mediante la red privada de AWS.

Nginx recibe las solicitudes HTTP y las redirige internamente al contenedor de Next.js, que escucha en el puerto 3000.

**Estado actual:** despliegue HTTP operativo. La configuración del subdominio y HTTPS está pendiente.

## Requisitos previos

Para ejecutar el proyecto localmente:

- Node.js 20.9 o superior (Node.js 22 recomendado).
- npm.
- PostgreSQL o Docker Engine con Docker Compose.
- Git.

## Instalación y configuración local

### 1. Clonar el repositorio

```bash
git clone https://github.com/santiagotaylor543221-crypto/co-space.git
cd co-space
```

### 2. Instalar dependencias

```bash
npm ci
```

### 3. Configurar variables de entorno

Crea un archivo `.env` a partir del ejemplo:

```bash
cp .env.example .env
```

Configura las variables necesarias:

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/cospace?schema=public"
DIRECT_URL="postgresql://USER:PASSWORD@localhost:5432/cospace?schema=public"

JWT_ACCESS_SECRET="your-access-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
```

`DATABASE_URL` define la conexión utilizada por Prisma Client y `DIRECT_URL` proporciona una conexión directa para las operaciones que la requieran.

En entornos sin un pooler externo, ambas variables pueden apuntar a la misma base de datos.

Genera secretos independientes mediante:

```bash
openssl rand -hex 32
```

No almacenes contraseñas ni secretos reales en el repositorio.

### 4. Aplicar migraciones

```bash
npx prisma migrate dev
```

### 5. Cargar datos iniciales (opcional)

```bash
npm run seed
```

Este comando carga información inicial para desarrollo y pruebas.

### 6. Iniciar el servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en:

[http://localhost:3000](http://localhost:3000)

## Ejecutar con Docker Compose

El proyecto incluye `docker-compose.yml` para ejecutar la aplicación junto con una instancia local de PostgreSQL.

### 1. Configurar el entorno

```bash
cp .env.example .env
```

Define las variables correspondientes:

```dotenv
POSTGRES_DB=cospace
POSTGRES_USER=cospace
POSTGRES_PASSWORD=your-random-hex-password

JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
```

Utiliza valores aleatorios diferentes para cada secreto.

### 2. Construir e iniciar los contenedores

```bash
docker compose up --build -d
```

Docker Compose iniciará PostgreSQL y la aplicación.

El contenedor de Next.js ejecutará las migraciones pendientes de Prisma antes de iniciar el servidor.

### 3. Consultar registros

```bash
docker compose logs -f app
```

### 4. Cargar datos de prueba (opcional)

```bash
docker compose exec app npm run seed
```

### 5. Detener los contenedores

```bash
docker compose down
```

Los datos de PostgreSQL se conservan en el volumen `postgres_data`.

Para eliminar también el volumen:

```bash
docker compose down -v
```

**Advertencia:** el último comando elimina los datos almacenados en el volumen de PostgreSQL.

## Despliegue en AWS

La configuración de producción utiliza una instancia EC2 con Ubuntu, Docker y Nginx, conectada a una base de datos Amazon RDS PostgreSQL.

A diferencia del entorno local, producción no ejecuta PostgreSQL dentro de Docker.

### Variables de producción

El archivo `.env.production` contiene las variables de conexión y autenticación.

Ejemplo sin credenciales reales:

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@RDS_ENDPOINT:5432/DATABASE?schema=public&sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@RDS_ENDPOINT:5432/DATABASE?schema=public&sslmode=require"

JWT_ACCESS_SECRET="your-production-access-secret"
JWT_REFRESH_SECRET="your-production-refresh-secret"

NODE_ENV=production
```

El archivo debe mantenerse fuera del control de versiones.

### Docker Compose de producción

La aplicación utiliza un archivo independiente, `docker-compose.prod.yml`, que permite ejecutar únicamente el servicio Next.js.

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    restart: unless-stopped
    env_file:
      - .env.production
    ports:
      - "127.0.0.1:3000:3000"
```

El puerto 3000 queda asociado a localhost, por lo que no se expone directamente a Internet.

### Construir la imagen

```bash
sudo docker compose --env-file .env.production -f docker-compose.prod.yml build
```

### Iniciar la aplicación

```bash
sudo docker compose --env-file .env.production -f docker-compose.prod.yml up -d
```

### Consultar registros

```bash
sudo docker compose --env-file .env.production -f docker-compose.prod.yml logs -f app
```

### Verificar el estado

```bash
sudo docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

El Dockerfile está preparado para ejecutar:

```bash
prisma migrate deploy
```

antes de iniciar el servidor de producción de Next.js.

Las migraciones se aplican sobre Amazon RDS.

### Proxy inverso con Nginx

Nginx actúa como punto de entrada HTTP y reenvía las solicitudes a la aplicación en `127.0.0.1:3000`.

El acceso público se realiza mediante los puertos 80 y, una vez configurado HTTPS, 443.

El puerto 3000 no necesita estar abierto públicamente en el Security Group.

### HTTPS

La emisión de certificados TLS mediante Certbot está prevista una vez que el subdominio esté asociado a la IP elástica de EC2.

Hasta completar esta configuración, el despliegue utiliza HTTP y no debe emplearse para transmitir credenciales reales o información sensible.

## Cuentas de prueba

> ⚠️ Las siguientes credenciales son exclusivamente para desarrollo. No deben utilizarse en producción.

\<details>
\<summary>Mostrar cuentas de prueba\</summary>

| Rol           | Correo                   | Contraseña |
| ------------- | ------------------------ | ---------- |
| Administrador | `admin@coworking.com`    | `admin123` |
| Usuario       | `santiago@coworking.com` | `user123`  |

El seed también crea espacios iniciales cuando la tabla de espacios está vacía.

\</details>

## Comandos disponibles

| Comando                     | Descripción                           |
| --------------------------- | ------------------------------------- |
| `npm run dev`               | Inicia el servidor de desarrollo      |
| `npm run build`             | Compila la aplicación para producción |
| `npm run start`             | Inicia la aplicación compilada        |
| `npm run lint`              | Ejecuta ESLint                        |
| `npm run seed`              | Ejecuta el seed de Prisma             |
| `npx prisma generate`       | Genera Prisma Client                  |
| `npx prisma migrate dev`    | Gestiona migraciones de desarrollo    |
| `npx prisma migrate deploy` | Aplica migraciones pendientes         |

## Estructura del proyecto

```text
co-space/
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
├── public/
├── src/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── services/
│   └── utils/
├── .env.example
├── Dockerfile
├── docker-compose.yml
├── docker-compose.prod.yml
├── next.config.ts
├── package.json
├── prisma.config.ts
└── tsconfig.json
```

### Organización del código

- `src/app/`: rutas, páginas, layouts y endpoints de Next.js.
- `src/components/`: componentes reutilizables de interfaz.
- `src/lib/`: configuración y acceso al cliente Prisma.
- `src/services/`: lógica de negocio.
- `src/utils/`: utilidades, incluida la autenticación.
- `prisma/`: modelos, migraciones y datos iniciales.
- `public/`: recursos estáticos.
- `Dockerfile`: construcción de la imagen de producción.
- `docker-compose.yml`: entorno local con PostgreSQL.
- `docker-compose.prod.yml`: despliegue de la aplicación con base de datos externa.

## Seguridad

La arquitectura contempla las siguientes medidas:

- Base de datos RDS sin acceso público.
- Restricción de acceso mediante Security Groups.
- Comunicación cifrada con PostgreSQL mediante TLS.
- Variables sensibles almacenadas fuera del repositorio.
- Aplicación ejecutada con un usuario no root dentro del contenedor.
- Puerto de Next.js restringido a localhost.
- Separación de los entornos local y de producción.
- Migraciones administradas mediante Prisma.
- Certificados HTTPS pendientes de configuración.

Para un entorno de producción definitivo, también se recomienda configurar verificación de certificados de RDS, respaldos, monitoreo y una estrategia de recuperación.

## Estado del proyecto

**Aplicación desplegada en AWS.**

La infraestructura principal está operativa, incluyendo Next.js, Docker, Nginx y Amazon RDS PostgreSQL.

Pendiente de completar:

- Asociación del subdominio.
- Configuración de HTTPS mediante Certbot.
- Validación funcional de los flujos principales en producción.

## Autor

**Santiago Taylor**

GitHub: [santiagotaylor543221-crypto](https://github.com/santiagotaylor543221-crypto)

---

\<p align="center">   \<strong>CoSpace\</strong>   \<br>   Plataforma de reservas de espacios de coworking. \</p>
Author: Santiago Taylor
