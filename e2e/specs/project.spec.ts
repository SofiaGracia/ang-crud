import { test } from '@playwright/test';
import { createProject } from '../helpers/project.helper';

test('should create project', async ({ page }) => {
    const projectName = `Project ${Date.now()}`;

    await createProject(page, projectName);
});
