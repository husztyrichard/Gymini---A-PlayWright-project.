import { test, expect } from '@playwright/test';

test.describe('Test Dashboard & Reports', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('text=View test dashboard');
    await expect(page.locator('.testDashboard')).toBeVisible();
  });

  test('dashboard shows the three status cards', { tag: ['@smoke'] }, async ({ page }) => {
    const headings = page.locator('.testCardHeader h3');
    await expect(headings).toHaveCount(3);
    await expect(headings.nth(0)).toHaveText('API Test Metrics');
    await expect(headings.nth(1)).toHaveText('Test status');
    await expect(headings.nth(2)).toHaveText('Lighthouse scores');
  });

  test('lighthouse card shows the four score categories', { tag: ['@smoke'] }, async ({ page }) => {
    const card = page.locator('.testCard', { hasText: 'Lighthouse scores' });
    await expect(card.locator('.metricItem')).toHaveCount(4);
    const labels = await card.locator('.metricItem span').allTextContents();
    expect(labels).toEqual(['Performance', 'Accessibility', 'Best practices', 'SEO']);
    for (const value of await card.locator('.metricItem strong').allTextContents()) {
      expect(Number(value)).toBeGreaterThanOrEqual(0);
    }
  });

  test('lighthouse budgets show a pass status', async ({ page }) => {
    const card = page.locator('.testCard', { hasText: 'Lighthouse scores' });
    await expect(card.locator('.statusLabel').first()).toHaveText('Budgets');
    await expect(card.locator('.statusBlock strong')).toHaveText('Pass');
    await expect(card.locator('.statusBlock strong')).toHaveClass(/statusPass/);
  });

  test('UI tests count is displayed', async ({ page }) => {
    const card = page.locator('.testCard', { hasText: 'Test status' });
    await expect(card.locator('.statusLabel', { hasText: 'UI tests' })).toBeVisible();
    await expect(card.locator('.statusBlock', { hasText: 'tests' }).locator('strong')).toHaveText(/\d+ tests/);
  });

  test('UI Playwright report page opens', { tag: ['@smoke'] }, async ({ page }) => {
    const response = await page.goto('/reports/playwright-report/index.html');
    expect(response.ok()).toBeTruthy();
    await expect(page).toHaveTitle('Playwright Test Report');
    await expect(page.locator('body')).toContainText(/Passed/i);
    await expect(page.locator('body')).toContainText(/Failed/i);
  });

  test('API Newman report page opens', async ({ page }) => {
    const response = await page.goto('/reports/api-report.html');
    expect(response.ok()).toBeTruthy();
    await expect(page).toHaveTitle('Newman Summary Report');
    await expect(page.locator('body')).toContainText(/32/i);
  });
});
