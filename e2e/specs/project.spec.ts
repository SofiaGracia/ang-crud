import { test, expect } from '@playwright/test';
import { createProject } from '../helpers/project.helper';

test('should create project', async ({ page }) => {
    const projectName = `Project ${Date.now()}`;

    const { card, name } = await createProject(page, projectName);

    await expect(card).toContainText(name);
    await expect(card).toBeVisible();
});
