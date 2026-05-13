import { test, expect } from '@playwright/test';
import { createProject, moveProjectToTrash, restoreProjectFromTrash } from '../helpers/project.helper';

test.describe('Project CRUD persistence flow', () => {
    test('should create, persist after reload, trash, and restore a project', async ({ page }) => {
        const projectName = `CRUD Project ${Date.now()}`;

        // 1-2. Create project and verify card is visible
        const { card } = await createProject(page, projectName);
        await expect(card).toContainText(projectName);

        // 3-4. Reload and verify persistence
        await page.reload();
        const cardAfterReload = page
            .locator('[data-testid="project-card"]')
            .filter({ hasText: projectName });
        await expect(cardAfterReload).toBeVisible({ timeout: 10000 });
        await expect(cardAfterReload).toContainText(projectName);

        // 5-6. Move to trash and verify gone from projects list
        await moveProjectToTrash(page, projectName);
        await expect(cardAfterReload).not.toBeVisible({ timeout: 10000 });

        // 7-8. Navigate to trash and verify project exists there
        await page.goto('/projects/trash');
        const trashedItem = page
            .locator('[data-testid="trash-project-item"]')
            .filter({ hasText: projectName });
        await expect(trashedItem).toBeVisible({ timeout: 10000 });

        // 9. Restore project from trash
        await restoreProjectFromTrash(page, projectName);

        // 10-11. Navigate back to projects and verify project exists again
        await page.goto('/projects');
        const restoredCard = page
            .locator('[data-testid="project-card"]')
            .filter({ hasText: projectName });
        await expect(restoredCard).toBeVisible({ timeout: 10000 });
        await expect(restoredCard).toContainText(projectName);
    });
});
