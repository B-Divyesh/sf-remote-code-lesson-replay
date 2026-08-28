import { copyFile, mkdir, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const output = new URL('../.output/', import.meta.url);
const downloads = new URL('../dist/site/downloads/', import.meta.url);
await mkdir(downloads, { recursive: true });

const files = await readdir(output);
const candidates = [];
for (const file of files) {
  if (file.endsWith('.zip')) {
    const details = await stat(join(output.pathname, file));
    candidates.push({ file, time: details.mtimeMs });
  }
}

const latest = candidates.sort((a, b) => b.time - a.time)[0];
if (!latest) throw new Error('WXT did not produce an extension zip.');
await copyFile(join(output.pathname, latest.file), new URL('code-lesson-replay.zip', downloads));
