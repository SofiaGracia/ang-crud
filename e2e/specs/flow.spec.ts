import { test, expect } from '@playwright/test';
import { createProject } from '../helpers/project.helper';
import { createPrototype } from '../helpers/prototype.helper';

test('project → prototype → render flow', async ({ page }) => {
    const projectName = `Flow Project ${Date.now()}`;

    const { card: projectCard } = await createProject(page, projectName);
    await projectCard.click();

    const { card: prototypeCard } = await createPrototype(page);
    await prototypeCard.click();

    await page.click('[data-testid="prototype-tab-preview"]');

    const frame = page.frameLocator('[data-testid="prototype-render-iframe"]');

    await expect(frame.locator('body')).toContainText('Hello prototype');

    await page.click('[data-testid="prototype-tab-code"]');
    await expect(page.locator('[data-testid="prototype-code-view"]')).toBeVisible();
});
