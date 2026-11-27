import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';
import { test } from 'node:test';
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { createHandler } from './index.mjs';

const bucket = 'cospace-test-bucket';
const photoKey = 'originals/spaces/photo.webp';
const thumbnailKey = 'thumbnails/spaces/photo.webp';

function record(key, { etag = 'source-etag', sequencer = 'A', versionId, eventName = 'ObjectCreated:Put' } = {}) {
  return {
    eventSource: 'aws:s3',
    eventName,
    s3: {
      bucket: { name: bucket },
      object: { key: encodeURIComponent(key).replace(/%20/g, '+'), eTag: etag, sequencer, versionId },
    },
  };
}

function s3Error(status, name, message = name) {
  return Object.assign(new Error(message), { name, $metadata: { httpStatusCode: status } });
}

function harness(env = {}) {
  const sources = new Map();
  const thumbnails = new Map();
  const calls = [];
  const logs = [];
  const mock = {
    async send(command) {
      const input = command.input;
      assert.equal(input.Bucket, bucket);
      calls.push(command);
      await mock.beforeSend?.(command);
      if (command instanceof GetObjectCommand) {
        assert.ok(input.Key.startsWith('originals/'));
        assert.equal(input.VersionId, undefined);
        const source = sources.get(input.Key);
        if (!source) throw s3Error(404, 'NoSuchKey');
        if (input.IfMatch !== `"${source.etag}"`) throw s3Error(412, 'PreconditionFailed');
        return {
          Body: source.stream?.() ?? Readable.from([source.bytes]),
          ContentLength: source.length ?? source.bytes?.length,
          VersionId: source.versionId,
        };
      }
      assert.ok(input.Key.startsWith('thumbnails/'));
      const current = thumbnails.get(input.Key);
      if (command instanceof HeadObjectCommand) {
        if (!current) throw s3Error(404, 'NotFound');
        return current;
      }
      assert.ok(command instanceof PutObjectCommand);
      assert.ok(input.IfNoneMatch === '*' || input.IfMatch);
      if (input.IfNoneMatch === '*' ? current : input.IfMatch !== current?.ETag) {
        throw s3Error(412, 'PreconditionFailed');
      }
      const hash = createHash('md5').update(input.Body).digest('hex');
      thumbnails.set(input.Key, { ...input, ETag: `"${hash}"` });
    },
  };
  const handle = createHandler({
    s3: mock,
    env: { AWS_S3_BUCKET: bucket, ...env },
    logger: {
      info: (entry) => logs.push({ level: 'info', ...entry }),
      error: (entry) => logs.push({ level: 'error', ...entry }),
    },
  });
  return {
    sources, thumbnails, calls, logs, mock,
    run: (...records) => handle({ Records: records }, { awsRequestId: 'lambda-request-id' }),
    handle,
  };
}

function image(width, height, color = 'red') {
  return sharp({ create: { width, height, channels: 3, background: color } });
}

test('procesa varios registros, decodifica una vez y conserva carpetas, nombre y proporción', async () => {
  const { run, sources, thumbnails } = harness({ THUMBNAIL_WIDTH: '320', THUMBNAIL_HEIGHT: '240' });
  const key = 'originals/spaces/nivel 1/Café + 100% %2F.png';
  const portraitKey = 'originals/catalog/vertical.jpg';
  const smallKey = 'originals/catalog/small.webp';
  sources.set(key, { bytes: await image(800, 400).png().toBuffer(), etag: 'source-etag' });
  sources.set(portraitKey, {
    bytes: await image(800, 400).withExif({ IFD0: { Artist: 'private' } }).withMetadata({ orientation: 6 }).jpeg().toBuffer(),
    etag: 'source-etag',
  });
  sources.set(smallKey, { bytes: await image(50, 100).webp().toBuffer(), etag: 'source-etag' });

  const result = await run(record(key), record(portraitKey, { eventName: 'ObjectCreated:Copy' }),
    record(smallKey, { eventName: 'ObjectCreated:CompleteMultipartUpload' }));
  assert.deepEqual(result, { created: 3, skipped: 0, failed: 0 });

  for (const [sourceKey, expectedSize] of [[key, [320, 160]], [portraitKey, [120, 240]], [smallKey, [50, 100]]]) {
    const output = thumbnails.get(sourceKey.replace('originals/', 'thumbnails/'));
    assert.equal(output.ContentType, 'image/webp');
    assert.equal(output.IfNoneMatch, '*');
    const metadata = await sharp(output.Body).metadata();
    assert.equal(metadata.format, 'webp');
    assert.deepEqual([metadata.width, metadata.height], expectedSize);
    assert.equal(metadata.exif, undefined);
    assert.ok(!metadata.xmp.includes(Buffer.from('private')));
  }
});

