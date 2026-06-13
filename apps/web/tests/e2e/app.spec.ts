import { expect, test } from '@playwright/test';

test('loads the bundled score and exposes playback controls', async ({ page }) => {
  await page.route('**/api/health', (route) => route.abort());
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Simple Scale' })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByLabel('Rendered score')).toBeVisible();
  await page.getByRole('button', { name: 'Play score' }).click();
  await expect(page.getByRole('button', { name: 'Pause score' })).toBeVisible();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Pause score' }).click();
  await expect(page.getByRole('button', { name: 'Play score' })).toBeVisible();
  const pausedAt = Number(await page.getByRole('slider', { name: 'Playback position' }).inputValue());
  await page.waitForTimeout(300);
  const stillPausedAt = Number(await page.getByRole('slider', { name: 'Playback position' }).inputValue());
  expect(Math.abs(stillPausedAt - pausedAt)).toBeLessThan(0.02);
  await page.getByRole('button', { name: 'Stop and return to beginning' }).click();
  await expect(page.getByText('Local service offline')).toBeVisible();
});
