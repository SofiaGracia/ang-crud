import { expect, Page } from '@playwright/test';

export async function createProject(page: Page, projectName: string) {
    await page.goto('http://localhost:4200/projects');

    // Open create form
    await page.click('[data-testid="create-project-button"]');

    // Fill the inputs
    await page.fill('[data-testid="dialog-name-input"]', projectName);
    await page.fill('[data-testid="dialog-description-textarea"]', 'E2E project');

    // Wait for the API response before clicking submit
    const responsePromise = page.waitForResponse(
        (response) => response.url().includes('/api') && response.status() === 201,
    );

    // Click the create button
    await page.click('[data-testid="dialog-submit-button"]');

    // Wait for the API to respond
    await responsePromise;

    // Wait for dialog to close (optional but recommended)
    await page
        .waitForSelector('[data-testid="dialog-name-input"]', { state: 'hidden', timeout: 5000 })
        .catch(() => {});

    // Find the new project created
    const project = page.locator('[data-testid="project-card"]').filter({ hasText: projectName });

    await expect(project).toBeVisible({ timeout: 10000 });

    return project;
}
