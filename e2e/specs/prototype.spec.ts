import { test } from '@playwright/test';
import { createPrototype } from '../helpers/prototype.helper';

test('should create prototype', async ({ page }) => {
    await page.goto('http://localhost:4200/projects');

    await page.locator('[data-testid="project-card"]').first().click();

    await createPrototype(page);
});
