import AxeBuilder from '@axe-core/playwright';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium, expect, test } from 'playwright/test';

test('extension captures, scrubs, diffs, and replays a lesson locally', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Extension flow runs once in desktop Chromium');
  const extensionPath = join(process.cwd(), '.output/chrome-mv3');
  const profile = await mkdtemp(join(tmpdir(), 'lesson-replay-e2e-'));
  const context = await chromium.launchPersistentContext(profile, {
    channel: 'chromium',
    headless: true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
  });

  try {
    let [worker] = context.serviceWorkers();
    worker ??= await context.waitForEvent('serviceworker');
    const extensionId = new URL(worker.url()).host;
    const page = await context.newPage();
    const consoleErrors: string[] = [];
    page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    page.on('pageerror', (error) => consoleErrors.push(error.message));

    await page.goto(`chrome-extension://${extensionId}/app.html`);
    await page.getByLabel('Replay title').fill('Cart total debugging');
    await page.getByLabel('Student name').fill('Sam');
    await page.getByRole('button', { name: 'Start private replay' }).click();

    await page.getByLabel('Command', { exact: true }).fill('API_TOKEN=super-secret-value npm test');
    await page.getByLabel(/Output to include/).fill('Bearer abcdefghijklmnop failed');
    await page.getByLabel(/Hypothesis before/).fill('The reducer runs twice.');
    await page.getByRole('button', { name: 'Add command step' }).click();
    await expect(page.locator('body')).not.toContainText('super-secret-value');
    await expect(page.locator('body')).not.toContainText('abcdefghijklmnop');
    await expect(page.getByText('2 sensitive values were masked before saving.').first()).toBeVisible();

    await page.getByRole('tab', { name: 'File diff' }).click();
    await page.getByLabel('File name').fill('src/cart.ts');
    await page.getByLabel('Before snapshot').fill('const total = 18;');
    await page.getByLabel('Current snapshot').fill('const total = 36;');
    await page.getByRole('button', { name: 'Add file diff' }).click();
    await expect(page.getByText('const total = 36;', { exact: true }).first()).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
    expect(consoleErrors).toEqual([]);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
  } finally {
    await context.close();
    await rm(profile, { recursive: true, force: true });
  }
});
