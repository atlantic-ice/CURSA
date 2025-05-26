/**
 * Скрипт для автоматической генерации базовых тестов для компонентов
 * Запуск: node generateComponentTests.js
 */

const fs = require('fs');
const path = require('path');

// Путь к директории с компонентами
const componentsDir = path.join(__dirname, '..');
// Путь к директории с тестами
const testsDir = __dirname;

// Шаблон для базового теста компонента
const generateTestTemplate = (componentName) => `import React from 'react';
import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ${componentName} from '../${componentName}';
import { renderWithProviders } from './utils/test-utils';

// Импортируем моки при необходимости
// import { ColorModeContext } from './utils/test-utils';

describe('${componentName}', () => {
  test('рендерится без ошибок', () => {
    // Добавьте необходимые пропсы для компонента
    renderWithProviders(<${componentName} />);
    
    // Добавьте ассерты для базового тестирования компонента
    // например: expect(screen.getByText(...)).toBeInTheDocument();
  });
  
  // Добавьте дополнительные тесты для компонента
});
`;

// Функция для получения списка файлов компонентов
const getComponentFiles = () => {
  return fs.readdirSync(componentsDir)
    .filter(file => {
      return (
        file.endsWith('.js') || 
        file.endsWith('.jsx') || 
        file.endsWith('.tsx')
      ) && 
      !file.endsWith('.test.js') && 
      !file.endsWith('.spec.js') &&
      file !== 'index.js'
    });
};

// Функция для создания теста для компонента
const createTestForComponent = (componentFile) => {
  const componentName = path.basename(componentFile, path.extname(componentFile));
  const testFile = path.join(testsDir, `${componentName}.test.js`);
  
  // Проверяем, существует ли уже тест для этого компонента
  if (fs.existsSync(testFile)) {
    console.log(`Тест для компонента ${componentName} уже существует`);
    return;
  }
  
  // Создаем файл с тестом
  fs.writeFileSync(testFile, generateTestTemplate(componentName));
  console.log(`Создан тест для компонента ${componentName}`);
};

// Главная функция
const generateTests = () => {
  console.log('Начинаем генерацию тестов для компонентов...');
  
  const componentFiles = getComponentFiles();
  
  // Создаем директорию для утилит, если она не существует
  const utilsDir = path.join(testsDir, 'utils');
  if (!fs.existsSync(utilsDir)) {
    fs.mkdirSync(utilsDir);
    console.log('Создана директория для утилит тестирования');
  }
  
  // Генерируем тесты для каждого компонента
  componentFiles.forEach(createTestForComponent);
  
  console.log(`Генерация завершена. Создано ${componentFiles.length} тестов.`);
};

// Запускаем функцию генерации тестов
generateTests(); 