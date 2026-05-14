/// <reference types="node" />
import { test as setup, expect } from '@playwright/test';

setup('login with email', async ({ page }) => {
    const email = process.env.E2E_EMAIL;
    const password = process.env.E2E_PASSWORD;
    if (!email || !password) {
        throw new Error('E2E_EMAIL and E2E_PASSWORD must be set in .env');
    }

    await page.goto('/login');

    try {
        await page.fill('input[type="email"]', email);
        await page.fill('input[type="password"]', password);
        await page.click('button[type="submit"]');

        await expect(page).toHaveURL('/projects');
    } catch (error) {
        throw new Error(
            `Login failed. Check credentials or network. ${error instanceof Error ? error.message : error}`
        );
    }

    await page.context().storageState({ path: 'e2e/auth.json' });
});
