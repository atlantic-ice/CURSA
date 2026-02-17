# 🎯 План доведения функционала до идеала

> **Миссия:** Превратить CURSA в эталонное приложение с безупречным UX, стабильностью и производительностью  
> **Дата начала:** 02.02.2026  
> **Принцип:** "Качество важнее количества фич"

---

## 📋 Текущее состояние (диагностика)

### ⚠️ Критические проблемы

1. **Технический долг**
   - ❌ DocumentCorrector: **3,076 строк** в одном файле (макс. рекомендуется 500)
   - ❌ NormControlChecker: **2,944 строки** в одном файле
   - ❌ Отсутствует модульная структура
   - ❌ Много дублирования кода

2. **Качество кода**
   - ❌ Отсутствуют type hints во многих местах
   - ❌ Нет docstrings для многих функций
   - ❌ Отсутствует линтинг (pylint, flake8)
   - ❌ Нет code formatters (black, isort)

3. **Тестирование**
   - ❌ Test coverage: ~50% (цель: 80%+)
   - ❌ Нет e2e тестов для критических флоу
   - ❌ Отсутствуют performance тесты
   - ❌ Нет фикстур для сложных случаев

4. **Производительность**
   - ❌ Обработка 50-стр документа: ~5 секунд (цель: <2 сек)
   - ❌ Нет профилирования узких мест
   - ❌ Отсутствует кэширование результатов
   - ❌ Неоптимальные запросы к БД

5. **UX/UI проблемы**
   - ❌ Нет прогресс-бара для длительных операций
   - ❌ Ошибки не всегда понятны пользователю
   - ❌ Отсутствует адаптивность на маленьких экранах
   - ❌ Нет dark mode

6. **Безопасность**
   - ❌ Нет JWT blacklist (токены после logout остаются валидными)
   - ❌ Отсутствует email verification
   - ❌ Нет 2FA
   - ❌ Слабая валидация input

---

## 🎯 Mission-Critical Tasks (Приоритет 0)

### Неделя 1 (03.02 - 09.02): Исправление критических багов

#### Backend

- [ ] **Рефакторинг DocumentCorrector** (P0)
  ```
  Разделить на модули:
  ├── correctors/
  │   ├── __init__.py
  │   ├── base.py (базовый класс)
  │   ├── style_corrector.py (шрифты, интервалы)
  │   ├── structure_corrector.py (заголовки, разделы)
  │   ├── content_corrector.py (таблицы, рисунки)
  │   └── formatting_corrector.py (поля, нумерация)
  └── document_corrector.py (координатор)
  ```
  **Цель:** Уменьшить до <500 строк на модуль
  **Estimate:** 3 дня
  
- [ ] **Рефакторинг NormControlChecker** (P0)
  ```
  Разделить на модули:
  ├── checkers/
  │   ├── __init__.py
  │   ├── base.py
  │   ├── font_checker.py (правила 2-3)
  │   ├── layout_checker.py (правила 4-12)
  │   ├── heading_checker.py (правила 13-16)
  │   ├── content_checker.py (правила 17-27)
  │   └── bibliography_checker.py (правила 29-30)
  └── norm_control_checker.py (координатор)
  ```
  **Estimate:** 3 дня

- [ ] **Исправить ошибки типов** (P0)
  - Добавить Optional[str] где нужно
  - Исправить аннотации в database.py
  - Пройти mypy без ошибок
  **Estimate:** 1 день

- [ ] **Настроить линтинги и форматтеры** (P0)
  ```bash
  pip install black isort pylint mypy
  
  pyproject.toml:
  [tool.black]
  line-length = 100
  target-version = ['py311']
  
  [tool.isort]
  profile = "black"
  
  [tool.pylint]
  max-line-length = 100
  ```
  **Estimate:** 1 день

#### Frontend

- [ ] **Исправить PropTypes warnings** (P0)
  - Добавить PropTypes для всех компонентов
  - Исправить missing key props в списках
  **Estimate:** 1 день

- [ ] **Улучшить error handling** (P0)
  - Централизованный error handler
  - Понятные сообщения пользователю
  - Toast notifications (react-hot-toast)
  **Estimate:** 2 дня

### Неделя 2 (10.02 - 16.02): Производительность

