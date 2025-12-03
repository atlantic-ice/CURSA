import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright конфигурация для E2E тестов CURSA
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  
  /* Максимальное время выполнения теста */
  timeout: 60 * 1000,
  
  /* Ожидание для expect */
  expect: {
    timeout: 10000
  },
  
  /* Параллельное выполнение */
  fullyParallel: true,
  
  /* Запрет .only на CI */
  forbidOnly: !!process.env.CI,
  
  /* Повторы на CI */
  retries: process.env.CI ? 2 : 0,
  
  /* Параллельные воркеры */
  workers: process.env.CI ? 1 : undefined,
  
  /* Репортер */
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['list']
  ],
  
  /* Общие настройки */
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    trace: 'on-first-retry',
    actionTimeout: 15000,
  },

  /* Браузеры */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 5'] },
    },
  ],

  /* Автозапуск серверов */
  webServer: [
    {
      command: 'cd ../backend && python run.py',
      url: 'http://localhost:5000/api/health',
      timeout: 30 * 1000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm start',
      url: 'http://localhost:3000',
      timeout: 60 * 1000,
      reuseExistingServer: !process.env.CI,
    }
  ],
});
