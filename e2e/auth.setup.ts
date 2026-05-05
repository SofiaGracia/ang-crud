import { test as setup, expect } from '@playwright/test';

setup('login with email', async ({ page }) => {
    await page.goto('http://localhost:4200/login');

    await page.fill('input[type="email"]', process.env.E2E_EMAIL );
    await page.fill('input[type="password"]', process.env.E2E_PASSWORD);

    await page.click('button[type="submit"]');

    // espera redirecció
    await expect(page).toHaveURL('http://localhost:4200/projects');

    await page.context().storageState({ path: 'e2e/auth.json' });
});