- [ ] **Профилирование DocumentCorrector** (P0)
  ```python
  import cProfile
  import pstats
  
  profiler = cProfile.Profile()
  profiler.enable()
  corrector.correct_document()
  profiler.disable()
  stats = pstats.Stats(profiler)
  stats.sort_stats('cumulative')
  stats.print_stats(20)
  ```
  **Цель:** Найти top-10 узких мест
  **Estimate:** 2 дня

- [ ] **Оптимизация обработки документов** (P0)
  - Кэширование стилей (LRU cache)
  - Ленивая загрузка больших документов
  - Batch-обработка параграфов
  **Цель:** Обработка 50 стр < 2 сек
  **Estimate:** 3 дня

- [ ] **Оптимизация SQL запросов** (P0)
  ```sql
  -- Добавить индексы
  CREATE INDEX idx_documents_user_id ON documents(user_id);
  CREATE INDEX idx_documents_status ON documents(status);
  CREATE INDEX idx_documents_created_at ON documents(created_at);
  
  -- Eager loading
  User.query.options(joinedload(User.subscriptions))
  ```
  **Estimate:** 1 день

- [ ] **Frontend оптимизация** (P0)
  - React.memo для тяжелых компонентов
  - Виртуализация больших списков (react-window)
  - Дебаунсинг поиска
  **Estimate:** 2 дня

---

## 🎨 UX Excellence (Приоритет 1)

### Неделя 3 (17.02 - 23.02): User Experience

- [ ] **Прогресс-индикаторы** (P1)
  - WebSocket real-time прогресс (уже есть ✅)
  - Детальные этапы обработки
  - Estimated time remaining
  **Estimate:** 2 дня

- [ ] **Улучшенные сообщения об ошибках** (P1)
  ```javascript
  // Вместо: "Error processing document"
  // Делаем: "Не удалось обработать документ: файл превышает максимальный размер (50 МБ)"
  
  const ERROR_MESSAGES = {
    FILE_TOO_LARGE: 'Файл превышает максимальный размер (50 МБ)',
    INVALID_FORMAT: 'Поддерживаются только файлы .docx',
    PROCESSING_FAILED: 'Ошибка обработки. Проверьте формат документа',
    NETWORK_ERROR: 'Проблемы с сетью. Проверьте соединение'
  }
  ```
  **Estimate:** 2 дня

- [ ] **Адаптивный дизайн** (P1)
  - Мобильная версия (Bootstrap Grid)
  - Breakpoints: xs, sm, md, lg, xl
  - Touch-friendly элементы (44x44 px минимум)
  **Estimate:** 3 дня

- [ ] **Keyboard shortcuts** (P1)
  ```javascript
  // Ctrl+U - Upload
  // Ctrl+D - Download Report
  // Ctrl+H - History
  // Esc - Close modal
  ```
  **Estimate:** 1 день

- [ ] **Онбординг туториал** (P1)
  - Shepherd.js интерактивный тур
  - First-time user flow
  - Tooltips для всех функций
  **Estimate:** 2 дня

### Неделя 4 (24.02 - 01.03): Визуальное совершенство

- [ ] **Dark Mode** (P1)
  ```css
  @media (prefers-color-scheme: dark) {
    --bg-primary: #1a1a1a;
    --text-primary: #e0e0e0;
    --accent: #4a9eff;
  }
  ```
  **Estimate:** 2 дня

- [ ] **Анимации и transitions** (P1)
  - Framer Motion (уже используется ✅)
  - Page transitions
  - Smooth scroll
  - Skeleton loaders
  **Estimate:** 2 дня

- [ ] **Accessibility (A11y)** (P1)
  - ARIA labels
  - Keyboard navigation
  - Screen reader support
  - Color contrast WCAG AA
  **Estimate:** 2 дня

- [ ] **Микроинтеракции** (P1)
  - Hover effects
  - Button ripple
  - Success animations
  - Error shake
  **Estimate:** 1 день

---

## 🧪 Качество и тестирование (Приоритет 1)

### Март 2026: Bulletproof Testing

- [ ] **Unit тесты (80% coverage)** (P1)
  ```python
  # Backend
  pytest tests/unit/services/test_document_corrector.py
  pytest tests/unit/services/test_norm_control_checker.py
  pytest tests/unit/models/test_user.py
  
  # Coverage report
  pytest --cov=app --cov-report=html --cov-report=term-missing
  ```
  **Цель:** 80%+ покрытие
  **Estimate:** 1 неделя

