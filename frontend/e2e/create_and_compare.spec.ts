import { test, expect } from '@playwright/test';

test.describe('Profiles workflow', () => {
  test('Create profile then compare', async ({ page }) => {
    await page.goto('/profiles');
    // Click create profile
    const create = page.getByRole('button', { name: 'Создать профиль' });
    await expect(create).toBeVisible();
    await create.click();

    // Select template
    await page.getByRole('button', { name: 'Минимальный' }).click();

    // Fill name
    const nameInput = page.locator('input').filter({ hasText: 'Название профиля' }).first();
    // Playwright text inputs: find by label text
    const nameByLabel = page.getByLabel('Название профиля');
    await nameByLabel.fill('E2E Test Profile');

    // Click Next until Save
    const nextBtn = page.getByRole('button', { name: 'Далее' });
    if (await nextBtn.isEnabled()) await nextBtn.click(); // Step 2
    if (await nextBtn.isEnabled()) await nextBtn.click(); // Step 3
    if (await nextBtn.isEnabled()) await nextBtn.click(); // Step 4

    const saveBtn = page.getByRole('button', { name: 'Сохранить' });
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    // Wait for new profile in list
    await expect(page.getByText('E2E Test Profile')).toBeVisible({ timeout: 5000 });

    // Open comparison
    await page.getByRole('button', { name: 'Сравнить профили' }).click();

    // Choose profiles and compare - select the new profile and default_gost
    // The select component is a MUI Select, open dropdown and select by visible text
    await page.getByLabel('Профиль 2').click();
    const opt = page.getByRole('option', { name: 'E2E Test Profile' }).first();
    await opt.click();

    // Click compare
    await page.getByRole('button', { name: 'Сравнить' }).click();

    // Expect a table of differences
    await expect(page.locator('table')).toBeVisible();
    await expect(page.getByText('Совпадение')).toBeVisible();
  });
});
