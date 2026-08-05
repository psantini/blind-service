import { test, expect } from '@playwright/test';

test.describe('UI component fixtures', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test-fixtures');
  });

  // ── Primitives ──────────────────────────────────────────────────────────

  test('full fixtures page', async ({ page }) => {
    await expect(page).toHaveScreenshot('fixtures-full.png', { fullPage: true });
  });

  test('Button variants', async ({ page }) => {
    await expect(page.locator('#section-button')).toHaveScreenshot('button-variants.png');
  });

  test('Badge variants', async ({ page }) => {
    await expect(page.locator('#section-badge')).toHaveScreenshot('badge-variants.png');
  });

  test('Input states', async ({ page }) => {
    await expect(page.locator('#section-input')).toHaveScreenshot('input-states.png');
  });

  // ── Leaderboard ─────────────────────────────────────────────────────────

  test('Leaderboard — taste only with highlighted row', async ({ page }) => {
    await expect(page.locator('#section-leaderboard')).toHaveScreenshot('leaderboard-taste-only.png');
  });

  test('Leaderboard — nose + taste columns', async ({ page }) => {
    await expect(page.locator('#section-leaderboard-nosing')).toHaveScreenshot('leaderboard-nosing.png');
  });

  test('Leaderboard — empty state', async ({ page }) => {
    await expect(page.locator('#section-leaderboard-empty')).toHaveScreenshot('leaderboard-empty.png');
  });

  // ── Sample Breakdown ────────────────────────────────────────────────────

  test('SampleBreakdown — collapsed', async ({ page }) => {
    await expect(page.locator('#section-sample-breakdown')).toHaveScreenshot('sample-breakdown-collapsed.png');
  });

  test('SampleBreakdown — sample A expanded', async ({ page }) => {
    // Click first sample card to expand
    await page.locator('#section-sample-breakdown button').first().click();
    await expect(page.locator('#section-sample-breakdown')).toHaveScreenshot('sample-breakdown-expanded-a.png');
  });

  test('SampleBreakdown — all samples expanded', async ({ page }) => {
    // Expand all sample cards
    const buttons = page.locator('#section-sample-breakdown button');
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      await buttons.nth(i).click();
    }
    await expect(page.locator('#section-sample-breakdown')).toHaveScreenshot('sample-breakdown-expanded-all.png');
  });

  // ── Fuzzy Review Panel ──────────────────────────────────────────────────

  test('FuzzyReviewPanel — with pending items', async ({ page }) => {
    await expect(page.locator('#section-fuzzy-review')).toHaveScreenshot('fuzzy-review-pending.png');
  });

  test('FuzzyReviewPanel — empty state', async ({ page }) => {
    await expect(page.locator('#section-fuzzy-review-empty')).toHaveScreenshot('fuzzy-review-empty.png');
  });

  // ── Flight Progress Bar ─────────────────────────────────────────────────

  test('FlightProgressBar — all variants', async ({ page }) => {
    await expect(page.locator('#section-flight-progress')).toHaveScreenshot('flight-progress.png');
  });

  // ── Blind Card ──────────────────────────────────────────────────────────

  test('BlindCard — active / setup / complete variants', async ({ page }) => {
    await expect(page.locator('#section-blind-card')).toHaveScreenshot('blind-card-variants.png');
  });

  // ── Question Inputs ─────────────────────────────────────────────────────

  test('Question inputs — all types and states', async ({ page }) => {
    await expect(page.locator('#section-question-inputs')).toHaveScreenshot('question-inputs.png');
  });
});
