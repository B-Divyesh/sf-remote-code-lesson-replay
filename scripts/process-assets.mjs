import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

await Promise.all([
  mkdir(new URL('../public/assets/', import.meta.url), { recursive: true }),
  mkdir(new URL('../public/icons/', import.meta.url), { recursive: true })
]);

const hero = fileURLToPath(new URL('../assets/src/replay-bench.png', import.meta.url));
await Promise.all([
  sharp(hero).resize(1280, 853, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 78 }).toFile(fileURLToPath(new URL('../public/assets/replay-bench.webp', import.meta.url))),
  sharp(hero).resize(1280, 853, { fit: 'inside', withoutEnlargement: true }).avif({ quality: 52 }).toFile(fileURLToPath(new URL('../public/assets/replay-bench.avif', import.meta.url)))
]);

const icon = fileURLToPath(new URL('../assets/icon.svg', import.meta.url));
await Promise.all([16, 32, 48, 128].map((size) =>
  sharp(icon).resize(size, size).png().toFile(fileURLToPath(new URL(`../public/icons/icon-${size}.png`, import.meta.url)))
));
