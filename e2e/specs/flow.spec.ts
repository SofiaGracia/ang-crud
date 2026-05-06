import { test, expect } from '@playwright/test';
import { createProject } from '../helpers/project.helper';
import { createPrototype } from '../helpers/prototype.helper';

test('project → prototype → render flow', async ({ page }) => {

    const projectName = `Flow Project ${Date.now()}`;

    // PROJECT
    const project = await createProject(page, projectName);
    await project.click();

    // PROTOTYPE
    const prototype = await createPrototype(page);
    await prototype.click();

    // RENDER CHECK
    await page.click('[data-testid="prototype-tab-preview"]');

    const frame = page.frameLocator(
        '[data-testid="prototype-render-iframe"]'
    );

    await expect(frame.locator('body')).toContainText('Hello prototype');

    // CODE TAB
    await page.click('[data-testid="prototype-tab-code"]');
    await expect(
        page.locator('[data-testid="prototype-code-view"]')
    ).toBeVisible();
});
