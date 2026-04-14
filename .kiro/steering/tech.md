---
inclusion: always
---

# Tech Stack - [PROJECT_NAME]

## Stack

**Backend:** Go + gRPC + GORM + PostgreSQL
**Frontend:** React 19 + RTK Query + MUI + Vite
**Protocol:** gRPC-Web (proto → TypeScript/Go)
**Infrastructure:** YC Serverless Containers + S3 + Managed PostgreSQL (облако) ИЛИ Docker Compose + локальный PostgreSQL (локалка)

## Архитектура окружений

| Окружение | Backend | Frontend | База данных |
|-----------|---------|----------|-------------|
| **local** | localhost:44044 | localhost:3000 → localhost:44044 | localhost:5432 (docker-compose) |
| **stage** | YC Container | S3 bucket | *_stage (Managed PostgreSQL) |
| **prod** | YC Container | S3 bucket | *_prod (Managed PostgreSQL) |

> Режим выбирается при настройке: спека 3.1 (yc-setup) или 3.2 (local-development-support)

## Commands

```bash
# Установка инструментов (первый запуск)
bash scripts/install-tools.sh        # macOS/Linux
# powershell scripts/install-tools.ps1  # Windows

# Frontend (локально)
cd frontend && task dev    # :3000

# Backend (локально, если local-development-support)
cd backend && task dev     # :44044

# Proto
cd contract && task generate

# Локальная БД (если local-development-support)
task local:up              # запуск PostgreSQL
task local:down            # остановка
task local:reset           # пересоздание с нуля

# Миграции
cd backend && task migrate:local   # локальная БД (из .env)
cd backend && task migrate:stage   # stage через Lockbox
cd backend && task migrate:prod    # production (ОСТОРОЖНО!)

# Деплой backend (YC)
cd backend && task deploy  # stage или production

# Seed
cd backend && task seed         # локальная БД
cd backend && task seed:stage   # stage через Lockbox
cd backend && task seed:prod    # production (ОСТОРОЖНО!)
```

> Для Windows: .sh скрипты имеют .ps1 аналоги рядом

## Critical Rules

**ПЕРЕД НАЧАЛОМ РАБОТЫ:**
- **Уточняющие вопросы** — критически перепроверяй запросы заказчика, задавай вопросы если что-то неясно или может быть упущено. Не начинай реализацию пока не убедишься что понял задачу полностью.

**ВСЕГДА:**
- `git add -A` (не добавляй файлы по отдельности)
- Context timeout (5-10s) для всех операций
- Валидация на всех уровнях (frontend → backend → DB)
- Generic error messages клиенту
- **Верификация задач:** перед подтверждением выполнения — grep по ключевым словам в коде, не доверяй чекбоксам в tasks.md

**НИКОГДА:**
- Не коммить без подтверждения пользователя
- Не раскрывать внутренние детали в ошибках
- **Не помечать задачу выполненной** без проверки реального кода

## Decision Algorithm (сжато)

1. Придумай 2-3 варианта
2. Тройная проверка каждого (хорошо? оптимально? элегантно?)
3. Проверь по steering файлам
4. Самопроверка (5 вопросов)
5. Все "да"? → реализуй

Подробнее: `#decision-making`

## Task Completion Verification

**Перед установкой чекбокса [x] ОБЯЗАТЕЛЬНО:**

1. **Сформулировать grep-тест** — конкретный поиск, доказывающий реализацию
   - Пример: задача "добавить field в модель" → `grep "field" model.go`
   
2. **Выполнить grep-тест** — убедиться что код реально существует

3. **Проверить полноту** — не только наличие кода, но и его использование
   - Добавлено в proto? ✓
   - Добавлено в backend storage? ✓
   - Добавлено в gRPC handler? ✓
   - Добавлено в frontend types? ✓
   - Используется в UI? ✓

**НЕ ставить чекбокс если:**
- Код "похож" на решение, но не проверен
- Сделана только часть (proto есть, но UI не использует)
- Нет времени на проверку — лучше оставить [ ]

## Architecture

**Backend:** Clean Architecture
```
cmd → grpc → services → storage → domain
```

**Frontend:** Feature-Sliced Design
```
app → pages → widgets → features → entities → shared
```

## Imports

**Frontend:** Используй алиасы (`shared/`, `entities/`), НЕ `@/` или `../../../`