test('ignora el prefijo de salida, otros buckets, eventos ajenos y claves inválidas sin consultar S3', async () => {
  const { run, handle, calls, logs } = harness();
  const malformed = record(photoKey);
  malformed.s3.object.key = 'originals/%invalid';
  const otherBucket = record(photoKey);
  otherBucket.s3.bucket.name = 'another-bucket';
  const invalidSequence = record(photoKey, { sequencer: 'no-hex' });

  const counts = await run(record(thumbnailKey), record('originals-extra/photo.webp'), record('originals/folder/'),
    malformed, otherBucket, invalidSequence, record(photoKey, { eventName: 'ObjectRemoved:Delete' }),
    record(`originals/${'a'.repeat(1014)}`));
  assert.deepEqual(counts, { created: 0, skipped: 8, failed: 0 });
  assert.deepEqual(await handle({ Service: 'Amazon S3', Event: 's3:TestEvent' }), { created: 0, skipped: 0, failed: 0 });
  assert.equal(calls.length, 0);
  assert.ok(logs.some(({ result }) => result === 'invalid_key_encoding'));
  assert.ok(logs.some(({ result }) => result === 'destination_key_too_long'));
});

test('descarta contenido ajeno, imágenes dañadas, objetos borrados y cuerpos grandes', async () => {
  const { run, sources, logs, thumbnails } = harness();
  sources.set('originals/corrupt.png', {
    bytes: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), etag: 'source-etag',
  });
  sources.set('originals/disguised.webp', { bytes: Buffer.from('not an image'), etag: 'source-etag' });
  const flaggedStream = Readable.from([Buffer.alloc(1)]);
  sources.set('originals/large.png', { length: 11 * 1024 * 1024, stream: () => flaggedStream, etag: 'source-etag' });
  const largeStream = Readable.from([Buffer.alloc(6 * 1024 * 1024), Buffer.alloc(5 * 1024 * 1024), Buffer.alloc(1)]);
  sources.set('originals/stream.png', { stream: () => largeStream, etag: 'source-etag' });
  sources.set('originals/too-many-pixels.png', { bytes: await image(5001, 5000).png().toBuffer(), etag: 'source-etag' });

  const keys = ['corrupt.png', 'disguised.webp', 'deleted.webp', 'large.png', 'stream.png', 'too-many-pixels.png'];
  assert.deepEqual(await run(...keys.map((key) => record(`originals/${key}`))), { created: 0, skipped: 6, failed: 0 });
  assert.deepEqual(logs.filter(({ result }) => result).map(({ result }) => result), [
    'invalid_image', 'unsupported_image', 'source_missing', 'source_too_large', 'source_too_large', 'invalid_image',
  ]);
  assert.ok(flaggedStream.destroyed);
  assert.ok(largeStream.destroyed);
  assert.equal(thumbnails.size, 0);
});

test('los duplicados simultáneos solo crean una miniatura y los posteriores solo consultan metadatos', async () => {
  const { run, sources, calls, mock, thumbnails } = harness();
  sources.set(photoKey, { bytes: await image(80, 40).webp().toBuffer(), etag: 'source-etag' });
  const firstWrite = Promise.withResolvers();
  const release = Promise.withResolvers();
  mock.beforeSend = async (command) => {
    if (command instanceof PutObjectCommand && calls.filter((call) => call instanceof PutObjectCommand).length === 1) {
      firstWrite.resolve();
      await release.promise;
    }
  };
  const first = run(record(photoKey));
  await firstWrite.promise;
  try {
    assert.deepEqual(await run(record(photoKey)), { created: 1, skipped: 0, failed: 0 });
  } finally {
    release.resolve();
  }
  assert.deepEqual(await first, { created: 0, skipped: 1, failed: 0 });
  assert.equal(thumbnails.size, 1);

  calls.length = 0;
  assert.deepEqual(await run(record(photoKey, { sequencer: '000a' })), { created: 0, skipped: 1, failed: 0 });
  assert.equal(calls.length, 1);
  assert.ok(calls[0] instanceof HeadObjectCommand);
});

test('rechaza una versión vieja aunque el ETag del original siga siendo igual', async () => {
  const { run, sources, logs } = harness();
  sources.set(photoKey, { bytes: await image(80, 40).webp().toBuffer(), etag: 'source-etag', versionId: 'current' });
  assert.deepEqual(await run(record(photoKey, { versionId: 'old' })), { created: 0, skipped: 1, failed: 0 });
  assert.deepEqual(await run(record(photoKey, { etag: 'old', versionId: 'current' })), { created: 0, skipped: 1, failed: 0 });
  assert.ok(logs.some(({ result }) => result === 'superseded'));
  assert.deepEqual(await run(record(photoKey, { versionId: 'current' })), { created: 1, skipped: 0, failed: 0 });
});

