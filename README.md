h1 align="center">CoSpace</h1><p align="center">
  <strong>Plataforma full-stack de reservas de espacios de coworking</strong>
</p><p align="center">
  Explora, reserva y administra escritorios, salas de reuniones y cabinas desde una aplicación web moderna.
</p><p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js&amp;logoColor=white" alt="Next.js 16">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&amp;logoColor=white" alt="TypeScript 5">
  <img src="https://img.shields.io/badge/React-19-149ECA?logo=react&amp;logoColor=white" alt="React 19">
  <img src="https://img.shields.io/badge/PostgreSQL-18-4169E1?logo=postgresql&amp;logoColor=white" alt="PostgreSQL 18">
  <img src="https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&amp;logoColor=white" alt="Prisma 6">
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&amp;logoColor=white" alt="Docker Compose">
  <img src="https://img.shields.io/badge/AWS-Cloud-FF9900?logo=amazonwebservices&amp;logoColor=white" alt="AWS">
</p>Descripción
CoSpace es una aplicación full-stack desarrollada con Next.js, TypeScript y PostgreSQL para explorar y reservar espacios de coworking desde una plataforma centralizada. Integra autenticación, gestión de usuarios, reservas y administración de espacios.

La aplicación admite desarrollo local y despliegue con Docker. Su infraestructura de producción está alojada en Amazon Web Services (AWS).
Características principales
- Autenticación: registro e inicio de sesión con JWT.
- Catálogo de espacios: escritorios, salas de reuniones y cabinas.
- Reservas: selección de espacios y períodos de utilización.
- Gestión de disponibilidad: lógica de negocio para administrar las reservas.
- Roles: usuarios y administradores.
- Panel administrativo: gestión de espacios de coworking.
- Persistencia: PostgreSQL con Prisma ORM.
- Contenerización: Docker y Docker Compose.
Stack tecnológico
Categoría	Tecnología
Framework	Next.js 16
Lenguaje	TypeScript 5
Interfaz	React 19
Estilos	Tailwind CSS 4
Base de datos	PostgreSQL
ORM	Prisma 6
Autenticación	JWT, JOSE y bcryptjs
Validación	Zod
Contenedores	Docker y Docker Compose
Proxy inverso	Nginx
Infraestructura	Amazon Web Services
Runtime	Node.js 22


Arquitectura de producción
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
Servicio	Responsabilidad
Amazon EC2	Servidor Ubuntu que ejecuta la aplicación
Amazon RDS	Base de datos PostgreSQL administrada
Amazon VPC	Aislamiento y configuración de red
Security Groups	Control de acceso entre servicios
Elastic IP	Dirección IP pública estable
NAT Gateway	Salida a Internet para recursos en subredes privadas
Docker	Contenerización de Next.js
Nginx	Proxy inverso
Certbot	Gestión de certificados TLS (pendiente de configurar)


La base de datos RDS no tiene acceso público. Next.js se conecta a ella por la red privada de AWS. Nginx termina HTTPS y reenvía las solicitudes al contenedor en 127.0.0.1:3000.
Estado actual: despliegue HTTP operativo. Subdominio y HTTPS pendientes de configuración.