- [ ] **Integration тесты** (P1)
  ```python
  # API тесты
  def test_complete_document_flow():
      # 1. Upload
      response = client.post('/api/document/upload', files={'file': docx})
      assert response.status_code == 200
      
      # 2. Check
      doc_id = response.json['document_id']
      response = client.get(f'/api/document/{doc_id}/status')
      assert response.json['status'] == 'checked'
      
      # 3. Correct
      response = client.post(f'/api/document/{doc_id}/correct')
      assert response.status_code == 200
  ```
  **Estimate:** 3 дня

- [ ] **E2E тесты (Playwright)** (P1)
  - Upload → Check → Download flow
  - Profile selection flow
  - Error scenarios
  **Estimate:** 3 дня

- [ ] **Performance тесты** (P1)
  ```python
  import pytest
  import time
  
  @pytest.mark.parametrize("pages", [10, 50, 100])
  def test_document_processing_speed(pages):
      doc = generate_test_document(pages)
      start = time.time()
      corrector.correct_document(doc)
      duration = time.time() - start
      
      # Требования производительности
      assert duration < pages * 0.04  # <40ms на страницу
  ```
  **Estimate:** 2 дня

- [ ] **Load тесты (Locust)** (P1)
  ```python
  from locust import HttpUser, task
  
  class DocumentUser(HttpUser):
      @task
      def upload_document(self):
          with open('test.docx', 'rb') as f:
              self.client.post('/api/document/upload', files={'file': f})
  
  # Запуск: locust -f locustfile.py --users 100 --spawn-rate 10
  ```
  **Цель:** 1000 RPS без деградации
  **Estimate:** 2 дня

---

## 📦 Инфраструктура и DevOps (Приоритет 2)

### CI/CD Pipeline

- [ ] **GitHub Actions workflows** (P2)
  ```yaml
  name: CI/CD
  
  on: [push, pull_request]
  
  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - name: Run tests
          run: pytest --cov=app
        - name: Upload coverage
          uses: codecov/codecov-action@v3
    
    lint:
      runs-on: ubuntu-latest
      steps:
        - name: Black
          run: black --check .
        - name: Pylint
          run: pylint app/
        - name: MyPy
          run: mypy app/
    
    deploy:
      needs: [test, lint]
      if: github.ref == 'refs/heads/main'
      steps:
        - name: Deploy to production
          run: ./deploy.sh
  ```
  **Estimate:** 2 дня

- [ ] **Pre-commit hooks** (P2)
  ```yaml
  # .pre-commit-config.yaml
  repos:
    - repo: https://github.com/psf/black
      rev: 23.1.0
      hooks:
        - id: black
    
    - repo: https://github.com/pycqa/isort
      rev: 5.12.0
      hooks:
        - id: isort
    
    - repo: https://github.com/pycqa/flake8
      rev: 6.0.0
      hooks:
        - id: flake8
  ```
  **Estimate:** 1 день

- [ ] **Docker оптимизация** (P2)
  - Multi-stage builds
  - Layer caching
  - .dockerignore
  - Размер образа <500 MB
  **Estimate:** 1 день

---

## 📚 Документация (Приоритет 2)

- [ ] **API Documentation (OpenAPI 3.0)** (P2)
  - Актуализация Swagger схемы
  - Примеры запросов/ответов
  - Postman коллекция
  **Estimate:** 2 дня

- [ ] **User Guide** (P2)
  - Как загрузить документ
  - Как выбрать профиль
  - Как исправить ошибки
  - FAQ (20+ вопросов)
  **Estimate:** 3 дня

- [ ] **Developer Guide** (P2)
  - Архитектура проекта
  - Contribution guidelines
  - Code style guide
  - Как добавить новое правило
  **Estimate:** 2 дня

- [ ] **Docstrings и комментарии** (P2)
  - Google-style docstrings
  - Type hints везде
  - Inline comments для сложной логики
  **Estimate:** 3 дня

---

## 🔐 Безопасность (Приоритет 1)

- [ ] **JWT Blacklist (Redis)** (P1)
  ```python
  from flask_jwt_extended import jwt_required, get_jwt
  
  @bp.route('/logout', methods=['POST'])
  @jwt_required()
  def logout():
      jti = get_jwt()['jti']
      redis_client.setex(f"blacklist:{jti}", JWT_ACCESS_TOKEN_EXPIRES, "true")
      return jsonify({'message': 'Logged out'}), 200
  
  @jwt.token_in_blocklist_loader
  def check_if_token_revoked(jwt_header, jwt_payload):
      jti = jwt_payload['jti']
      return redis_client.exists(f"blacklist:{jti}")
  ```
  **Estimate:** 1 день

