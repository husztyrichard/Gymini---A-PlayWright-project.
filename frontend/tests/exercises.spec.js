import { test, expect } from '@playwright/test';

test.describe('Exercise Library', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('.navCta:has-text("Exercises")');
    await expect(page.locator('.exercisesSection')).toBeVisible();
  });

  test('exercises section is visible', async ({ page }) => {
    await expect(page.locator('.exercisesSection')).toBeVisible();
    await expect(page.locator('.exercisesSection h2')).toHaveText('Browse Exercises');
  });

  test('search bar is present and functional', async ({ page }) => {
    const search = page.locator('.exerciseSearch');
    await expect(search).toBeVisible();
    await search.fill('bench');
    await expect(search).toHaveValue('bench');
  });

  test('muscle filter dropdown exists', async ({ page }) => {
    const filter = page.locator('.exerciseFilter').first();
    await expect(filter).toBeVisible();
    const options = await filter.locator('option').allTextContents();
    expect(options).toContain('All muscles');
  });

  test('equipment filter dropdown exists', async ({ page }) => {
    const filter = page.locator('.exerciseFilter').nth(1);
    await expect(filter).toBeVisible();
    const options = await filter.locator('option').allTextContents();
    expect(options).toContain('All equipment');
  });

  test('exercise cards are loaded', { tag: ['@smoke'] }, async ({ page }) => {
    await page.waitForSelector('.exerciseCard', { timeout: 15000 });
    const cards = page.locator('.exerciseCard');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(60);
  });

  test('exercise count is displayed', async ({ page }) => {
    await page.waitForSelector('.exerciseCard', { timeout: 15000 });
    await expect(page.locator('.exerciseCount')).toContainText('exercises');
  });

  test('clicking exercise card opens modal', { tag: ['@smoke'] }, async ({ page }) => {
    await page.waitForSelector('.exerciseCard', { timeout: 15000 });
    await page.locator('.exerciseCard').first().click();
    await expect(page.locator('.exerciseModal')).toBeVisible();
    await expect(page.locator('.exerciseModalContent h3')).not.toBeEmpty();
  });

  test('modal displays images and instructions', async ({ page }) => {
    await page.waitForSelector('.exerciseCard', { timeout: 15000 });
    await page.locator('.exerciseCard').first().click();
    await expect(page.locator('.modalImages img')).toHaveCount(2);
    await expect(page.locator('.modalInstructions ol li').first()).toBeVisible();
  });

  test('modal can be closed with X button', { tag: ['@smoke'] }, async ({ page }) => {
    await page.waitForSelector('.exerciseCard', { timeout: 15000 });
    await page.locator('.exerciseCard').first().click();
    await expect(page.locator('.exerciseModal')).toBeVisible();
    await expect(page.locator('.modalClose')).toBeVisible();
    await page.click('.modalClose');
    await expect(page.locator('.exerciseModal')).toBeHidden();
  });

  test('modal closes on backdrop click', async ({ page }) => {
    await page.waitForSelector('.exerciseCard', { timeout: 15000 });
    await page.locator('.exerciseCard').first().click();
    await expect(page.locator('.exerciseModal')).toBeVisible();
    await page.locator('.exerciseModal').click({ position: { x: 10, y: 10 } });
    await expect(page.locator('.exerciseModal')).toBeHidden();
  });

  test('search filters exercises by name', async ({ page }) => {
    await page.waitForSelector('.exerciseCard', { timeout: 15000 });
    const allCount = await page.locator('.exerciseCard').count();
    await page.locator('.exerciseSearch').fill('ankle');
    await expect
      .poll(async () => page.locator('.exerciseCard').count(), { timeout: 10000 })
      .toBeLessThan(allCount);
    const filteredCount = await page.locator('.exerciseCard').count();
    expect(filteredCount).toBeGreaterThan(0);
  });

  test('muscle filter works', async ({ page }) => {
    await page.waitForSelector('.exerciseCard', { timeout: 15000 });
    const allCount = await page.locator('.exerciseCard').count();
    await page.locator('.exerciseFilter').first().selectOption('biceps');
    await expect
      .poll(async () => page.locator('.exerciseCard').count(), { timeout: 10000 })
      .toBeLessThan(allCount);
    const filteredCount = await page.locator('.exerciseCard').count();
    expect(filteredCount).toBeGreaterThan(0);
  });
});
