import AxeBuilder from '@axe-core/playwright';
import { expect, test } from 'playwright/test';

test('landing page explains and delivers the product', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Code Lesson Replay/);
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Replay the reasoning');
  await expect(page.getByRole('link', { name: /Download for Chrome/ })).toHaveAttribute('download', '');
  await expect(page.getByText('Never records')).toBeVisible();
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

test('home and legal pages have no serious accessibility violations', async ({ page }) => {
  for (const path of ['/', '/privacy/', '/terms/']) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
  }
});

test('layout fits the 390px viewport', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile-only overflow check');
  await page.goto('/');
  const sizes = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(sizes.scroll).toBeLessThanOrEqual(sizes.client);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: /Download for Chrome/ })).toBeVisible();
});