- [ ] **Email Verification** (P1)
  ```python
  from itsdangerous import URLSafeTimedSerializer
  
  def generate_verification_token(email):
      s = URLSafeTimedSerializer(app.config['SECRET_KEY'])
      return s.dumps(email, salt='email-verification')
  
  @bp.route('/verify-email/<token>')
  def verify_email(token):
      try:
          email = s.loads(token, salt='email-verification', max_age=86400)
          user = User.query.filter_by(email=email).first()
          user.is_email_verified = True
          db.session.commit()
      except SignatureExpired:
          return jsonify({'error': 'Token expired'}), 400
  ```
  **Estimate:** 2 дня

- [ ] **Password Strength Validation** (P1)
  ```python
  import re
  
  def validate_password(password):
      if len(password) < 8:
          return False, "Минимум 8 символов"
      if not re.search(r'[A-Z]', password):
          return False, "Нужна заглавная буква"
      if not re.search(r'[a-z]', password):
          return False, "Нужна строчная буква"
      if not re.search(r'[0-9]', password):
          return False, "Нужна цифра"
      return True, "OK"
  ```
  **Estimate:** 1 день

- [ ] **CSRF Protection** (P1)
  ```python
  from flask_wtf.csrf import CSRFProtect
  csrf = CSRFProtect(app)
  ```
  **Estimate:** 0.5 дня

- [ ] **SQL Injection Protection** (P1)
  - Использовать только SQLAlchemy ORM
  - Никаких raw SQL
  - Parameterized queries
  **Estimate:** 1 день (аудит)

---

## 🎯 Метрики успеха

### Технические метрики

| Метрика | Сейчас | Цель |
|---------|--------|------|
| **Test Coverage** | 50% | 80%+ |
| **Processing Speed (50 стр)** | ~5 сек | <2 сек |
| **Code Complexity (McCabe)** | 15+ | <10 |
| **Lines per Module** | 3000+ | <500 |
| **Pylint Score** | 7/10 | 9/10 |
| **Docker Image Size** | 1.2 GB | <500 MB |
| **Lighthouse Score** | 75 | 90+ |

### Пользовательские метрики

| Метрика | Цель |
|---------|------|
| **Time to First Check** | <5 сек |
| **Error Rate** | <1% |
| **User Satisfaction (NPS)** | >70 |
| **Mobile Usability** | 95/100 |
| **Accessibility Score** | AA (WCAG) |

---

## 📅 Timeline (Март 2026)

```
Неделя 1 (03-09.02) │ Рефакторинг DocumentCorrector/NormChecker
Неделя 2 (10-16.02) │ Производительность + SQL оптимизация
Неделя 3 (17-23.02) │ UX: прогресс, ошибки, адаптивность
Неделя 4 (24-01.03) │ Dark mode, анимации, a11y
─────────────────────┼──────────────────────────────────────────
Март (02-31.03)     │ Тестирование (unit, integration, e2e)
                    │ Безопасность (JWT blacklist, email verif)
                    │ Документация (API, User Guide, Dev Guide)
                    │ CI/CD Pipeline
─────────────────────┼──────────────────────────────────────────
Апрель 2026         │ Финальная полировка
                    │ Performance tuning
                    │ User testing & feedback
```

---

## 🚀 Quick Wins (можно сделать прямо сейчас)

### День 1 (сегодня)

1. ✅ Настроить Black + isort
   ```bash
   pip install black isort
   black .
   isort .
   ```

2. ✅ Добавить .editorconfig
   ```ini
   root = true
   
   [*]
   indent_style = space
   indent_size = 4
   charset = utf-8
   trim_trailing_whitespace = true
   insert_final_newline = true
   ```

3. ✅ Создать CONTRIBUTING.md
4. ✅ Добавить issue templates в .github/

### День 2 (завтра)

1. Начать рефакторинг DocumentCorrector
2. Настроить pytest с coverage
3. Исправить type hints ошибки

---

## 🎓 Обучение команды

- [ ] Code review checklist
- [ ] Testing best practices
- [ ] Performance optimization guide
- [ ] Security guidelines

---

**Принцип работы:** Один модуль/фича за раз → довести до совершенства → двигаться дальше

**Девиз:** "Make it work, make it right, make it fast" - Kent Beck

**Обновлено:** 02.02.2026  
**Версия:** 1.0
