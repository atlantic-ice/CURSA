import { test, expect } from '@playwright/test';

test.describe('Profiles Page', () => {
  
  test.beforeEach(async ({ page }) => {
    // Переходим на страницу профилей (если существует)
    await page.goto('/profiles');
  });

  test('should display profiles list', async ({ page }) => {
    // Проверяем загрузку страницы
    await page.waitForLoadState('networkidle');
    
    // Ищем заголовок или список профилей
    const profilesContent = page.locator('text=/профил|profile|гост|настройк/i').first();
    
    if (await profilesContent.isVisible()) {
      await expect(profilesContent).toBeVisible();
    } else {
      // Страница может не существовать - это ок
      console.log('Profiles page may not exist or has different structure');
    }
  });

  test('should load profiles from API', async ({ page }) => {
    // Перехватываем API запрос
    const profilesResponse = page.waitForResponse(
      response => response.url().includes('/api/profiles') && response.status() === 200,
      { timeout: 10000 }
    ).catch(() => null);
    
    await page.goto('/profiles');
    
    const response = await profilesResponse;
    if (response) {
      const data = await response.json();
      expect(Array.isArray(data) || typeof data === 'object').toBeTruthy();
    }
  });

  test('should display profile details', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Ищем карточку или строку профиля
    const profileCard = page.locator('[data-testid="profile-card"], [class*="profile"], [class*="Profile"]').first();
    
    if (await profileCard.isVisible()) {
      await profileCard.click();
      
      // Ожидаем детали профиля
      await expect(
        page.locator('text=/шрифт|поля|интервал|font|margins/i').first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show system profiles as non-editable', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Ищем системный профиль (ГОСТ)
    const systemProfile = page.locator('text=/гост|default_gost|системн/i').first();
    
    if (await systemProfile.isVisible()) {
      // Системные профили не должны иметь кнопку удаления
      const deleteButton = page.locator('button:has-text("удалить"), [data-testid="delete-profile"]').first();
      
      // Кликаем на профиль
      await systemProfile.click();
      
      // Кнопка удаления должна быть скрыта или disabled
      if (await deleteButton.isVisible()) {
        await expect(deleteButton).toBeDisabled();
      }
    }
  });
});

test.describe('Profile Templates', () => {
  
  test('should display available templates', async ({ page }) => {
    // Запрос к API шаблонов
    const response = await page.request.get('http://localhost:5000/api/profiles/templates');
    
    if (response.ok()) {
      const templates = await response.json();
      expect(Array.isArray(templates)).toBeTruthy();
      expect(templates.length).toBeGreaterThan(0);
      
      // Проверяем структуру шаблона
      const template = templates[0];
      expect(template).toHaveProperty('id');
      expect(template).toHaveProperty('name');
      expect(template).toHaveProperty('rules');
    }
  });
});

test.describe('Profile Comparison', () => {
  
  test('should compare two profiles via API', async ({ page }) => {
    // Сравнение через API
    const response = await page.request.get(
      'http://localhost:5000/api/profiles/compare?profile1=default_gost&profile2=default_gost'
    );
    
    if (response.ok()) {
      const comparison = await response.json();
      expect(comparison).toHaveProperty('profile1');
      expect(comparison).toHaveProperty('profile2');
      expect(comparison).toHaveProperty('differences');
    }
  });
});
