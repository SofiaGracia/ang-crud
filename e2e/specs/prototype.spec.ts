import { test, expect } from '@playwright/test';
import { createProject } from '../helpers/project.helper';
import { createPrototype } from '../helpers/prototype.helper';

test('should create prototype', async ({ page }) => {
    const projectName = `Proto Test Project ${Date.now()}`;

    const { card: projectCard } = await createProject(page, projectName);
    await projectCard.click();

    const prototypeName = `Test Prototype ${Date.now()}`;
    const { card: prototypeCard, name: createdName } = await createPrototype(
        page,
        prototypeName,
    );

    await expect(prototypeCard).toContainText(createdName);
    await expect(prototypeCard).toBeVisible();
});
