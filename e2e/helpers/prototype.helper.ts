import { expect, Page } from '@playwright/test';

export async function createPrototype(page: Page) {

    // Open prototype creation form
    await page.click('[data-testid="add-prototype-button"]');

    // Fill the specifications
    await page.fill('[data-testid="dialog-name-input"]', `Prototype ${Date.now()}`);
    await page.setInputFiles('[data-testid="prototype-html-file-input"]', 'e2e/fixtures/test.html');

    await page.click('[data-testid="dialog-submit-button"]');

    const prototype = page.locator('[data-testid="prototype-card"]').first();

    await expect(prototype).toBeVisible({ timeout: 10000 });

    return prototype;
}
