import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import * as paths from '../src/lib/auth/paths.ts';
import * as schema from '../src/lib/workspace-schema.ts';

const savePath = '/api/admin/workspaces/workspace-1';
const uploadPath = '/api/admin/workspace-images';
const refreshPath = '/api/auth/refresh';
const workspace = {
  id: 'workspace-1', name: 'Sala Horizonte', description: 'Sala para reuniones',
  type: 'MEETING_ROOM', capacity: 6, pricePerHour: 15, imageUrl: '/images/spaces/meeting-room-1.svg',
};
const photo = new File(['example'], 'photo.webp', { type: 'image/webp' });
const uploadedImage = '/api/workspace-images/12345678-1234-1234-1234-123456789abc.webp';

function load(relative, mocks, browser) {
  const file = new URL(relative, import.meta.url);
  const { outputText } = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  });
  const loadedModule = { exports: {} };
  const requireFromFile = createRequire(file);
  new Function('require', 'module', 'exports', 'fetch', 'window', 'document', 'navigator', outputText)(
    (id) => Object.hasOwn(mocks, id) ? mocks[id] : requireFromFile(id),
    loadedModule, loadedModule.exports, browser.fetch, browser.window, browser.document, browser.navigator,
  );
  return loadedModule.exports;
}

function mockBrowser(responses) {
  const requests = [];
  const navigations = [];
  const locks = [];
  const window = new EventTarget();
  const document = { documentElement: { style: {} } };
  const navigator = { locks: { request: (name, action) => { locks.push(name); return action(); } } };
  window.location = { replace: (path) => {
    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    navigations.push({ path, blocked: event.defaultPrevented });
  } };
  const fetch = async (path, options) => {
    const index = requests.length;
    requests.push({ path, ...options });
    const response = responses[index];
    if (response instanceof Error) throw response;
    assert.ok(response, `Unexpected request to ${path}`);
    return response;
  };
  const browser = { window, document, navigator, fetch };
  const client = load('../src/lib/auth/client.ts', { './paths': paths }, browser);
  return { browser, client, requests, navigations, locks };
}

function mountEditor(fixture, selectedPhoto = null) {
  let form;
  const effects = [];
  const saved = [];
  const { default: WorkspaceEditor } = load('../src/components/admin/WorkspaceEditor.tsx', {
    react: {
      ...React,
      useEffect: (effect) => effects.push(effect),
      useState: (initial) => React.useState(initial === null ? selectedPhoto : initial),
    },
    './AdminDialog': ({ children }) => {
      form = React.Children.toArray(children).find((child) => child.type === 'form');
      return null;
    },
    'next/image': () => null,
    '@/components/ui/button': () => null,
    '@/lib/i18n': { useI18n: () => ({ t: (message) => message, language: 'es' }) },
    '@/lib/workspace-schema': schema,
    '@/lib/auth/client': fixture.client,
  }, fixture.browser);
  renderToStaticMarkup(React.createElement(WorkspaceEditor, {
    workspace, onClose: () => {}, onSaved: (result) => saved.push(result),
  }));
  assert.ok(form, 'WorkspaceEditor should render a form');
  for (const effect of effects) effect();
  return {
    saved,
    submit: () => form.props.onSubmit({ preventDefault() {}, nativeEvent: {} }),
  };
}

const expired = () => Response.json({ error: 'No autorizado' }, {
  status: 401, headers: { [paths.SESSION_REQUIRED]: '1' },
});
const renewed = () => new Response(null, { status: 204 });
const requestOrder = (requests) => requests.map(({ path, method }) => `${method} ${path}`);

test('WorkspaceEditor renews an expired save without submitting twice or reuploading the image', async () => {
  const fixture = mockBrowser([
    Response.json({ imageUrl: uploadedImage }, { status: 201 }),
    expired(), renewed(), Response.json({ ...workspace, imageUrl: uploadedImage }),
  ]);
  const editor = mountEditor(fixture, photo);

  await Promise.all([editor.submit(), editor.submit()]);

  assert.deepEqual(requestOrder(fixture.requests), [
    `POST ${uploadPath}`, `PATCH ${savePath}`, `POST ${refreshPath}`, `PATCH ${savePath}`,
  ]);
  assert.strictEqual(fixture.requests[0].body, photo);
  assert.equal(JSON.parse(fixture.requests[1].body).imageUrl, uploadedImage);
  assert.deepEqual(fixture.requests[1], fixture.requests[3]);
  assert.deepEqual(fixture.locks, ['cospace-session']);
  assert.deepEqual(editor.saved, [{ ...workspace, imageUrl: uploadedImage }]);
});

