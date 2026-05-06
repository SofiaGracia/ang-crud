/// <reference types="node" />
import { test, expect } from '@playwright/test';

test('full flow: create project → prototype → visualize', async ({ page }) => {
    // LOGIN (storageState)
    await page.goto('http://localhost:4200/projects');

    // CREATE PROJECT
    await page.click('[data-testid="create-project-button"]');

    const data = Date.now();
    await page.fill('[data-testid="dialog-name-input"]', `Test Project ${data}`);
    await page.fill('[data-testid="dialog-description-textarea"]', 'E2E project');

    await page.locator('[data-testid="dialog-submit-button"]').first().click();

    // CHECK PROJECT EXISTS
    const project = page
        .locator('[data-testid="project-card"]')
        .filter({ hasText: `Test Project ${data}` });

    await expect(project).toBeVisible({ timeout: 10000 });

    // OPEN PROJECT CREATED
    await project.click();

    // CREATE PROTOTYPE
    await page.click('[data-testid="add-prototype-button"]');

    await page.fill('[data-testid="dialog-name-input"]', `Test input ${Date.now()}`);

    // FILE UPLOAD
    await page.setInputFiles('[data-testid="prototype-html-file-input"]', 'e2e/fixtures/test.html');

    await page.click('[data-testid="dialog-submit-button"]');

    // CHECK PROTOTYPE EXISTS
    await expect(page.locator('[data-testid="prototype-card"]').first()).toBeVisible();

    // OPEN PROTOTYPE
    await page.locator('[data-testid="prototype-card"]').first().click();

    // CHECK PREVIEW TAB
    await page.click('[data-testid="prototype-tab-preview"]');
    const frame = page.frameLocator('[data-testid="prototype-render-iframe"]');
    await expect(frame.locator('body')).toContainText('Hello prototype');

    // CHECK CODE TAB
    await page.click('[data-testid="prototype-tab-code"]');
    await expect(page.locator('[data-testid="prototype-code-view"]')).toBeVisible();
});
