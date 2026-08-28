import { createHash } from 'node:crypto';
import { readFile, readdir, rename, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const site = new URL('../dist/site/', import.meta.url);
const assets = new URL('assets/', site);

async function fingerprintPublicAsset(name) {
  const source = new URL(name, assets);
  const bytes = await readFile(source);
  const extension = extname(name);
  const stem = name.slice(0, -extension.length);
  const digest = createHash('sha256').update(bytes).digest('hex').slice(0, 10);
  const fingerprinted = `${stem}-${digest}${extension}`;
  await rename(source, new URL(fingerprinted, assets));
  return { original: `/assets/${name}`, fingerprinted: `/assets/${fingerprinted}` };
}

const imageAssets = await Promise.all([
  fingerprintPublicAsset('replay-bench.avif'),
  fingerprintPublicAsset('replay-bench.webp')
]);

const htmlFiles = ['index.html', 'privacy/index.html', 'terms/index.html'];
for (const file of htmlFiles) {
  const path = new URL(file, site);
  let html = await readFile(path, 'utf8');
  for (const asset of imageAssets) html = html.replaceAll(asset.original, asset.fingerprinted);
  await writeFile(path, html);
}

const emittedAssets = (await readdir(assets.pathname))
  .filter((name) => ['.css', '.js', '.avif', '.webp'].includes(extname(name)))
  .sort()
  .map((name) => `/assets/${name}`);
const shell = ['/', '/privacy/', '/terms/', '/icons/icon-32.png', '/icons/icon-128.png', ...emittedAssets];
const versionInputs = await Promise.all([
  ...htmlFiles.map((file) => readFile(new URL(file, site))),
  ...emittedAssets.map((file) => readFile(new URL(file.slice(1), site)))
]);
const version = createHash('sha256').update(Buffer.concat(versionInputs)).digest('hex').slice(0, 12);

const worker = `const CACHE = 'lesson-replay-site-${version}';
const SHELL = ${JSON.stringify(shell)};

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then((response) => {
      if (response.ok) void caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()));
      return response;
    }).catch(async () => (await caches.match(event.request, { ignoreSearch: true, ignoreVary: true })) || caches.match('/')));
    return;
  }
  event.respondWith(caches.match(event.request, { ignoreSearch: true, ignoreVary: true }).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok) void caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()));
    return response;
  }).catch(() => new Response('Unavailable while offline.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }))));
});
`;

await writeFile(new URL('sw.js', site), worker);

const missingDownload = !(await readdir(new URL('downloads/', site))).includes('code-lesson-replay.zip');
if (missingDownload) throw new Error('The deploy artifact is missing downloads/code-lesson-replay.zip.');
