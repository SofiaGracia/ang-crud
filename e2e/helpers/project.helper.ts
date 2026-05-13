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

export async function moveProjectToTrash(page: Page, projectName: string) {
    const card = page
        .locator('[data-testid="project-card"]')
        .filter({ hasText: projectName });

    await expect(card).toBeVisible({ timeout: 10000 });

    await card.locator('[data-testid="project-menu"]').click();
    await card.locator('[data-testid="project-move-to-trash"]').click();

    await expect(card).not.toBeVisible({ timeout: 10000 });
}

export async function restoreProjectFromTrash(page: Page, projectName: string) {
    const trashedItem = page
        .locator('[data-testid="trash-project-item"]')
        .filter({ hasText: projectName });

    await expect(trashedItem).toBeVisible({ timeout: 10000 });

    await trashedItem.locator('[data-testid="trash-restore-button"]').click();

    await expect(trashedItem).not.toBeVisible({ timeout: 10000 });
}

export async function permanentDeleteProject(page: Page, projectName: string) {
    const trashedItem = page
        .locator('[data-testid="trash-project-item"]')
        .filter({ hasText: projectName });

    await expect(trashedItem).toBeVisible({ timeout: 10000 });

    await trashedItem.locator('[data-testid="trash-delete-permanently"]').click();
    await page.locator('[data-testid="confirm-modal-confirm"]').click();

    await expect(trashedItem).not.toBeVisible({ timeout: 10000 });
}
