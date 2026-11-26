import { test } from "node:test";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import sharp from "sharp";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));

// Load actual TS modules and inject dependencies before any production client can load.
function load(relative, mocks = {}, fetchImage = () => assert.fail("Unexpected network request")) {
  const filename = path.resolve(testDirectory, "..", relative);
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  });
  const loadedModule = { exports: {} };
  const requireFromFile = createRequire(filename);
  const resolve = (id) => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    assert.ok(!id.startsWith("@/"), `Missing explicit mock for ${id}`);
    return requireFromFile(id);
  };
  new Function("require", "module", "exports", "fetch", outputText)(
    resolve, loadedModule, loadedModule.exports, fetchImage,
  );
  return loadedModule.exports;
}
// Las comprobaciones del guard se cubren en tests/auth.test.mjs.
const adminGuard = { protectApi: (_role, handler) => (request, ...args) => handler({ role: 'ADMIN' }, request, ...args) };

const schema = load("src/lib/workspace-schema.ts");
const valid = { name: "  Sala Horizonte  ", description: "Una sala tranquila", type: "MEETING_ROOM", capacity: 6, pricePerHour: 15.5, imageUrl: "/images/spaces/meeting-room-1.svg" };

test("workspace validation trims text and rejects invalid capacity, tariff, and image URLs", () => {
  assert.equal(schema.workspaceSchema.parse(valid).name, "Sala Horizonte");
  for (const change of [{ capacity: 0 }, { capacity: 1.5 }, { pricePerHour: -1 }, { name: " " }, { description: "" }, { imageUrl: "javascript:alert(1)" }, { imageUrl: "//external.test/photo" }, { type: "UNKNOWN" }]) {
    assert.equal(schema.workspaceSchema.safeParse({ ...valid, ...change }).success, false);
  }
  assert.equal(schema.workspaceImages("MEETING_ROOM").length, 3);
});

