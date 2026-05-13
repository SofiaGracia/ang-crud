import { expect, Page } from '@playwright/test';

export async function createProject(page: Page, projectName: string) {
    await page.goto('http://localhost:4200/projects');

    await page.click('[data-testid="create-project-button"]');

    await page.fill('[data-testid="dialog-name-input"]', projectName);
    await page.fill('[data-testid="dialog-description-textarea"]', 'E2E project');

    await page.click('[data-testid="dialog-submit-button"]');

    await expect(page.locator('[data-testid="project-dialog"]')).not.toBeVisible({
        timeout: 5000,
    });

    const card = page
        .locator('[data-testid="project-card"]')
        .filter({ hasText: projectName });

    await expect(card).toBeVisible({ timeout: 10000 });

    return { card, name: projectName };
}