Requisitos previos
- Node.js 20.9 o superior (Node.js 22 recomendado).
- npm y Git.
- PostgreSQL, o Docker Engine con Docker Compose.
Instalación y configuración local
1. Clonar el repositorio
git clone https://github.com/santiagotaylor543221-crypto/co-space.git
cd co-space
npm ci
2. Configurar variables de entorno
cp .env.example .env
Configura las variables de conexión y autenticación en .env:
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/cospace?schema=public"
DIRECT_URL="postgresql://USER:PASSWORD@localhost:5432/cospace?schema=public"
JWT_ACCESS_SECRET="your-access-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
DATABASE_URL y DIRECT_URL pueden apuntar a la misma base de datos cuando no se utiliza un pooler externo. Genera secretos distintos:
openssl rand -hex 32
No subas contraseñas ni secretos reales al repositorio. Si tu contraseña de PostgreSQL contiene caracteres reservados en URLs, codifícalos correctamente.
3. Aplicar migraciones
npx prisma migrate dev
4. Cargar datos iniciales (opcional, solo desarrollo)
npm run seed
5. Iniciar el servidor
npm run dev
Abre http://localhost:3000.
Ejecutar con Docker Compose (local)
El archivo docker-compose.yml inicia la aplicación y una instancia local de PostgreSQL.
1. Crear .env
cp .env.example .env
Configura al menos:
POSTGRES_DB=cospace
POSTGRES_USER=cospace
POSTGRES_PASSWORD=your-random-hex-password
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
Usa contraseñas y secretos distintos. Para POSTGRES_PASSWORD, utiliza una contraseña hexadecimal que pueda insertarse directamente en la URL de conexión generada por Compose.
2. Iniciar los contenedores
docker compose up --build -d
Compose espera a que PostgreSQL esté listo. El contenedor de la aplicación ejecuta las migraciones pendientes antes de iniciar Next.js.
3. Consultar registros
docker compose logs -f app
4. Cargar datos de prueba (opcional)
docker compose exec app npm run seed
5. Detener los contenedores
docker compose down
El volumen postgres_data conserva los datos. docker compose down -v elimina también ese volumen y sus datos.
Despliegue en AWS
Producción utiliza EC2 con Ubuntu, Docker y Nginx, y Amazon RDS PostgreSQL como base de datos externa. No se inicia un segundo PostgreSQL en Docker.
Variables de producción
En la instancia EC2 se utiliza un archivo privado .env.production:
DATABASE_URL="postgresql://USER:PASSWORD@RDS_ENDPOINT:5432/DATABASE?schema=public&sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@RDS_ENDPOINT:5432/DATABASE?schema=public&sslmode=require"
JWT_ACCESS_SECRET="your-production-access-secret"
JWT_REFRESH_SECRET="your-production-refresh-secret"
AUTH_ORIGIN=https://cospace.san.coderhivex.com
AWS_REGION=us-east-2
AWS_S3_BUCKET=nombre-del-bucket-privado
NODE_ENV=production
Este archivo no debe incluirse en Git. Restringe sus permisos con chmod 600 .env.production. sslmode=require cifra el tráfico, pero no sustituye la verificación completa del certificado del servidor.
Docker Compose de producción
El archivo docker-compose.prod.yml se creó en la EC2. Para reproducir el despliegue desde un clon nuevo, es necesario agregarlo también al repositorio:
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
Construir e iniciar
sudo docker compose --env-file .env.production -f docker-compose.prod.yml build
sudo docker compose --env-file .env.production -f docker-compose.prod.yml up -d
Revisar el estado
sudo docker compose --env-file .env.production -f docker-compose.prod.yml ps
sudo docker compose --env-file .env.production -f docker-compose.prod.yml logs -f app
El Dockerfile ejecuta prisma migrate deploy antes de npm run start, aplicando las migraciones pendientes a RDS. No ejecutes el seed con cuentas de prueba en producción.
### Nginx y autenticación en producción

1. Pasa `AUTH_ORIGIN=https://cospace.san.coderhivex.com` al proceso Node mediante el `env_file` del servicio que se ejecuta en EC2. Usa el origen HTTPS sin barra final. Configura `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET` con valores independientes generados con `openssl rand -hex 32`. El modo `next dev` admite los orígenes locales directos sin `AUTH_ORIGIN`.
2. Mantén el puerto del contenedor publicado en `127.0.0.1:3000` y fuera del acceso público. En el bloque HTTPS existente de Nginx, con `server_name cospace.san.coderhivex.com`, configura el `location /` así. Conserva el certificado, los límites de subidas y las demás directivas del sitio. Mantén la redirección HTTP a HTTPS y rechaza hosts desconocidos en el servidor por defecto.

   ```nginx
   location / {
       proxy_pass http://127.0.0.1:3000;
       proxy_set_header Host cospace.san.coderhivex.com;
       proxy_set_header X-Forwarded-Host cospace.san.coderhivex.com;
       proxy_set_header X-Forwarded-Proto https;
       proxy_set_header X-Forwarded-Port 443;
       proxy_set_header X-Forwarded-For $remote_addr;
       proxy_set_header X-CoSpace-Client-IP $remote_addr;
       proxy_redirect off;
   }
   ```

