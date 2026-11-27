import { createHash } from 'node:crypto';
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import sharp from 'sharp';

const SOURCE_PREFIX = 'originals/';
const DESTINATION_PREFIX = 'thumbnails/';
const MAX_SOURCE_BYTES = 10 * 1024 * 1024;
const MAX_SOURCE_PIXELS = 25_000_000;
const MAX_WRITE_ATTEMPTS = 3;

class ProcessingError extends Error {}

function integerSetting(env, name, defaultValue, max) {
  const value = env[name];
  if (value === undefined) return defaultValue;
  if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > max) {
    throw new Error(`Invalid ${name}`);
  }
  return Number(value);
}

function readConfig(env) {
  const bucket = env.AWS_S3_BUCKET;
  if (!bucket?.trim()) throw new Error('Missing AWS_S3_BUCKET');
  return {
    bucket,
    width: integerSetting(env, 'THUMBNAIL_WIDTH', 480, 1600),
    height: integerSetting(env, 'THUMBNAIL_HEIGHT', 480, 1600),
    quality: integerSetting(env, 'THUMBNAIL_QUALITY', 78, 100),
  };
}

function canonicalSequencer(value) {
  if (typeof value !== 'string' || !/^[\da-f]{1,128}$/i.test(value)) return undefined;
  return value.toLowerCase().replace(/^0+(?=.)/, '');
}

function parseRecord(record, bucket) {
  if (record?.eventSource !== 'aws:s3' || typeof record.eventName !== 'string' ||
      !record.eventName.startsWith('ObjectCreated:')) {
    return 'unsupported_event';
  }
  if (record.s3?.bucket?.name !== bucket) return 'unexpected_bucket';

  const object = record.s3.object;
  if (typeof object?.key !== 'string') return 'malformed_record';
  let key;
  try {
    key = decodeURIComponent(object.key.replace(/\+/g, ' '));
  } catch {
    return 'invalid_key_encoding';
  }
  if (!key.startsWith(SOURCE_PREFIX) || key.endsWith('/')) return 'outside_source_objects';

  const destinationKey = DESTINATION_PREFIX + key.slice(SOURCE_PREFIX.length);
  if (Buffer.byteLength(destinationKey) > 1024) return 'destination_key_too_long';
  const sequencer = canonicalSequencer(object.sequencer);
  const etag = typeof object.eTag === 'string' && object.eTag.replace(/^"|"$/g, '');
  if (!sequencer || !etag || !/^[\x21\x23-\x7e]+$/.test(etag)) return 'malformed_record';
  if (object.versionId != null && typeof object.versionId !== 'string') return 'malformed_record';
  return {
    key,
    destinationKey,
    etag: `"${etag}"`,
    versionId: object.versionId ?? 'null',
    sequencer,
  };
}

function statusCode(error) {
  const status = error?.$metadata?.httpStatusCode;
  return Number.isInteger(status) && status >= 400 && status <= 599 ? status : undefined;
}

async function headDestination(s3, destination) {
  try {
    return await s3.send(new HeadObjectCommand(destination));
  } catch (error) {
    if (statusCode(error) === 404) return undefined;
    throw error;
  }
}

async function readSource(s3, bucket, source) {
  let object;
  try {
    object = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: source.key, IfMatch: source.etag }));
  } catch (error) {
    if (statusCode(error) === 412) return 'superseded';
    if (error?.name === 'NoSuchKey') return 'source_missing';
    throw error;
  }
  if (!object.Body) throw new ProcessingError('missing_source_body');
  if ((object.VersionId ?? 'null') !== source.versionId) {
    object.Body.destroy();
    return 'superseded';
  }
  if (object.ContentLength > MAX_SOURCE_BYTES) {
    object.Body.destroy();
    return 'source_too_large';
  }

  const chunks = [];
  let length = 0;
  for await (const chunk of object.Body) {
    length += chunk.length;
    if (length > MAX_SOURCE_BYTES) return 'source_too_large';
    chunks.push(chunk);
  }
  return Buffer.concat(chunks, length);
}

function isSupportedImage(bytes) {
  return bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])) ||
    bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) ||
    (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP');
}

async function renderThumbnail(bytes, config, sequencer) {
  if (!isSupportedImage(bytes)) return 'unsupported_image';

  // Make the destination ETag change even when two source revisions render the same pixels.
  const id = createHash('sha256').update(sequencer).digest('hex');
  const xmp = `<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description rdf:about="" xmlns:xmpMM="http://ns.adobe.com/xap/1.0/mm/" xmpMM:InstanceID="urn:sha256:${id}"/></rdf:RDF></x:xmpmeta>`;
  try {
    return await sharp(bytes, { limitInputPixels: MAX_SOURCE_PIXELS, failOn: 'warning', animated: false })
      .autoOrient()
      .resize({ width: config.width, height: config.height, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: config.quality, effort: 4 })
      .withXmp(xmp)
      .toBuffer();
  } catch {
    return 'invalid_image';
  }
}

async function processRecord(s3, config, source) {
  const destination = { Bucket: config.bucket, Key: source.destinationKey };
  for (let attempt = 0; attempt < MAX_WRITE_ATTEMPTS; attempt++) {
    const current = await headDestination(s3, destination);
    const previous = canonicalSequencer(current?.Metadata?.['source-sequencer']);
    if (previous === source.sequencer) return 'duplicate';
    if (previous && BigInt(`0x${previous}`) > BigInt(`0x${source.sequencer}`)) return 'superseded';
    if (current && !current.ETag) throw new ProcessingError('missing_destination_etag');

    const bytes = await readSource(s3, config.bucket, source);
    if (typeof bytes === 'string') return bytes;
    const thumbnail = await renderThumbnail(bytes, config, source.sequencer);
    if (typeof thumbnail === 'string') return thumbnail;

    try {
      await s3.send(new PutObjectCommand({
        ...destination,
        Body: thumbnail,
        ContentType: 'image/webp',
        Metadata: { 'source-sequencer': source.sequencer },
        ...(current ? { IfMatch: current.ETag } : { IfNoneMatch: '*' }),
      }));
      return 'created';
    } catch (error) {
      const status = statusCode(error);
      if (status !== 409 && status !== 412 && !(current && status === 404 && error?.name === 'NoSuchKey')) {
        throw error;
      }
    }
  }
  throw new ProcessingError('destination_write_conflict');
}

export function createHandler({ s3, env = process.env, logger = console }) {
  return async function handle(event, context) {
    const config = readConfig(env);
    const records = Array.isArray(event?.Records) ? event.Records : [];
    const invocation = { requestId: context?.awsRequestId };
    const counts = { created: 0, skipped: 0, failed: 0 };

    for (const [recordIndex, record] of records.entries()) {
      const logContext = { ...invocation, recordIndex };
      try {
        const source = parseRecord(record, config.bucket);
        const result = typeof source === 'string' ? source : await processRecord(s3, config, source);
        counts[result === 'created' ? 'created' : 'skipped']++;
        logger.info({ event: 'thumbnail_record', ...logContext, result });
      } catch (error) {
        counts.failed++;
        logger.error({
          event: 'thumbnail_record',
          ...logContext,
          result: error instanceof ProcessingError ? error.message : 'storage_error',
          httpStatus: statusCode(error),
        });
      }
    }

    logger.info({ event: 'thumbnail_batch', ...invocation, ...counts });
    if (counts.failed) throw new Error(`Thumbnail processing failed for ${counts.failed} record(s)`);
    return counts;
  };
}

export const handler = createHandler({ s3: new S3Client({}) });
