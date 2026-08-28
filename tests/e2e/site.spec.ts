import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test } from 'playwright/test';

test('landing page explains and delivers the product', async ({ page }) => {
  const origins = new Set<string>();
  page.on('request', (request) => origins.add(new URL(request.url()).origin));
  await page.goto('/');
  await expect(page).toHaveTitle(/Code Lesson Replay/);
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Replay the reasoning');
  await expect(page.getByRole('link', { name: /Download for Chrome/ })).toHaveAttribute('download', '');
  await expect(page.getByText('Never records')).toBeVisible();

  const download = await page.request.get('/downloads/code-lesson-replay.zip');
  expect(download.status()).toBe(200);
  expect(download.headers()['content-type']).toContain('application/zip');
  expect((await download.body()).subarray(0, 2).toString()).toBe('PK');
  expect([...origins]).toEqual(['http://127.0.0.1:4173']);
});

test('release uses production billing and a self-hosted policy-protected 404 response', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Buy Plus once' })).toHaveAttribute('href', 'https://api.sociobot.in/api/v1/products/remote-code-lesson-replay/checkout');

  const config = JSON.parse(await readFile(join(process.cwd(), 'dist/site/staticwebapp.config.json'), 'utf8')) as {
    routes: Array<{ route: string; headers: Record<string, string> }>;
    mimeTypes: Record<string, string>;
    responseOverrides: Record<string, { rewrite: string; statusCode: number }>;
    globalHeaders: Record<string, string>;
  };
  expect(config.routes.find((route) => route.route === '/assets/*')?.headers['Cache-Control']).toBe('public, max-age=31536000, immutable');
  expect(config.mimeTypes['.avif']).toBe('image/avif');
  expect(config.mimeTypes['.zip']).toBe('application/zip');
  expect(config.responseOverrides['404']).toEqual({ rewrite: '/404.html', statusCode: 404 });
  expect(config.globalHeaders['Content-Security-Policy']).toContain("default-src 'self'");
  expect(config.globalHeaders['X-Content-Type-Options']).toBe('nosniff');
  expect(config.globalHeaders['Referrer-Policy']).toBe('strict-origin-when-cross-origin');

  const notFound = await readFile(join(process.cwd(), 'dist/site/404.html'), 'utf8');
  expect(notFound).toContain('<h1>That replay slip is missing.</h1>');
  expect(notFound).not.toMatch(/https?:\/\/(?!remote-code-lesson-replay\.sociobot\.in)/i);
});

test('restore purchase is keyboard-accessible and keeps the free state visible', async ({ page }) => {
  await page.goto('/#pricing');
  const toggle = page.getByRole('button', { name: /Have a license/ });
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByLabel('License token')).toBeFocused();
  await expect(page.getByText(/free tools never wait/i)).toBeVisible();
});

test('payment return stores, verifies, and offers the extension token', async ({ page }) => {
  await page.route('**/verify?license=test-token', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ valid: true, reason: 'ok', expires_at: null })
  }));
  await page.goto('/?license=test-token#pricing');
  await expect(page).toHaveURL(/\/#pricing$/);
  await expect(page.getByText('Plus is ready to activate in the extension.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy token for the extension' })).toBeVisible();
  const stored = await page.evaluate(() => localStorage.getItem('sb_license:remote-code-lesson-replay'));
  expect(stored).toBe('test-token');
});

test('home, legal, and not-found pages have no serious accessibility violations', async ({ page }) => {
  for (const path of ['/', '/404.html', '/privacy/', '/terms/']) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
  }
});

test('layout fits the 390px viewport', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile-only overflow check');
  await page.goto('/');
  expect(await page.evaluate(() => Number.parseFloat(getComputedStyle(document.body).fontSize))).toBeGreaterThanOrEqual(17);
  expect(await page.locator('.eyebrow').first().evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(14);
  const sizes = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(sizes.scroll).toBeLessThanOrEqual(sizes.client);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: /Download for Chrome/ })).toBeVisible();

  for (const path of ['/', '/404.html', '/privacy/', '/terms/']) {
    await page.goto(path);
    const undersized = await page.locator('a, button').evaluateAll((elements) => elements.flatMap((element) => {
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) return [];
      return rect.width < 44 || rect.height < 44 ? [{ text: element.textContent?.trim(), width: rect.width, height: rect.height }] : [];
    }));
    expect(undersized).toEqual([]);
  }
});

test('fresh-profile offline reload serves a complete interactive shell', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Offline shell runs once in desktop Chromium');
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.clearBrowserCache');
  await context.setOffline(true);
  try {
    await page.goto('/', { waitUntil: 'load' });
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Replay the reasoning');
    const restore = page.getByRole('button', { name: /Have a license/ });
    await restore.click();
    await expect(restore).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByLabel('License token')).toBeFocused();
    expect(errors.filter((error) => /MIME|Failed to load module|stylesheet/i.test(error))).toEqual([]);
  } finally {
    await context.setOffline(false);
  }
});
