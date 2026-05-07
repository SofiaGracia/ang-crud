import { expect, Page } from '@playwright/test';

export async function createProject(page: Page, projectName: string) {
    await page.goto('http://localhost:4200/projects');

    // Open create form
    await page.click('[data-testid="create-project-button"]');

    // Fill the inputs
    await page.fill('[data-testid="dialog-name-input"]', projectName);
    await page.fill('[data-testid="dialog-description-textarea"]', 'E2E project');

    // Click the create button
    await page.click('[data-testid="dialog-submit-button"]');

    // Find the new project created
    const project = page.locator('[data-testid="project-card"]').filter({ hasText: projectName });

    await expect(project).toBeVisible({ timeout: 10000 });

    return project;
}
