import { test, expect } from '@playwright/test';

test('projects list loads', async ({ page }) => {
    await page.goto('/projects');

    const cards = page.locator('[data-testid="project-card"]');

    await expect(cards.first()).toBeVisible();
});