test("create then PATCH edits and archives an existing workspace without deleting it", async () => {
  const rows = new Map();
  const prisma = { workspace: {
    create: async ({ data }) => { const record = { ...data, id: "space-1", isActive: true }; rows.set(record.id, record); return record; },
    findUnique: async ({ where }) => rows.get(where.id),
    update: async ({ where, data }) => { const record = { ...rows.get(where.id), ...data }; rows.set(where.id, record); return record; },
  } };
  const mocks = { "@/lib/auth/api": adminGuard, "@/lib/prisma": { prisma }, "@/lib/workspace-schema": schema };
  const create = load("src/app/api/admin/workspaces/route.ts", mocks);
  const edit = load("src/app/api/admin/workspaces/[id]/route.ts", mocks);
  const request = (body, method = "POST") => new Request("http://localhost/api/admin/workspaces", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const created = await create.POST(request(valid));
  assert.equal(created.status, 201);
  const context = { params: Promise.resolve({ id: "space-1" }) };
  const edited = await edit.PATCH(request({ name: "Sala Norte", capacity: 8 }, "PATCH"), context);
  assert.equal(edited.status, 200);
  assert.equal((await edited.json()).capacity, 8);
  const archived = await edit.PATCH(request({ isActive: false }, "PATCH"), context);
  assert.equal((await archived.json()).isActive, false);
  assert.equal(rows.size, 1);
  const bad = await edit.PATCH(request({ capacity: 0 }, "PATCH"), context);
  assert.equal(bad.status, 400);
  assert.ok((await bad.json()).fieldErrors.capacity);
  const missing = await edit.PATCH(request({ name: "Other" }, "PATCH"), { params: Promise.resolve({ id: "absent" }) });
  assert.equal(missing.status, 404);
});

const bucket = "test-private-bucket";
const awsDetail = "internal-aws-details";
const origin = "https://app.example.test";

function setTestEnv(t, key, value) {
  const previous = process.env[key];
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
  t.after(() => {
    if (previous === undefined) delete process.env[key];
    else process.env[key] = previous;
  });
}

function imageRoutes(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "cospace-photos-test-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  setTestEnv(t, "WORKSPACE_UPLOAD_DIR", directory);
  setTestEnv(t, "AWS_S3_BUCKET", bucket);
  setTestEnv(t, "AUTH_ORIGIN", origin);

  const objects = new Map();
  const puts = [];
  const signedRequests = [];
  const downloads = [];
  const state = { role: "ADMIN", writeError: null, signError: null, readError: null, upstreamError: null };
  const signer = new S3Client({
    region: "us-east-2",
    endpoint: "https://storage.example.test",
    forcePathStyle: true,
    credentials: { accessKeyId: "test-access-id", secretAccessKey: "test-secret-key", sessionToken: "test-session-token" },
    requestHandler: { handle: () => assert.fail("The offline signer must never send a request") },
  });
  t.after(() => signer.destroy());

  const client = { send: async (command) => {
    assert.ok(command instanceof PutObjectCommand);
    assert.equal(command.input.Bucket, bucket);
    puts.push(command.input);
    if (state.writeError) throw state.writeError;
    objects.set(command.input.Key, command.input.Body);
  } };
  const storage = load("src/lib/s3-storage.ts", {
    "@/lib/s3": { s3: client },
    "@aws-sdk/s3-request-presigner": {
      getSignedUrl: async (s3, command, options) => {
        assert.equal(s3, client);
        assert.ok(command instanceof GetObjectCommand);
        signedRequests.push({ input: command.input, options });
        if (state.signError) throw state.signError;
        return getSignedUrl(signer, command, options);
      },
    },
  }, async (input, options) => {
    const url = new URL(input);
    assert.equal(url.origin, "https://storage.example.test");
    assert.ok(url.pathname.startsWith(`/${bucket}/`));
    assert.equal(url.searchParams.get("X-Amz-Expires"), "900");
    assert.equal(url.searchParams.get("X-Amz-Security-Token"), "test-session-token");
    assert.match(url.searchParams.get("X-Amz-Credential"), /^test-access-id\//);
    assert.match(url.searchParams.get("X-Amz-Signature"), /^[0-9a-f]{64}$/);
    assert.equal(options.cache, "no-store");
    assert.equal(options.redirect, "error");
    assert.ok(options.signal instanceof AbortSignal);
    const key = decodeURIComponent(url.pathname.slice(bucket.length + 2));
    downloads.push(key);
    if (state.readError) throw state.readError;
    if (state.upstreamError) {
      const { status, code } = state.upstreamError;
      return new Response(`<Error><Code>${code}</Code><Message>${awsDetail}</Message></Error>`, {
        status, headers: { "x-amz-request-id": awsDetail, "Content-Type": "application/xml" },
      });
    }
    const photo = objects.get(key);
    if (!photo) return new Response("<Error><Code>NoSuchKey</Code></Error>", { status: 404 });
    return new Response(photo, { headers: { "x-amz-request-id": awsDetail } });
  });

  const imageResponse = load("src/lib/image-response.ts", { "@/lib/s3-storage": storage });
  const upload = load("src/lib/workspace-upload.ts", { "@/lib/s3-storage": storage });
  const auth = load("src/lib/auth/api.ts", {
    "next/headers": { cookies: async () => ({ get: () => ({ value: "test-access-cookie" }) }) },
    "@/utils/auth": { ACCESS_COOKIE: "access_token" },
    "./http": load("src/lib/auth/http.ts"),
    "./paths": load("src/lib/auth/paths.ts"),
    "./session": { getAccessSession: async () => state.role ? { id: "test-user", role: state.role } : null },
  });

  const admin = load("src/app/api/admin/workspace-images/route.ts", {
    "@/lib/auth/api": auth, "@/lib/workspace-upload": upload,
  });
  const workspace = load("src/app/api/workspace-images/[id]/route.ts", {
    "@/lib/workspace-upload": upload, "@/lib/image-response": imageResponse,
  });
  const catalog = load("src/app/api/catalog-images/[name]/route.ts", {
    "@/lib/image-response": imageResponse,
  });

  return {
    directory, objects, puts, signedRequests, downloads, state, upload,
    post: (bytes, type = "image/jpeg", headers = {}) => admin.POST(
      new Request(`${origin}/api/admin/workspace-images`, {
        method: "POST", body: bytes, headers: { Origin: origin, "Content-Type": type, ...headers },
      }),
    ),
    getWorkspace: (id) => workspace.GET(new Request(origin), { params: Promise.resolve({ id }) }),
    getCatalog: (name) => catalog.GET(new Request(origin), { params: Promise.resolve({ name }) }),
  };
}

function jpeg(width = 40, height = 30) {
  return sharp({ create: { width, height, channels: 3, background: "#ff5b2e" } }).jpeg().toBuffer();
}

function assertCleanHeaders(response) {
  assert.equal(response.headers.has("Location"), false);
  assert.equal(response.headers.has("x-amz-request-id"), false);
  assert.doesNotMatch(JSON.stringify([...response.headers]), /storage\.example|test-private-bucket|test-session-token|test-access-id|internal-aws-details/i);
}

test("authorized uploads normalize to WebP and use the original workspace image route", async (t) => {
  const routes = imageRoutes(t);
  const original = await jpeg(2000, 1500);
  const response = await routes.post(original);
  assert.equal(response.status, 201);
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  assertCleanHeaders(response);
  const { imageUrl } = await response.json();
  const id = imageUrl.split("/").at(-1);
  assert.equal(imageUrl, `/api/workspace-images/${id}`);
  assert.ok(routes.upload.isImageId(id));
  assert.equal(routes.puts.length, 1);
  const [put] = routes.puts;
  assert.equal(put.Key, `originals/spaces/${id}`);
  assert.equal(put.ContentType, "image/webp");
  const { format, width, height } = await sharp(put.Body).metadata();
  assert.deepEqual({ format, width, height }, { format: "webp", width: 1600, height: 1200 });
  assert.equal(await routes.upload.readPhoto(id), null);

  const served = await routes.getWorkspace(id);
  assert.equal(served.status, 200);
  assert.equal(served.headers.get("Content-Type"), "image/webp");
  assert.equal(served.headers.get("Cache-Control"), "no-store");
  assert.equal(served.headers.get("X-Content-Type-Options"), "nosniff");
  assertCleanHeaders(served);
  assert.deepEqual(Buffer.from(await served.arrayBuffer()), put.Body);
  assert.deepEqual(routes.signedRequests, [{ input: { Bucket: bucket, Key: put.Key }, options: { expiresIn: 900 } }]);
  assert.deepEqual(routes.downloads, [put.Key]);
});

test("invalid input and unauthorized uploads are rejected before writing to S3", async (t) => {
  const routes = imageRoutes(t);
  const validBytes = await jpeg();

  routes.state.role = null;
  assert.equal((await routes.post(validBytes)).status, 401);
  routes.state.role = "USER";
  assert.equal((await routes.post(validBytes)).status, 403);
  routes.state.role = "ADMIN";
  assert.equal((await routes.post(validBytes, "image/jpeg", { Origin: "https://other.example.test" })).status, 403);

  assert.equal((await routes.post(Buffer.from("fake image"))).status, 400);
  assert.equal((await routes.post(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg' width='5' height='5'/>"))).status, 400);
  assert.equal((await routes.post(validBytes, "image/svg+xml")).status, 415);
  assert.equal((await routes.post(validBytes, "image/jpeg", { "Content-Length": String(routes.upload.MAX_IMAGE_BYTES + 1) })).status, 413);
  assert.equal((await routes.post(Buffer.alloc(routes.upload.MAX_IMAGE_BYTES + 1))).status, 413);
  assert.equal((await routes.post(Buffer.alloc(0))).status, 400);
  const largeInPixels = await jpeg(5001, 5000);
  assert.equal((await routes.post(largeInPixels)).status, 400);
  assert.equal(routes.puts.length, 0);
});

test("S3 credentials, permissions and connectivity failures produce generic upload 503s", async (t) => {
  const routes = imageRoutes(t);
  const errorLog = t.mock.method(console, "error", () => {});
  const bytes = await jpeg();
  for (const name of ["CredentialsProviderError", "AccessDenied", "TimeoutError"]) {
    routes.state.writeError = Object.assign(new Error(awsDetail), { name });
    const response = await routes.post(bytes);
    assert.equal(response.status, 503);
    assertCleanHeaders(response);
    assert.deepEqual(await response.json(), { error: "No se pudo almacenar la imagen. Intenta de nuevo más tarde." });
  }
  routes.state.writeError = null;
  delete process.env.AWS_S3_BUCKET;
  const misconfigured = await routes.post(bytes);
  assert.equal(misconfigured.status, 503);
  assert.doesNotMatch(await misconfigured.text(), /AWS_S3_BUCKET|internal-aws-details/);
  assert.equal(routes.puts.length, 3);
  assert.equal(errorLog.mock.callCount(), 4);
  for (const { arguments: args } of errorLog.mock.calls) {
    assert.deepEqual(args, ["Could not store a workspace image"]);
  }
});

test("local workspace WebPs retain precedence and immutable caching", async (t) => {
  const routes = imageRoutes(t);
  const id = `${randomUUID()}.webp`;
  const photo = await sharp(await jpeg()).webp().toBuffer();
  fs.writeFileSync(path.join(routes.directory, id), photo);
  const response = await routes.getWorkspace(id);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Content-Type"), "image/webp");
  assert.equal(response.headers.get("Cache-Control"), "public, max-age=31536000, immutable");
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), photo);
  assert.equal(await routes.upload.readPhoto("../private"), null);
  assert.equal((await routes.getWorkspace("../private")).status, 404);
  assert.deepEqual(routes.signedRequests, []);
});

test("catalog serves the five allowlisted S3 objects via server-side presigning", async (t) => {
  const routes = imageRoutes(t);
  const photo = await sharp(await jpeg()).webp().toBuffer();
  const names = [
    "sala-duo.webp", "sala-reuniones-creativa.webp", "gaming-room.webp",
    "cabina-privada-llamadas.webp", "escritorio-flex-zona-a.webp",
  ];
  for (const name of names) {
    const key = `originals/catalog/${name}`;
    routes.objects.set(key, photo);
    const response = await routes.getCatalog(name);
    assert.equal(response.status, 200);
    assertCleanHeaders(response);
    assert.equal(response.headers.get("Content-Type"), "image/webp");
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), photo);
    assert.equal(routes.downloads.at(-1), key);
  }
  assert.equal((await routes.getCatalog("unknown.webp")).status, 404);
  assert.equal((await routes.getCatalog("../spaces/photo.webp")).status, 404);
  assert.equal(routes.signedRequests.length, names.length);
});

test("both read routes return clean 404s for missing objects and 503s for S3 failures", async (t) => {
  const routes = imageRoutes(t);
  const errorLog = t.mock.method(console, "error", () => {});
  const endpoints = [() => routes.getWorkspace(`${randomUUID()}.webp`), () => routes.getCatalog("sala-duo.webp")];
  for (const get of endpoints) {
    const missing = await get();
    assert.equal(missing.status, 404);
    assert.equal(missing.headers.get("Cache-Control"), "no-store");
    assertCleanHeaders(missing);
    assert.equal(await missing.text(), "");

    for (const error of [{ status: 403, code: "AccessDenied" }, { status: 404, code: "NoSuchBucket" }, { status: 500, code: "InternalError" }]) {
      routes.state.upstreamError = error;
      const response = await get();
      assert.equal(response.status, 503);
      assertCleanHeaders(response);
      assert.equal(await response.text(), "");
    }
    routes.state.upstreamError = null;

    for (const field of ["signError", "readError"]) {
      routes.state[field] = new Error(awsDetail);
      const response = await get();
      assert.equal(response.status, 503);
      assertCleanHeaders(response);
      assert.equal(await response.text(), "");
      routes.state[field] = null;
    }
  }
  assert.equal(errorLog.mock.callCount(), 10);
  for (const { arguments: args } of errorLog.mock.calls) {
    assert.deepEqual(args, ["Could not read an image from object storage"]);
  }
});
