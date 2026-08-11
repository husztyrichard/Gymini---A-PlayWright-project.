import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('loads and displays branding', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.brand span')).toHaveText('Gymini');
    await expect(page.locator('.brand small')).toHaveText('QA Portfolio');
  });

  test('displays hero section with headline', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Build your AI workout plan in seconds');
  });

  test('phone card is hidden by default', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.phoneCard')).not.toBeVisible();
  });

  test('phone card appears when clicking See example', async ({ page }) => {
    await page.goto('/');
    await page.click('text=See example');
    await expect(page.locator('.phoneCard')).toBeVisible();
  });

  test('nav exercises button links to exercises section', async ({ page }) => {
    await page.goto('/');
    const navCta = page.locator('.navCta', { hasText: 'Exercises' });
    await expect(navCta).toBeVisible();
    await expect(navCta).toHaveAttribute('href', '#exercises');
  });

  test('start planning button links to planner', async ({ page }) => {
    await page.goto('/');
    const btn = page.locator('.primaryButton', { hasText: 'Start planning' });
    await expect(btn).toHaveAttribute('href', '#planner');
  });

  test('proof row shows correct tags', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.proofRow')).toContainText('800+ exercises');
    await expect(page.locator('.proofRow')).toContainText('No login needed');
  });
});
