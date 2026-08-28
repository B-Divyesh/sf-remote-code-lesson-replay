import AxeBuilder from '@axe-core/playwright';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { chromium, expect, test } from 'playwright/test';

const execFileAsync = promisify(execFile);

test('extension captures, scrubs, diffs, and replays a lesson locally', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Extension flow runs once in desktop Chromium');
  const workspace = await mkdtemp(join(tmpdir(), 'lesson-replay-e2e-'));
  const extensionPath = join(workspace, 'extension');
  const profile = join(workspace, 'profile');
  await mkdir(extensionPath);
  await execFileAsync('unzip', ['-q', join(process.cwd(), 'dist/site/downloads/code-lesson-replay.zip'), '-d', extensionPath]);
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

    await page.locator('[data-import]').setInputFiles({
      name: 'broken.lesson-replay.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{bad')
    });
    await expect(page.getByRole('alert')).toContainText('This is not valid JSON');

    await page.getByLabel('Replay title').fill('   ');
    await page.getByRole('button', { name: 'Start private replay' }).click();
    await expect(page.getByLabel('Replay title')).toHaveJSProperty('validationMessage', 'Enter a replay title with at least one visible character.');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Record the reasoning');

    await page.getByLabel('Replay title').fill('Cart total debugging');
    await page.getByLabel('Student name').fill('Sam');
    await page.getByRole('button', { name: 'Start private replay' }).click();

    await page.getByRole('textbox', { name: 'Command', exact: true }).fill('API_TOKEN=super-secret-value npm test');
    await page.getByLabel(/Output to include/).fill('Bearer abcdefghijklmnop failed');
    await page.getByLabel(/Hypothesis before/).fill('The reducer runs twice.');
    await page.getByRole('button', { name: 'Add command step' }).click();
    await expect(page.locator('body')).not.toContainText('super-secret-value');
    await expect(page.locator('body')).not.toContainText('abcdefghijklmnop');
    await expect(page.getByText('2 sensitive values were masked before saving.').first()).toBeVisible();

    const commandTab = page.getByRole('tab', { name: 'Command' });
    await commandTab.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'File diff' })).toBeFocused();
    await expect(page.getByRole('tab', { name: 'File diff' })).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowLeft');
    await expect(commandTab).toBeFocused();
    await page.getByRole('tab', { name: 'File diff' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('tab', { name: 'File diff' })).toBeFocused();
    await page.getByLabel('File name').fill('src/cart.ts');
    await page.getByLabel('Before snapshot').fill('const total = 18;');
    await page.getByLabel('Current snapshot').fill('const total = 36;');
    await page.getByRole('button', { name: 'Add file diff' }).click();
    await expect(page.getByText('const total = 36;', { exact: true }).first()).toBeVisible();

    await page.route('https://api.sociobot.in/**/verify?license=valid-test-license', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ valid: true, reason: 'ok', expires_at: null })
    }));
    await page.getByRole('button', { name: 'I have a license' }).click();
    await page.getByLabel('License token').fill('valid-test-license');
    await page.getByRole('button', { name: 'Verify license' }).click();
    await expect(page.getByText('Tutor Lens · unlocked')).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
    expect(consoleErrors).toEqual([]);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);

    await page.setViewportSize({ width: 390, height: 844 });
    const undersized = await page.locator('a, button, label.file-button').evaluateAll((elements) => elements.flatMap((element) => {
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) return [];
      return rect.width < 44 || rect.height < 44 ? [{ text: element.textContent?.trim(), width: rect.width, height: rect.height }] : [];
    }));
    expect(undersized).toEqual([]);
  } finally {
    await context.close();
    await rm(workspace, { recursive: true, force: true });
  }
});
