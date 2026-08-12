import { test, expect } from '@playwright/test';

test.describe('Form validation - negative paths', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('text=Start planning');
    await page.waitForSelector('.exerciseCard', { timeout: 15000 });
  });

  async function assertSubmitBlocked(page) {
    const btn = page.locator('button:has-text("Generate my workout plan")');
    await btn.click();
    await expect(btn).toBeEnabled();
    await expect(btn).toHaveText('Generate my workout plan');
    expect(await page.locator('.dayCard').count()).toBe(0);
    await expect(page.locator('.resultCard h3')).toHaveText('Your AI workout plan will appear here.');
  }

  test('empty required age blocks submission', async ({ page }) => {
    await page.fill('input[name="age"]', '');
    await assertSubmitBlocked(page);
    expect(await page.locator('input[name="age"]').evaluate((el) => el.validationMessage)).not.toBe('');
  });

  test('age above max (150) blocks submission', async ({ page }) => {
    await page.fill('input[name="age"]', '150');
    await assertSubmitBlocked(page);
    const msg = await page.locator('input[name="age"]').evaluate((el) => el.validationMessage);
    expect(msg).not.toBe('');
  });

  test('age below min (1) blocks submission', async ({ page }) => {
    await page.fill('input[name="age"]', '1');
    await assertSubmitBlocked(page);
    expect(await page.locator('input[name="age"]').evaluate((el) => el.validationMessage)).not.toBe('');
  });

  test('height below min (10) blocks submission', async ({ page }) => {
    await page.fill('input[name="height"]', '10');
    await assertSubmitBlocked(page);
    expect(await page.locator('input[name="height"]').evaluate((el) => el.validationMessage)).not.toBe('');
  });

  test('weight above max (999) blocks submission', async ({ page }) => {
    await page.fill('input[name="weight"]', '999');
    await assertSubmitBlocked(page);
    expect(await page.locator('input[name="weight"]').evaluate((el) => el.validationMessage)).not.toBe('');
  });
});

test.describe('Form validation - valid boundary values', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('text=Start planning');
    await page.waitForSelector('.exerciseCard', { timeout: 15000 });
  });

  test('min valid values generate a plan', async ({ page }) => {
    await page.fill('input[name="age"]', '14');
    await page.fill('input[name="height"]', '120');
    await page.fill('input[name="weight"]', '35');
    await page.click('button:has-text("Generate my workout plan")');
    await page.waitForSelector('.dayCard', { timeout: 15000 });
    expect(await page.locator('.dayCard').count()).toBeGreaterThan(0);
  });

  test('max valid values generate a plan', async ({ page }) => {
    await page.fill('input[name="age"]', '90');
    await page.fill('input[name="height"]', '230');
    await page.fill('input[name="weight"]', '250');
    await page.click('button:has-text("Generate my workout plan")');
    await page.waitForSelector('.dayCard', { timeout: 15000 });
    expect(await page.locator('.dayCard').count()).toBeGreaterThan(0);
  });
});

test.describe('Exercise search - edge cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('.navCta:has-text("Exercises")');
    await page.waitForSelector('.exerciseCard', { timeout: 15000 });
  });

  test('gibberish query shows no-results state', async ({ page }) => {
    await page.locator('.exerciseSearch').fill('zzzzzzzzzz');
    await expect(page.locator('.exerciseLoading')).toHaveText('No exercises found.');
    expect(await page.locator('.exerciseCard').count()).toBe(0);
  });

  test('clearing the search restores all exercises', async ({ page }) => {
    const allCount = await page.locator('.exerciseCard').count();
    await page.locator('.exerciseSearch').fill('zzzzzzzzzz');
    await expect(page.locator('.exerciseLoading')).toHaveText('No exercises found.');
    await page.locator('.exerciseSearch').fill('');
    await expect
      .poll(async () => page.locator('.exerciseCard').count(), { timeout: 10000 })
      .toBe(allCount);
  });
});
