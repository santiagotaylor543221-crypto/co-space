import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import sharp from "sharp";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));

// Exercise the actual TS modules with isolated Prisma and temporary photo storage.
// No database connection, credentials, or framework server are needed.
function load(relative, mocks = {}) {
  const filename = path.resolve(testDirectory, "..", relative);
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  });
  const loadedModule = { exports: {} };
  const requireFromFile = createRequire(filename);
  new Function("require", "module", "exports", outputText)(
    (id) => Object.hasOwn(mocks, id) ? mocks[id] : requireFromFile(id), loadedModule, loadedModule.exports,
  );
  return loadedModule.exports;
}
const schema = load("src/lib/workspace-schema.ts");
const upload = load("src/lib/workspace-upload.ts");
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
  const mocks = { "@/lib/prisma": { prisma }, "@/lib/workspace-schema": schema };
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

test("photo upload normalizes real pixels, persists and serves them, rejects bad input and path traversal", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "cospace-photos-test-"));
  const previous = process.env.WORKSPACE_UPLOAD_DIR;
  process.env.WORKSPACE_UPLOAD_DIR = directory;
  try {
    const jpeg = await sharp({ create: { width: 40, height: 30, channels: 3, background: "#ff5b2e" } }).jpeg().toBuffer();
    const api = load("src/app/api/admin/workspace-images/route.ts", { "@/lib/workspace-upload": upload });
    const request = (bytes, type = "image/jpeg", headers = {}) => new Request("http://localhost/api/admin/workspace-images", { method: "POST", headers: { "Content-Type": type, ...headers }, body: bytes });
    const response = await api.POST(request(jpeg));
    assert.equal(response.status, 201);
    const { imageUrl } = await response.json();
    const id = imageUrl.split("/").at(-1);
    assert.equal(upload.isImageId(id), true);
    const stored = await upload.readPhoto(id);
    assert.equal((await sharp(stored).metadata()).format, "webp");
    const readApi = load("src/app/api/workspace-images/[id]/route.ts", { "@/lib/workspace-upload": upload });
    const served = await readApi.GET(new Request("http://localhost"), { params: Promise.resolve({ id }) });
    assert.equal(served.status, 200);
    assert.equal(served.headers.get("Content-Type"), "image/webp");
    assert.equal(await upload.readPhoto("../private"), null);
    assert.equal((await api.POST(request(Buffer.from("fake image")))).status, 400);
    assert.equal((await api.POST(request(jpeg, "image/svg+xml"))).status, 415);
    assert.equal((await api.POST(request(jpeg, "image/jpeg", { "Content-Length": String(upload.MAX_IMAGE_BYTES + 1) }))).status, 413);
    assert.equal((await api.POST(request(Buffer.alloc(upload.MAX_IMAGE_BYTES + 1)))).status, 413);
    assert.equal((await api.POST(request(Buffer.alloc(0)))).status, 400);
  } finally {
    if (previous === undefined) delete process.env.WORKSPACE_UPLOAD_DIR;
    else process.env.WORKSPACE_UPLOAD_DIR = previous;
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
