---
inclusion: auto
name: development-workflow
description: Development workflow with Kiro. Use when setting up development process, onboarding, or discussing how to work with the project.
---

# Workflow разработки с Kiro

> Этот файл описывает как работать с проектом используя Kiro AI

## 🎯 Философия

1. **Spec-Driven Development** - большие фичи начинаются со спецификации
2. **Property-Based Testing** - формальная корректность через свойства
3. **Живая документация** - спецификации остаются как документация
4. **Итеративный процесс** - requirements → design → tasks → implementation

## 📊 Типы задач

### 🔴 Маленькие баги (< 30 мин)

**Когда:** Опечатки, мелкие UI фиксы, простые рефакторинги

**Процесс:**
1. Анализ проблемы (думай широко!)
2. Исправление (точно и полно)
3. Проверка пользователем
4. Коммит только после подтверждения

**Документация:** НЕ нужна

---

### 🟡 Средние задачи (30 мин - 2 часа)

**Когда:** Добавление полей, простые CRUD операции, мелкие улучшения

**Процесс:**
1. Обсудить подход с пользователем
2. Реализовать
3. Проверить
4. Обновить `.kiro/steering/product.md` если нужно

**Документация:** Опционально (можно создать упрощённую spec с requirements + tasks)

---

### 🟢 Большие фичи (> 2 часа)

**Когда:** Новые модули, сложная бизнес-логика, интеграции

**Процесс:**

#### Шаг 1: Создание спецификации

```bash
.kiro/specs/feature-name/
├── requirements.md  # Требования (EARS format)
├── design.md        # Дизайн + correctness properties
└── tasks.md         # План реализации
```

**1.1 Requirements (Требования)**
- Используй EARS паттерны: `WHEN ... THE System SHALL ...`
- Пиши на русском (гибрид: EARS keywords + русский текст)
- Каждое требование = User Story + Acceptance Criteria
- Определи Glossary (термины проекта)

**1.2 Design (Дизайн)**
- Архитектура и компоненты
- Модели данных
- **Correctness Properties** (свойства корректности)
  - Каждое свойство начинается с "*Для любых*..."
  - Ссылается на requirements
  - Будет использоваться для property-based testing
- Error Handling
- Testing Strategy

**1.3 Tasks (Задачи)**
- Разбить design на конкретные задачи
- Каждая задача ссылается на requirements
- Отметить опциональные задачи `*` (например, тесты)
- Чекбоксы для отслеживания прогресса

#### Шаг 2: Реализация

1. Открыть `tasks.md`
2. Выполнять задачи по порядку
3. Отмечать выполненные `[x]`
4. Property-based тесты писать по ходу (минимум 100 итераций)
5. Каждый тест ссылается на свойство из design.md

#### Шаг 3: Завершение

1. Все задачи выполнены ✓
2. Все тесты проходят
3. Обновить `.kiro/steering/product.md` (текущее состояние)
4. Spec остаётся как живая документация

**Документация:** ОБЯЗАТЕЛЬНА (полная spec)

---

## 🔄 Workflow схема

```
┌─────────────────────────────────────────────────────────────┐
│                    Новая задача                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
              ┌──────────────┐
              │ Оценка       │
              │ сложности    │
              └──────┬───────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
   ┌────────┐  ┌─────────┐  ┌──────────┐
   │ < 30м  │  │ 30м-2ч  │  │  > 2ч    │
   │ Баг    │  │ Средняя │  │ Большая  │
   └───┬────┘  └────┬────┘  └────┬─────┘
       │            │             │
       ▼            ▼             ▼
   Исправить   Обсудить    Создать spec
       │        подход          │
       │            │            ▼
       │            │       requirements.md
       │            │            │
       │            │            ▼
       │            │        design.md
       │            │            │
       │            │            ▼
       │            │        tasks.md
       │            │            │
       │            ▼            ▼
       │       Реализовать  Реализовать
       │            │        по tasks.md
       │            │            │
       └────────────┴────────────┘
                    │
                    ▼
              ┌──────────┐
              │ Проверка │
              └────┬─────┘
                   │
                   ▼
              ┌──────────┐
              │ Коммит   │
              └────┬─────┘
                   │
                   ▼
         Обновить документацию
         (product.md)
```

## 📝 Коммиты

Формат и процесс коммитов: см. `#commit-checklist`

## 🧪 Тестирование

### Перед деплоем (ОБЯЗАТЕЛЬНО)

**Backend:**
```bash
cd backend
go build -o /dev/null ./cmd/server  # Сначала build
go test ./... -v                     # Потом все тесты
```

**Frontend:**
```bash
cd frontend
yarn type-check                      # TypeScript проверка
yarn lint                            # ESLint (включая архитектурные правила)
yarn test --run                      # Все тесты
```

### Архитектурные тесты

Проверяют соблюдение критичных инвариантов (см. `#architecture-invariants`):

**Backend:**
```bash
cd backend && go test ./internal/lib/interceptors/... -run "Test.*" -v
```

**Frontend:**
```bash
cd frontend && yarn test --run src/shared/lib/architecture.test.ts
```

**Что проверяется:**
- Single Retry Layer (нет retry в backend)
- No Goroutines in Timeout Interceptor
- Handler Context Compliance (withTimeout)
- No Context Background in Handlers
- Fixed Interceptor Order
- Bounded Resources (maps с лимитами)
- Graceful Shutdown Order
- Retry-CircuitBreaker Order

### Unit тесты

**Когда писать:**
- Для всех новых функций
- Для важных edge cases
- Для багфиксов (regression tests)

**Где:**
- Frontend: `*.test.ts` рядом с файлом
- Backend: `*_test.go` рядом с файлом

### Property-Based тесты

**Когда писать:**
- Для всех correctness properties из design.md
- Минимум 100 итераций на тест
- Каждый тест ссылается на property

**Библиотеки:**
- Frontend: `fast-check`
- Backend: `gopter`

**Формат комментария:**
```typescript
// Feature: feature-name, Property 3: Name Field Validation
// Validates: Requirements 2.1, 2.2, 2.3, 6.3
```

## 📚 Документация

### Что обновлять

**После каждой большой фичи:**
- ✅ `.kiro/steering/product.md` - текущее состояние
- ✅ Spec остаётся в `.kiro/specs/feature-name/` как документация

**После средних задач:**
- ✅ `.kiro/steering/product.md` - если изменилась архитектура

**После маленьких багов:**
- ❌ Ничего не обновлять

## 🎯 Best Practices

### Общие принципы

1. **Обнови → Удали** (не наоборот)
2. **Думай широко** - не ограничивайся описанной проблемой
3. **Комплексное решение** - анализируй связанные компоненты
4. **Один источник истины** - не дублируй информацию
5. **Алгоритм принятия решений** - используй `decision-making.md` для каждого изменения

### Валидация

- ✅ Валидация на всех уровнях (frontend → backend → database)
- ✅ Nil checks везде
- ✅ Try-catch для внешних API
- ✅ Context timeouts (5-10s)

### Безопасность

- ✅ XSS protection во всех текстовых полях
- ✅ Generic error messages (не раскрывать детали)
- ✅ Логирование с контекстом

### Код

- ✅ Clean Architecture (backend)
- ✅ Feature-Sliced Design (frontend)
- ✅ Используй алиасы для импортов (НЕ `@/`)
- ✅ Следуй naming conventions