3. Configura `AUTH_TRUST_PROXY=1` en el contenedor únicamente después de verificar que Nginx sobrescribe `X-CoSpace-Client-IP` y que el servicio solo es accesible a través del proxy. Con Nginx directamente expuesto, `$remote_addr` es el par TCP. Si hay un balanceador delante, configura la recuperación de la IP solo para los rangos de ese intermediario confiable. Sin confianza explícita, la aplicación usa un cupo compartido. Si hay reglas de caché en Nginx, respeta `Cache-Control: private, no-store` en las rutas de sesión, invitados, reservas y administración.
4. Valida el archivo con `sudo nginx -t` antes de recargar Nginx e iniciar el contenedor con las variables actualizadas. Este cambio de autenticación no requiere una migración. Las sesiones emitidas por la versión anterior requieren un nuevo login y conservan las contraseñas existentes.

### Verificación de autenticación

- Tras el despliegue, comprueba en una ventana privada que `/dashboard`, `/mis-reservas` y `/admin` llevan al login. Verifica que `Location` sea una ruta relativa o que tenga el origen público HTTPS. Comprueba que `GET /api/bookings` y `GET /api/admin/users` sin sesión devuelvan 401.
- Con una cuenta de pruebas USER, inicia sesión, recarga, abre `/login` y `/register` desde otra pestaña y comprueba que ambas llevan a `/dashboard`. Verifica que el acceso a `/admin` redirige al dashboard y que la API administrativa devuelve 403. Repite con una cuenta ADMIN y verifica la redirección a `/admin` y el acceso administrativo.
- Revisa en DevTools las cookies `HttpOnly; Secure; SameSite=Lax; Path=/` y las respuestas sensibles `private, no-store`. Tras 15 minutos sin renovar, abre una página privada y comprueba que el navegador llama a `POST /api/auth/refresh` y vuelve a la página. Cierra sesión y prueba Atrás, Adelante y la segunda pestaña. Usa una cuenta de pruebas aislada para comprobar el 429 y `Retry-After`.
- Si persisten los 401 pese a usar el mismo correo y contraseña, compara las revisiones de imagen activas y que registro y login apunten a la misma base y esquema. Revisa el código HTTP y el evento de autenticación por hora, sin registrar payloads, cookies ni cadenas de conexión. Los errores de configuración, conexión o consulta se manifiestan como 500.
- Ejecuta las pruebas aisladas con `npm run test:auth`. Para incluir la prueba HTTP, inicia Next.js contra un PostgreSQL temporal de loopback con el esquema aplicado y secretos de prueba. Define `AUTH_TEST_URL` con ese origen local y `AUTH_TEST_DATABASE_URL` con la URL del PostgreSQL temporal. El caso integrado crea sus propios datos de prueba en esa base.

El límite en memoria se reinicia al arrancar el proceso. Cada instancia tiene sus propios contadores. Las ventanas son fijas y los intentos rechazados no las prolongan. Login admite 40 intentos por IP y 8 por identificador cada 15 minutos, registro 20 por IP y 5 por identificador cada 15 minutos y renovación 120 por IP y 12 por cuenta cada minuto. Una cuenta conserva una sola sesión de hasta siete días, compartida por las pestañas del mismo navegador. Un login nuevo sustituye la sesión anterior. Para sesiones independientes por dispositivo se necesitaría una tabla de sesiones con caducidad y revocación individuales.

Cuentas de prueba
⚠️ Solo para desarrollo. No utilices estas credenciales en producción.

<details>
<summary>Mostrar cuentas de prueba</summary>Rol	Correo	Contraseña
Administrador	admin@coworking.com	admin123
Usuario	santiago@coworking.com	user123