test('una escritura tardía no sobrepasa una revisión nueva con los píxeles de una revisión anterior', async () => {
  const { run, sources, mock, thumbnails } = harness();
  const red = await image(80, 40, 'red').webp().toBuffer();
  const blue = await image(80, 40, 'blue').webp().toBuffer();
  sources.set(photoKey, { bytes: red, etag: 'red-etag' });
  await run(record(photoKey, { etag: 'red-etag', sequencer: 'e' }));
  const initial = thumbnails.get(thumbnailKey);

  const delayedWrite = Promise.withResolvers();
  const release = Promise.withResolvers();
  mock.beforeSend = async (command) => {
    if (command instanceof PutObjectCommand && command.input.Metadata['source-sequencer'] === 'f') {
      delayedWrite.resolve();
      await release.promise;
    }
  };
  sources.set(photoKey, { bytes: blue, etag: 'blue-etag' });
  const delayed = run(record(photoKey, { etag: 'blue-etag', sequencer: 'f' }));
  await delayedWrite.promise;
  try {
    sources.set(photoKey, { bytes: red, etag: 'red-etag' });
    assert.deepEqual(await run(record(photoKey, { etag: 'red-etag', sequencer: '0010' })), { created: 1, skipped: 0, failed: 0 });
  } finally {
    release.resolve();
  }
  assert.deepEqual(await delayed, { created: 0, skipped: 1, failed: 0 });
  const newest = thumbnails.get(thumbnailKey);
  assert.notEqual(newest.ETag, initial.ETag);
  assert.deepEqual(await sharp(newest.Body).raw().toBuffer(), await sharp(initial.Body).raw().toBuffer());
  assert.equal(newest.Metadata['source-sequencer'], '10');
});

test('un conflicto 409 se reintenta con un HEAD nuevo', async () => {
  const { run, sources, mock, calls } = harness();
  sources.set(photoKey, { bytes: await image(80, 40).webp().toBuffer(), etag: 'source-etag' });
  mock.beforeSend = (command) => {
    if (command instanceof PutObjectCommand && calls.filter((call) => call instanceof PutObjectCommand).length === 1) {
      throw s3Error(409, 'ConditionalRequestConflict');
    }
  };
  assert.deepEqual(await run(record(photoKey)), { created: 1, skipped: 0, failed: 0 });
  assert.equal(calls.filter((call) => call instanceof HeadObjectCommand).length, 2);
});

test('continúa el lote ante errores de S3, omite datos sensibles y permite reintentar el registro fallido', async () => {
  const { run, sources, logs, mock, thumbnails } = harness();
  const privateKey = 'originals/persona-private.webp';
  const bytes = await image(80, 40).webp().toBuffer();
  sources.set(privateKey, { bytes, etag: 'source-etag' });
  sources.set(photoKey, { bytes, etag: 'source-etag' });
  mock.beforeSend = (command) => {
    if (command instanceof PutObjectCommand && command.input.Key === 'thumbnails/persona-private.webp') {
      throw s3Error(403, 'AccessDenied', 'secret: aws-token, sensitive-url');
    }
  };

  await assert.rejects(run(record(privateKey), record(photoKey)), { message: 'Thumbnail processing failed for 1 record(s)' });
  assert.ok(thumbnails.has(thumbnailKey));
  assert.deepEqual(logs.find(({ level }) => level === 'error'), {
    level: 'error', event: 'thumbnail_record', requestId: 'lambda-request-id', recordIndex: 0,
    result: 'storage_error', httpStatus: 403,
  });
  assert.doesNotMatch(JSON.stringify(logs), /persona-private|cospace-test-bucket|aws-token|sensitive-url|source-etag/);

  delete mock.beforeSend;
  assert.deepEqual(await run(record(privateKey), record(photoKey)), { created: 1, skipped: 1, failed: 0 });
});

test('la configuración inválida falla antes de consultar S3', async () => {
  const missingBucket = harness({ AWS_S3_BUCKET: undefined });
  const invalidQuality = harness({ THUMBNAIL_QUALITY: '101' });
  await assert.rejects(missingBucket.run(record(photoKey)), { message: 'Missing AWS_S3_BUCKET' });
  await assert.rejects(invalidQuality.run(record(photoKey)), { message: 'Invalid THUMBNAIL_QUALITY' });
  assert.equal(missingBucket.calls.length + invalidQuality.calls.length, 0);
});