test('WorkspaceEditor renews an expired upload and replays the same File only once', async () => {
  const fixture = mockBrowser([
    expired(), renewed(), Response.json({ imageUrl: uploadedImage }, { status: 201 }),
    Response.json({ ...workspace, imageUrl: uploadedImage }),
  ]);
  const editor = mountEditor(fixture, photo);
  await editor.submit();

  assert.deepEqual(requestOrder(fixture.requests), [
    `POST ${uploadPath}`, `POST ${refreshPath}`, `POST ${uploadPath}`, `PATCH ${savePath}`,
  ]);
  assert.deepEqual(fixture.requests[0], fixture.requests[2]);
  assert.strictEqual(fixture.requests[2].body, photo);
  assert.equal(editor.saved.length, 1);
});

test('WorkspaceEditor does not replay a forbidden or ambiguous write', async () => {
  for (const failure of [
    Response.json({ error: 'Forbidden' }, { status: 403 }),
    Response.json({ error: 'Unmarked unauthorized' }, { status: 401 }),
    new TypeError('Network connection lost'),
  ]) {
    const fixture = mockBrowser([failure]);
    const editor = mountEditor(fixture);
    await editor.submit();

    assert.deepEqual(requestOrder(fixture.requests), [`PATCH ${savePath}`]);
    assert.deepEqual(fixture.navigations, []);
    assert.deepEqual(editor.saved, []);
  }
});

test('WorkspaceEditor does not replay or redirect after a forbidden or ambiguous renewal', async () => {
  for (const failure of [
    Response.json({ error: 'Forbidden' }, { status: 403 }),
    new TypeError('Refresh connection lost'),
  ]) {
    const fixture = mockBrowser([expired(), failure]);
    const editor = mountEditor(fixture);
    await editor.submit();

    assert.deepEqual(requestOrder(fixture.requests), [`PATCH ${savePath}`, `POST ${refreshPath}`]);
    assert.deepEqual(fixture.navigations, []);
    assert.deepEqual(editor.saved, []);
  }
});

test('WorkspaceEditor goes to login when renewal fails or the one replay is still unauthorized', async () => {
  for (const responses of [
    [expired(), Response.json({ error: 'Sesión vencida' }, { status: 401 })],
    [expired(), renewed(), expired()],
  ]) {
    const fixture = mockBrowser([Response.json({ imageUrl: uploadedImage }, { status: 201 }), ...responses]);
    const editor = mountEditor(fixture, photo);
    const manualExit = new Event('beforeunload', { cancelable: true });
    fixture.browser.window.dispatchEvent(manualExit);
    assert.equal(manualExit.defaultPrevented, true);

    await editor.submit();

    const order = [`POST ${uploadPath}`, `PATCH ${savePath}`, `POST ${refreshPath}`];
    if (responses.length === 3) order.push(`PATCH ${savePath}`);
    assert.deepEqual(requestOrder(fixture.requests), order);
    assert.deepEqual(fixture.navigations, [{ path: '/login', blocked: false }]);
    assert.deepEqual(editor.saved, []);
  }
});

test('concurrent protected writes share a single renewal through authFetch', async () => {
  const fixture = mockBrowser([
    expired(), expired(), renewed(), Response.json({}), Response.json({}),
  ]);
  const results = await Promise.all([
    fixture.client.authFetch(savePath, { method: 'PATCH', body: '{}' }),
    fixture.client.authFetch(uploadPath, { method: 'POST', body: photo }),
  ]);
  assert.ok(results.every(({ ok }) => ok));
  assert.deepEqual(fixture.locks, ['cospace-session']);
  assert.deepEqual(requestOrder(fixture.requests), [
    `PATCH ${savePath}`, `POST ${uploadPath}`, `POST ${refreshPath}`, `PATCH ${savePath}`, `POST ${uploadPath}`,
  ]);
});