## Testing

```bash
# Backend: сначала build, потом test
go build -o /dev/null ./cmd/server
go test -v ./...

# Frontend
yarn type-check
yarn test
```

## Code Research Before Writing

**ОБЯЗАТЕЛЬНО перед написанием нового кода:**

1. **Модели данных** — изучить определения моделей и их связи
   - НЕ предполагать по названию поля
   - Проверить как связь используется в существующих запросах

2. **Паттерны проекта** — смотреть как аналогичный код написан в других местах
   - Обработка ошибок RTK Query: `handleGrpcError` возвращает `{ error: { status, error, requestId } }`
   - НЕ писать по памяти/шаблону — проверять реальный формат

3. **Связи между сущностями** — понимать модель данных

**Типичные ошибки:**
- Предположения вместо проверки
- Использование "похожего" поля без понимания его назначения
- Копирование паттерна без проверки его применимости
- **Частичное исправление** — при нахождении бага проверять ВСЮ функцию/файл на аналогичные проблемы
- **Большие файлы (1000+ строк)** — читать ПОЛНУЮ функцию целиком, не только место с ошибкой

## Bug Hunt Protocol

**При запросе "проверь, нет ли ещё такой проблемы":**

1. **Сформулировать grep-паттерн** для поиска аналогичных ошибок

2. **Прочитать ВСЕ функции в файле** где найдена ошибка
   - Не только место с багом, а весь файл
   - Аналогичные функции часто содержат аналогичные ошибки

3. **Проверить связанные файлы**
   - Если баг в storage, проверить service и handler

4. **НЕ делать предположений** — только проверка кода

## File Size Limits

**Максимальный размер файла: 500 строк**

| Порог | Действие |
|-------|----------|
| < 300 строк | ✅ Норма |
| 300-500 строк | ⚠️ Следить, планировать разбиение |
| > 500 строк | 🔴 ОБЯЗАТЕЛЬНО разбить на подфайлы |

**При приближении к лимиту:**
1. Выделить логически связанные функции в отдельный файл
2. Именовать по функционалу: `stats.go`, `verification.go`, `participants.go`
3. Сохранять семантическую связность — один файл = одна ответственность

## Proto Wrapper (Frontend)

**Зачем:** protobuf-js генерирует классы в `globalThis.proto`, что ломает tree-shaking и создаёт проблемы с типами.

**Решение:** Wrapper файлы в `shared/api/generated/{service}/{service}_pb_wrapper.ts`

```typescript
// {service}_pb_wrapper.ts
import './{service}_pb.js';

const proto = (globalThis as any).proto?.{service};

if (!proto) {
  throw new Error('Proto {service} not loaded');
}

// Проверка каждого класса
if (!proto.GetProfileRequest) {
  throw new Error('Proto class GetProfileRequest not found');
}

// Экспорт
export const GetProfileRequest = proto.GetProfileRequest;
export const GetProfileResponse = proto.GetProfileResponse;
```

**Правила:**
- Импортировать ТОЛЬКО из wrapper, НЕ из `*_pb.js` напрямую
- При добавлении proto message — добавить проверку и экспорт в wrapper
- Wrapper создаётся вручную после `task generate`

## Seed (Database Seeding)

**Команда:**
```bash
cd backend && task seed
```

**Принципы:**
1. **Идемпотентность** — повторный запуск не создаёт дубликаты
2. **Изоляция** — seed только для dev/test, НИКОГДА для production
3. **Детерминированность** — одинаковые данные при каждом запуске

## Logging

### Backend (Go + slog)

**Что логировать:**
```go
// 1. Старт сервера
log.Info("server starting", slog.String("env", cfg.Env))

// 2. Каждый gRPC запрос (в interceptor)
log.Info("request", slog.String("method", info.FullMethod), slog.Duration("duration", time.Since(start)))

// 3. Ошибки с контекстом
log.Error("failed to create user", slog.String("error", err.Error()))
```

**НЕ логировать:** Пароли, токены, секреты, персональные данные

### Frontend (TypeScript)

**Что логировать:**
```typescript
// gRPC вызовы
logger.debug('🔌 gRPC call:', { method });
logger.debug('📦 Response size:', { bytes: data.byteLength, status });
logger.error('gRPC error', error, { method });
```
