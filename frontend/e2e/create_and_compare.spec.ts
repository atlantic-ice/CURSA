import { expect, test } from '@playwright/test';

test.describe('Profiles workflow', () => {
  test('Open comparison and view result table', async ({ page }) => {
    await page.goto('/profiles');
    await expect(page.getByRole('heading', { name: /профили оформления/i })).toBeVisible();

    const openCompareButton = page.getByTestId('profiles-compare-button');
    await expect(openCompareButton).toBeVisible();
    await openCompareButton.click();

    await expect(page.getByText(/сравнение профилей/i)).toBeVisible();

    const selectProfile1 = page.getByRole('combobox').first();
    const selectProfile2 = page.getByRole('combobox').nth(1);
    await expect(selectProfile1).toBeVisible();
    await expect(selectProfile2).toBeVisible();

    await selectProfile1.click();
    await page.getByRole('option').first().click();

    await selectProfile2.click();
    await page.getByRole('option').last().click();

    const compareButton = page.getByRole('button', { name: /^сравнить$/i });
    await expect(compareButton).toBeEnabled();
    await compareButton.click();

    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/совпадение|различ|отлич/i).first()).toBeVisible();
  });
});
