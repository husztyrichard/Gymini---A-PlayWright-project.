import { test, expect } from '@playwright/test';

test.describe('Plan Generation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('text=Start planning');
  });

  test('generates a plan with default data', async ({ page }) => {
    await page.click('button:has-text("Generate my workout plan")');
    await page.waitForSelector('.dayCard', { timeout: 15000 });
    const days = page.locator('.dayCard');
    expect(await days.count()).toBe(4);
  });

  test('plan shows correct split name', async ({ page }) => {
    await page.click('button:has-text("Generate my workout plan")');
    await page.waitForSelector('.dayCard', { timeout: 15000 });
    await expect(page.locator('.dayCard').first()).toContainText('Day 1');
    await expect(page.locator('.dayCard').first()).toContainText('Chest & Triceps');
  });

  test('plan exercises are clickable and open modal', async ({ page }) => {
    await page.click('button:has-text("Generate my workout plan")');
    await page.waitForSelector('.dayCard', { timeout: 15000 });
    const exerciseLink = page.locator('.dayCard .linkButton').first();
    await exerciseLink.click();
    await expect(page.locator('.exerciseModal')).toBeVisible();
    await expect(page.locator('.exerciseModalContent h3')).not.toBeEmpty();
  });

  test('plan shows progression and safety advice', async ({ page }) => {
    await page.click('button:has-text("Generate my workout plan")');
    await page.waitForSelector('.dayCard', { timeout: 15000 });
    await expect(page.locator('.advice').first()).toContainText('Progression');
    await expect(page.locator('.advice.muted')).toContainText('Safety');
  });

  test('different days per week changes plan length', async ({ page }) => {
    await page.selectOption('select[name="daysPerWeek"]', '2');
    await page.click('button:has-text("Generate my workout plan")');
    await page.waitForSelector('.dayCard', { timeout: 15000 });
    expect(await page.locator('.dayCard').count()).toBe(2);
  });

  test('different goal changes rep scheme', async ({ page }) => {
    await page.selectOption('select[name="goal"]', 'strength');
    await page.click('button:has-text("Generate my workout plan")');
    await page.waitForSelector('.dayCard', { timeout: 15000 });
    await expect(page.locator('.resultCard')).toContainText('4-6 reps');
  });

  test('each day card shows warmup and finisher', async ({ page }) => {
    await page.click('button:has-text("Generate my workout plan")');
    await page.waitForSelector('.dayCard', { timeout: 15000 });
    await expect(page.locator('.dayCard').first()).toContainText('light cardio');
    await expect(page.locator('.dayCard').first()).toContainText('core work');
  });
});
