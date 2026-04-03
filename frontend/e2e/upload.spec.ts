import { expect, Page, test } from '@playwright/test';
import path from 'path';

const uploadFixture = path.join(__dirname, 'fixtures', 'test-document.docx');

async function setUploadFile(page: Page, filePathOrPayload: string | {
  name: string;
  mimeType: string;
  buffer: Buffer;
}) {
  const fileInput = page.locator('input[type="file"]').first();
  await expect(fileInput).toBeAttached();
  await fileInput.setInputFiles(filePathOrPayload);
}

test.describe('Document Upload Flow', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display upload page correctly', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /перетащите \.docx сюда/i })).toBeVisible();
    await expect(page.locator('input[type="file"]').first()).toBeAttached();
  });

  test('should show error for invalid file type', async ({ page }) => {
    const invalidContent = Buffer.from('This is not a docx file');

    await setUploadFile(page, {
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: invalidContent,
    });

    // Для невалидного типа файл не должен переходить в состояние "готов к проверке".
    await expect(page.getByRole('heading', { name: /перетащите \.docx сюда/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /начать проверку/i })).toHaveCount(0);
  });

  test('should upload valid DOCX file', async ({ page }) => {
    await setUploadFile(page, uploadFixture);

    const startButton = page.getByRole('button', { name: /начать проверку/i });
    await expect(startButton).toBeVisible();

    await Promise.all([
      page.waitForURL(/\/report/, { timeout: 45000 }),
      startButton.click(),
    ]);

    await expect(page).toHaveURL(/\/report/);
  });

  test('should display check results after upload', async ({ page }) => {
    await setUploadFile(page, uploadFixture);

    const startButton = page.getByRole('button', { name: /начать проверку/i });
    await Promise.all([
      page.waitForURL(/\/report/, { timeout: 45000 }),
      startButton.click(),
    ]);

    await expect(page.getByText(/отчет|ошиб|замечан|score|балл/i).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('should allow downloading corrected file', async ({ page }) => {
    await setUploadFile(page, uploadFixture);
    await Promise.all([
      page.waitForURL(/\/report/, { timeout: 45000 }),
      page.getByRole('button', { name: /начать проверку/i }).click(),
    ]);

    const downloadButton = page
      .locator('button:has-text("скач"), a:has-text("скач"), [data-testid="download-btn"]')
      .first();

    if (await downloadButton.isVisible()) {
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 10000 }),
        downloadButton.click(),
      ]);

      expect(download.suggestedFilename().toLowerCase()).toContain('.docx');
    }
  });
});

test.describe('Profile Selection', () => {

  test('should display available profiles', async ({ page }) => {
    await page.goto('/');

    // Ищем селектор профилей
    const profileSelector = page.locator('[data-testid="profile-selector"], [class*="ProfileSelector"], select, [role="combobox"]').first();

    if (await profileSelector.isVisible()) {
      await profileSelector.click();

      // Проверяем наличие опций профилей
      await expect(page.locator('text=/гост|default|профиль/i').first()).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Navigation', () => {

  test('should navigate between pages', async ({ page }) => {
    await page.goto('/');

    // Проверяем навигацию (если есть)
    const navLinks = page.locator('nav a, header a, [class*="nav"] a');
    const count = await navLinks.count();

    if (count > 0) {
      // Кликаем по первой ссылке
      await navLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Проверяем, что страница изменилась
      expect(page.url()).not.toBe('http://localhost:3000/');
    }
  });
});

test.describe('Responsive Design', () => {

  test('should be usable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /перетащите \.docx сюда/i })).toBeVisible();
    await expect(page.locator('input[type="file"]').first()).toBeAttached();
  });
});

test.describe('Error Handling', () => {

  test('should handle server errors gracefully', async ({ page }) => {
    await page.goto('/');

    // Перехватываем API запрос и возвращаем ошибку
    await page.route('**/api/document/upload', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await setUploadFile(page, {
      name: 'test.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from('fake docx content'),
    });

    await page.getByRole('button', { name: /начать проверку/i }).click();

    await expect(page.locator('text=/ошибка|error|не удалось/i').first()).toBeVisible({ timeout: 10000 });
  });
});
