# Miniaturas de imágenes en CoSpace

Next.js gestiona las fotos de espacios en `src/lib/workspace-upload.ts`. El servidor valida JPG, PNG y WebP, normaliza las subidas a WebP y guarda nuevas fotos en `originals/spaces/<uuid>.webp`. Las rutas públicas sirven esos originales y las fotos de `originals/catalog/` desde S3. Los espacios con fotos históricas en disco conservan esa ruta de lectura. La Lambda se instala y ejecuta por separado y genera miniaturas en el mismo bucket. Los archivos históricos del bucket requieren una carga o copia posterior que emita `ObjectCreated` si se decide procesarlos.

## Procesamiento

- El handler acepta notificaciones nativas de S3, decodifica cada clave y solo descarga objetos del bucket configurado bajo `originals/`. Cambia únicamente ese prefijo por `thumbnails/`. Por ejemplo, `originals/spaces/piso 2/foto.webp` produce `thumbnails/spaces/piso 2/foto.webp`. Si un JPG o PNG conserva su extensión histórica en la clave, S3 sirve los bytes con `Content-Type: image/webp`. Esto preserva una clave de destino distinta por cada original. [Formato del evento S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/notification-content-structure.html)
- Sharp acepta JPG, PNG y WebP según su contenido, aplica la orientación EXIF y ajusta la imagen a un rectángulo máximo de 480 × 480 de forma predeterminada. Conserva la proporción, evita ampliar imágenes y toma el primer fotograma cuando hay animación. El límite de entrada es de 10 MiB y 25 megapíxeles. El WebP descarta metadatos de la foto y lleva un identificador XMP derivado del `sequencer` para que dos revisiones con los mismos píxeles produzcan ETags distintos.
- El `sequencer` se guarda en los metadatos de S3. Una entrega repetida solo consulta el destino. Un evento más antiguo se descarta si ya hay una miniatura más reciente o si el ETag o la versión vigente del original difieren. El primer `PutObject` usa `If-None-Match: *` y las actualizaciones usan `If-Match` con el ETag del destino. Ante escrituras concurrentes, el handler vuelve a consultar el estado. [Escrituras condicionales de S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/conditional-writes.html)
- La Lambda procesa los registros secuencialmente para limitar el consumo de memoria. Las entradas descartadas quedan reflejadas en el resultado del registro. Si S3 devuelve un fallo que impide completar un registro, el handler continúa con los siguientes y falla al cerrar el lote para que Lambda pueda reintentarlo. Los logs incluyen identificador de invocación, índice, resultado y estado HTTP cuando existe. Los logs excluyen claves, nombres de buckets, payloads y mensajes crudos del SDK. [Reintentos de la invocación asíncrona](https://docs.aws.amazon.com/lambda/latest/dg/invocation-async-error-handling.html)

## Pruebas y ZIP local

Usa Node.js 24, npm 10 o posterior, Bash y Python 3. Desde la raíz del repositorio:

```bash
cd lambda/image-thumbnails
npm ci
npm test
npm run package
```

Las pruebas usan un cliente S3 simulado y Sharp real. El script instala las dependencias de producción del lockfile en un directorio temporal y selecciona los binarios Linux x64 con glibc para Amazon Linux 2023. Genera `dist/image-thumbnails.zip` con el handler y `node_modules` en la raíz. Fija el orden, las marcas de tiempo y los permisos de las entradas para reproducir el ZIP con las mismas versiones de las herramientas. [Instalación de Sharp para Lambda](https://sharp.pixelplumbing.com/install/#aws-lambda) · [Runtime Node.js 24 en Lambda](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-image.html)

## Configuración manual de AWS

| Opción | Valor inicial |
| --- | --- |
| Runtime | `nodejs24.x` |
| Arquitectura | `x86_64` |
| Handler | `index.handler` |
| Memoria | 1024 MB |
| Timeout | 60 segundos |
| Formato de logs | JSON, nivel de aplicación `INFO` |
| `AWS_S3_BUCKET` | Nombre del bucket privado de fotos (obligatorio) |
| `THUMBNAIL_WIDTH` | `480` píxeles, entero entre 1 y 1600 |
| `THUMBNAIL_HEIGHT` | `480` píxeles, entero entre 1 y 1600 |
| `THUMBNAIL_QUALITY` | `78`, entero entre 1 y 100 |

Lambda proporciona `AWS_REGION` y las credenciales temporales del rol de ejecución. Los ajustes de dimensiones y calidad se aplican cuando se procesa una revisión nueva del original. Con el formato JSON, Lambda conserva los campos del registro dentro de `message` en CloudWatch. [Logs estructurados de Node.js](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-logging.html#nodejs-logging-structured)

1. Crea el rol con confianza en `lambda.amazonaws.com` y permisos de CloudWatch Logs (`AWSLambdaBasicExecutionRole` o permisos equivalentes). Limita las operaciones de objetos de S3 mediante la siguiente política de ejemplo, sustituyendo `<BUCKET>` por el nombre real. `s3:ListBucket` permite distinguir una clave ausente de una denegación de acceso en las consultas de metadatos. [Permisos y respuestas de `HeadObject`](https://docs.aws.amazon.com/AmazonS3/latest/API/API_HeadObject.html)

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": "s3:ListBucket",
         "Resource": "arn:aws:s3:::<BUCKET>"
       },
       {
         "Effect": "Allow",
         "Action": "s3:GetObject",
         "Resource": ["arn:aws:s3:::<BUCKET>/originals/*", "arn:aws:s3:::<BUCKET>/thumbnails/*"]
       },
       {
         "Effect": "Allow",
         "Action": "s3:PutObject",
         "Resource": "arn:aws:s3:::<BUCKET>/thumbnails/*"
       }
     ]
   }
   ```

   Si el bucket usa SSE-KMS, concede en IAM y en la política de cada clave los permisos de KMS correspondientes, `kms:Decrypt` para lectura y `kms:GenerateDataKey` para escritura. [Permisos de SSE-KMS en S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingKMSEncryption.html)

2. Crea la función en la misma región que el bucket, carga el ZIP y aplica los valores de la tabla. Otorga a `s3.amazonaws.com` el permiso `lambda:InvokeFunction` en la política de la función, limitado mediante `AWS:SourceArn` al ARN del bucket y `AWS:SourceAccount` a la cuenta propietaria. [Permiso de invocación desde S3](https://docs.aws.amazon.com/lambda/latest/dg/with-s3.html)
3. Configura la notificación `s3:ObjectCreated:*` con prefijo `originals/`, incluidos ambos subdirectorios de CoSpace. Usa el prefijo como filtro para evitar invocaciones recursivas. [Filtros de notificación](https://docs.aws.amazon.com/AmazonS3/latest/userguide/notification-how-to-filtering.html)
4. Sube una foto de prueba bajo `originals/` y verifica en el bucket que la clave relativa se conserva bajo `thumbnails/` y que el objeto tiene `Content-Type: image/webp`. Comprueba en CloudWatch que la invocación registra `created`, que una repetición registra `duplicate` y que una escritura bajo `thumbnails/` queda fuera del trigger.
