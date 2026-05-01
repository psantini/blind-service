import { test, expect } from '@playwright/test';

test.describe('UI component fixtures', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test-fixtures');
  });

  test('full fixtures page', async ({ page }) => {
    await expect(page).toHaveScreenshot('fixtures-full.png', {
      fullPage: true,
    });
  });

  test('Button variants', async ({ page }) => {
    const section = page.locator('section').first();
    await expect(section).toHaveScreenshot('button-variants.png');
  });

  test('Badge variants', async ({ page }) => {
    const section = page.locator('section').nth(1);
    await expect(section).toHaveScreenshot('badge-variants.png');
  });

  test('Input states', async ({ page }) => {
    const section = page.locator('section').nth(2);
    await expect(section).toHaveScreenshot('input-states.png');
  });
});
