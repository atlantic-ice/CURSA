# Project Improvements

> 📌 **Примечание:** Этот файл содержит краткосрочные задачи.  
> Для стратегического планирования см. [DEVELOPMENT_ROADMAP.md](DEVELOPMENT_ROADMAP.md)

## ✅ Выполненные задачи

- [x] **Cleanup**: Delete unused `backend/app/services/format_checker.py`
- [x] **Monitoring**: Prometheus + Grafana (v1.3.0)
- [x] **Background Tasks**: Celery + Redis (v1.3.0)
- [x] **E2E Testing**: Playwright (v1.2.0)
- [x] **WebSocket**: Real-time прогресс (v1.2.0)
- [x] **PWA**: Service Worker, offline (v1.2.0)
- [x] **Performance**: Lazy loading, LRU cache (v1.1.0)

## 🔄 В работе (Q1 2026)

### Критический приоритет

- [ ] **Database Migration** (v1.4.0)
  - [ ] PostgreSQL setup
  - [ ] Schema design (users, documents, subscriptions)
  - [ ] Migration scripts
  - **Срок:** 2 недели

- [ ] **Authentication System** (v1.4.0)
  - [ ] JWT + Refresh Tokens
  - [ ] OAuth2 (Google, GitHub, Яндекс ID)
  - [ ] Email verification
  - **Срок:** 2 недели

### Высокий приоритет

- [ ] **Payment Integration** (v1.5.0)
  - [ ] Stripe API
  - [ ] Yookassa API
  - [ ] Webhook handlers
  - **Срок:** 2 недели

- [ ] **User Dashboard** (v1.5.0)
  - [ ] History page
  - [ ] Statistics (Recharts)
  - [ ] Subscription management
  - **Срок:** 2 недели

### Средний приоритет

- [ ] **Feature**: Implement `_check_bibliography_references` in `norm_control_checker.py` (Rule ID 30)
  - [ ] Parse bibliography section
  - [ ] Validate ГОСТ 7.0.100-2018
  - [ ] Check citation consistency
  - **Срок:** 2 недели (v2.1.0)

- [ ] **Refactoring**: Split `DocumentCorrector` into smaller modules
  - [ ] `StyleCorrector` (шрифты, интервалы)
  - [ ] `StructureCorrector` (заголовки, списки)
  - [ ] `ContentCorrector` (таблицы, рисунки)
  - **Причина:** 1000+ строк в одном файле
  - **Срок:** 1 неделя

### Низкий приоритет

- [ ] **Testing**: Add unit tests for all services
  - [ ] NormControlChecker (80% coverage)
  - [ ] DocumentCorrector (80% coverage)
  - [ ] XMLDocumentEditor (70% coverage)
  - **Цель:** Общее покрытие 80%
  - **Срок:** Постоянная задача (+5% каждый спринт)

- [ ] **Documentation**: Update API documentation
  - [ ] OpenAPI 3.0 spec
  - [ ] Postman collection
  - [ ] SDK examples (Python, JS)
  - **Срок:** Q1 2026

## 📋 Backlog (Q2-Q4 2026)

### Q2 2026
- [ ] Kubernetes migration
- [ ] Мультиязычность (i18n)
- [ ] CDN integration
- [ ] TypeScript migration (frontend)

### Q3 2026
- [ ] Admin panel
- [ ] AI Assistant (GPT-4o)
- [ ] Plagiarism check
- [ ] Batch processing (100+ files)

### Q4 2026
- [ ] Moodle/Canvas plugins
- [ ] MS Word Add-in
- [ ] Profile Marketplace
- [ ] Mobile app (React Native)

## 🔗 Связанные документы

- [DEVELOPMENT_ROADMAP.md](DEVELOPMENT_ROADMAP.md) - Полный стратегический план
- [ROADMAP_BRIEF.md](ROADMAP_BRIEF.md) - Краткий обзор
- [COMMERCIALIZATION_PLAN.md](COMMERCIALIZATION_PLAN.md) - План коммерциализации
- [CHANGELOG.md](CHANGELOG.md) - История изменений
