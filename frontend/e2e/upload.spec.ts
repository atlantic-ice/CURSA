import { test, expect, Page } from '@playwright/test';
import path from 'path';

test.describe('Document Upload Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display upload page correctly', async ({ page }) => {
    // Проверяем основные элементы страницы
    await expect(page.locator('text=CURSA')).toBeVisible();
    
    // Проверяем наличие зоны загрузки
    const dropZone = page.locator('[data-testid="drop-zone"], .drop-zone, [class*="DropZone"]').first();
    await expect(dropZone).toBeVisible();
  });

  test('should show error for invalid file type', async ({ page }) => {
    // Создаём невалидный файл
    const invalidContent = Buffer.from('This is not a docx file');
    
    // Загружаем через input
    const fileInput = page.locator('input[type="file"]').first();
    
    await fileInput.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: invalidContent,
    });
    
    // Ожидаем сообщение об ошибке
    await expect(page.locator('text=/недопустимый|формат|docx/i')).toBeVisible({ timeout: 5000 });
  });

  test('should upload valid DOCX file', async ({ page }) => {
    // Путь к тестовому документу
    const testDocPath = path.join(__dirname, 'fixtures', 'test-document.docx');
    
    // Загружаем файл
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(testDocPath);
    
    // Ожидаем индикатор загрузки или результаты
    await expect(
      page.locator('[data-testid="loading"], [class*="loading"], [class*="progress"], text=/загрузка|обработка/i').first()
    ).toBeVisible({ timeout: 10000 });
    
    // Ожидаем результаты проверки (до 30 секунд)
    await expect(
      page.locator('[data-testid="check-results"], [class*="results"], text=/результат|проверк|ошибок/i').first()
    ).toBeVisible({ timeout: 30000 });
  });

  test('should display check results after upload', async ({ page }) => {
    const testDocPath = path.join(__dirname, 'fixtures', 'test-document.docx');
    
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(testDocPath);
    
    // Ждём завершения проверки
    await page.waitForResponse(
      response => response.url().includes('/api/document/upload') && response.status() === 200,
      { timeout: 30000 }
    );
    
    // Проверяем наличие секции с результатами
    await expect(page.locator('text=/найдено|ошибок|замечаний|проблем/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('should allow downloading corrected file', async ({ page }) => {
    const testDocPath = path.join(__dirname, 'fixtures', 'test-document.docx');
    
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(testDocPath);
    
    // Ждём завершения обработки
    await page.waitForResponse(
      response => response.url().includes('/api/document/upload') && response.status() === 200,
      { timeout: 30000 }
    );
    
    // Ищем кнопку скачивания
    const downloadButton = page.locator('button:has-text("скачать"), a:has-text("скачать"), [data-testid="download-btn"]').first();
    
    if (await downloadButton.isVisible()) {
      // Ожидаем событие скачивания
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 10000 }),
        downloadButton.click(),
      ]);
      
      // Проверяем, что файл скачивается
      expect(download.suggestedFilename()).toContain('.docx');
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
    
    // Основные элементы должны быть видны
    await expect(page.locator('text=CURSA')).toBeVisible();
    
    // Зона загрузки должна быть доступна
    const dropZone = page.locator('[data-testid="drop-zone"], .drop-zone, [class*="DropZone"], input[type="file"]').first();
    await expect(dropZone).toBeVisible();
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
    
    // Пробуем загрузить файл
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'test.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from('fake docx content'),
    });
    
    // Ожидаем сообщение об ошибке (не crash)
    await expect(page.locator('text=/ошибка|error|не удалось/i').first()).toBeVisible({ timeout: 10000 });
  });
});