El seed crea espacios iniciales cuando la tabla de espacios está vacía.
</details>Comandos disponibles
Comando	Descripción
npm run dev	Servidor de desarrollo
npm run build	Compilación para producción
npm run start	Inicio de la aplicación compilada
npm run lint	Ejecución de ESLint
npm run seed	Datos iniciales de desarrollo
npx prisma generate	Generación de Prisma Client
npx prisma migrate dev	Migraciones en desarrollo
npx prisma migrate deploy	Aplicación de migraciones pendientes


Estructura del proyecto
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
├── docker-compose.prod.yml  # Creado en EC2; pendiente de subir al repo
├── next.config.ts
├── package.json
├── prisma.config.ts
└── tsconfig.json
Seguridad
- RDS sin acceso público y acceso restringido mediante Security Groups.
- Comunicación cifrada entre Prisma y PostgreSQL.
- Secretos fuera del control de versiones.
- Contenedor ejecutado con usuario no root.
- Puerto de Next.js publicado únicamente en localhost.
- Separación entre desarrollo local y producción.
- Migraciones gestionadas con Prisma.
- HTTPS pendiente de configurar.
Para un entorno productivo definitivo, se recomienda verificar el certificado TLS de RDS, configurar respaldos, monitoreo y un procedimiento de recuperación.
Estado del proyecto
Aplicación desplegada en AWS y accesible por HTTP. Infraestructura principal operativa: Next.js, Docker, Nginx y Amazon RDS PostgreSQL.

Pendiente:
- Asociación del subdominio.
- Certificado HTTPS mediante Certbot.
- Validación funcional de los flujos principales en producción.
Autor
Santiago Taylor

GitHub: santiagotaylor543221-crypto
<p align="center">
  <strong>CoSpace</strong><br>
  Plataforma de reservas de espacios de coworking.
</p>

## Administración de espacios y fotografías

La sección Espacios permite buscar, filtrar por estado/tipo, ordenar y crear o editar con vista previa. Las ediciones usan `PATCH /api/admin/workspaces/:id`. Archivar conserva las reservas existentes y bloquea nuevas reservas; no cancela las anteriores.

El formulario incluye ilustraciones y subida de JPG, PNG o WebP (máximo 5 MB y 25 megapíxeles). El servidor valida el contenido, elimina metadatos al recodificar y guarda WebP de hasta 1600 × 1200. La subida requiere sesión ADMIN. Las fotografías se sirven públicamente para mostrarlas en el catálogo.

Configura `AWS_REGION` con la región del bucket y `AWS_S3_BUCKET` con su nombre. En producción, el SDK obtiene credenciales temporales del rol IAM de EC2. Las variables son de servidor y el bucket permanece privado.

Las nuevas subidas se guardan en `originals/spaces/`. Las cinco fotos del catálogo se leen de `originals/catalog/`. Las rutas públicas de CoSpace usan una URL prefirmada internamente y transmiten el WebP desde el servidor. La URL, la firma y los errores detallados de S3 quedan fuera de la respuesta al navegador. La aplicación devuelve 404 ante un objeto inexistente confirmado por S3 y 503 ante fallos de almacenamiento. Si el rol carece de `s3:ListBucket`, S3 puede devolver 403 para un objeto inexistente. En ese caso CoSpace devuelve 503 porque S3 no permite distinguirlo de una denegación de acceso.

Las fotos de espacios ya guardadas en disco conservan su URL. Su lectura prioriza el directorio `WORKSPACE_UPLOAD_DIR`, que por defecto es `./data/workspace-images`. Conserva el volumen existente mientras haya fotos locales referenciadas. Las ilustraciones de `public/images/` siguen disponibles en sus rutas estáticas.

Las imágenes no se borran automáticamente al sustituirlas o archivar un espacio. Una subida completada cuyo guardado de datos falle también puede dejar un archivo sin referencia; conservarlos evita eliminar fotos usadas y permite una limpieza posterior con comprobación de referencias.

Ejecuta `npm run test:workspaces` para comprobar espacios y fotos con transporte y almacenamiento simulados. La suite firma URLs de prueba localmente y funciona sin base de datos ni acceso a AWS.
