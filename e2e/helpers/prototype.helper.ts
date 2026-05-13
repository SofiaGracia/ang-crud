import { expect, Page } from '@playwright/test';

export async function createPrototype(
    page: Page,
    name?: string,
    fixturePath?: string,
) {
    const prototypeName = name ?? `Prototype ${Date.now()}`;
    const filePath = fixturePath ?? 'e2e/fixtures/test.html';

    await page.click('[data-testid="add-prototype-button"]');

    await page.fill('[data-testid="dialog-name-input"]', prototypeName);
    await page.setInputFiles('[data-testid="prototype-html-file-input"]', filePath);

    await page.click('[data-testid="dialog-submit-button"]');

    await expect(page.locator('[data-testid="prototype-dialog"]')).not.toBeVisible({
        timeout: 5000,
    });

    const card = page
        .locator('[data-testid="prototype-card"]')
        .filter({ hasText: prototypeName });

    await expect(card).toBeVisible({ timeout: 10000 });

    return { card, name: prototypeName };
}
