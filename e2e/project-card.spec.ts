import { test, expect } from '@playwright/test';

test('projects list loads', async ({ page }) => {
    await page.goto('http://localhost:4200/projects');

    const cards = page.locator('[data-testid="project-card"]');

    await expect(cards.first()).toBeVisible();
});
