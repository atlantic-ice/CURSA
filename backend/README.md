# Система нормоконтроля документов (CURSA)

## Описание
Система проверки и исправления форматирования документов DOCX в соответствии с требованиями ГОСТ.

## Запуск сервера

### Windows
1. Откройте командную строку или PowerShell
2. Перейдите в директорию backend:
   ```
   cd путь\к\проекту\backend
   ```
3. Запустите скрипт run_server.bat:
   ```
   run_server.bat
   ```

### Linux/macOS
1. Откройте терминал
2. Перейдите в директорию backend:
   ```
   cd путь/к/проекту/backend
   ```
3. Убедитесь, что скрипт имеет права на выполнение:
   ```
   chmod +x run_server.sh
   ```
4. Запустите скрипт:
   ```
   ./run_server.sh
   ```

## Запуск без скриптов
Если по каким-то причинам скрипты не работают, вы можете запустить сервер вручную:

```
cd backend
python run.py
```

## Доступ к приложению
После запуска сервер будет доступен по адресу:
- http://localhost:5000/

## API Endpoints
- Проверка состояния: GET /api/health
- Загрузка документа: POST /api/document/upload
- Исправление документа: POST /api/document/correct
- Скачивание исправленного документа: GET /api/document/download-corrected

## Запуск тестов
- Модульные тесты: `run_unit_tests.bat` (Windows) или `run_unit_tests.sh` (Linux)
- Интеграционные тесты: `run_integration_tests.bat` (Windows) или `run_integration_tests.sh` (Linux)
- Все тесты: `run_all_tests.bat` (Windows) или `run_all_tests.sh` (Linux)
- Анализ покрытия кода: `run_coverage.bat` (Windows) или `run_coverage.sh` (Linux) 