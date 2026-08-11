import { test, expect } from '@playwright/test';

test.describe('Create Your Plan Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('text=Start planning');
  });

  test('displays all form fields', { tag: ['@smoke'] }, async ({ page }) => {
    await expect(page.locator('input[name="age"]')).toBeVisible();
    await expect(page.locator('select[name="gender"]')).toBeVisible();
    await expect(page.locator('input[name="height"]')).toBeVisible();
    await expect(page.locator('input[name="weight"]')).toBeVisible();
    await expect(page.locator('select[name="goal"]')).toBeVisible();
    await expect(page.locator('select[name="experience"]')).toBeVisible();
    await expect(page.locator('select[name="daysPerWeek"]')).toBeVisible();
    await expect(page.locator('select[name="equipment"]')).toBeVisible();
  });

  test('injuries/limitations field is removed', async ({ page }) => {
    await expect(page.locator('textarea[name="limitations"]')).not.toBeVisible();
  });

  test('form has default values', async ({ page }) => {
    await expect(page.locator('input[name="age"]')).toHaveValue('30');
    await expect(page.locator('select[name="gender"]')).toHaveValue('male');
    await expect(page.locator('input[name="height"]')).toHaveValue('178');
    await expect(page.locator('input[name="weight"]')).toHaveValue('82');
    await expect(page.locator('select[name="goal"]')).toHaveValue('build-muscle');
    await expect(page.locator('select[name="experience"]')).toHaveValue('intermediate');
    await expect(page.locator('select[name="daysPerWeek"]')).toHaveValue('4');
  });

  test('generate button exists and is clickable', { tag: ['@smoke'] }, async ({ page }) => {
    const btn = page.locator('button', { hasText: 'Generate my workout plan' });
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
  });

  test('exercises button scrolls to exercises section', async ({ page }) => {
    const exercisesBtn = page.locator('.formCard button', { hasText: 'Exercises' });
    await expect(exercisesBtn).not.toBeVisible();
    const mainBtn = page.locator('.formCard button', { hasText: 'Generate my workout plan' });
    await expect(mainBtn).toBeVisible();
  });

  test('can fill in form fields', async ({ page }) => {
    await page.fill('input[name="age"]', '25');
    await expect(page.locator('input[name="age"]')).toHaveValue('25');

    await page.selectOption('select[name="goal"]', 'fat-loss');
    await expect(page.locator('select[name="goal"]')).toHaveValue('fat-loss');

    await page.selectOption('select[name="daysPerWeek"]', '5');
    await expect(page.locator('select[name="daysPerWeek"]')).toHaveValue('5');
  });
});
