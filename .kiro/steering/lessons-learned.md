---
inclusion: auto
name: lessons-learned
description: Technical details and lessons learned from the project. Use when encountering known issues, reviewing past decisions, or understanding project-specific quirks.
---

# Lessons Learned - Технические детали проекта

> Этот файл содержит ТЕХНИЧЕСКИЕ ОСОБЕННОСТИ проекта, которые нужно знать.
> Методы работы см. в `investigation-methods.md` и `decision-making.md`.

<!-- 
TODO: Заполнять по мере развития проекта.
Этот файл - живой документ, который накапливает знания о проекте.
-->

---

## 🗃️ Фильтрация данных

<!-- TODO: Добавить специфичные для проекта правила фильтрации -->

### Scopes (переиспользуемые фильтры)

<!-- TODO: Создать internal/storage/postgres/scopes.go при добавлении фильтрации -->

```go
// Пример: Активные пользователи (internal/storage/postgres/scopes.go)
func ActiveUsersScope(db *gorm.DB) *gorm.DB {
    return db.Where("status = ?", "active")
}
```

### Типичные ошибки

```go
// ❌ НЕПРАВИЛЬНО — забыли фильтрацию
Where("role = 'user'")

// ✅ ПРАВИЛЬНО — с scope
Scopes(ActiveUsersScope).Where("role = 'user'")
```

---

## 🔗 Связи между сущностями

<!-- TODO: Документировать связи по мере добавления моделей -->

### Пример связи
```
User ──── user_profiles.user_id ────> UserProfile
```

### Типичная ошибка
```go
// ❌ НЕПРАВИЛЬНО — неправильное поле связи
Where("users.profile_id = ?", profileID)

// ✅ ПРАВИЛЬНО — через правильную связь
Joins("JOIN user_profiles ON user_profiles.user_id = users.id").
Where("user_profiles.id = ?", profileID)
```


---

## ⚡ Serverless Оптимизации

### Go 1.22 — СТРОГО!

**YC Serverless Containers поддерживает только Go 1.22.** Не обновлять `go.mod` выше `go 1.22.x`.

**Проблема:** `go mod tidy` и `go get` автоматически перезаписывают директиву `go` в `go.mod` на версию локального тулчейна (например 1.25). Это ломает сборку Docker образа в YC.

**Решение:** После любого `go get` или `go mod tidy` — проверить `head -5 backend/go.mod` и откатить версию если нужно:
```bash
# Проверить
head -5 backend/go.mod
# Должно быть: go 1.22.7

# Если перезаписало — вручную исправить в go.mod
```

**Dockerfile:** `FROM golang:1.22-alpine` — должен совпадать с `go.mod`.

### Проблема Cold Start
Serverless контейнеры (YC Serverless Containers) имеют cold start — первый запрос после простоя медленный.

**Причины медленного cold start:**
1. AutoMigrate при каждом запуске (GORM проверяет схему БД)
2. Большой initial bundle на frontend
3. Неоптимальные настройки connection pool

### Решения

#### Backend: Отдельная команда миграций
```bash
# Миграции запускаются ОТДЕЛЬНО, не при каждом cold start
task migrate              # stage (по умолчанию)
ENVIRONMENT=production task migrate  # production
```

**ВАЖНО:** Запускай миграции ПЕРЕД деплоем, не во время runtime!

#### Backend: GORM оптимизации
```go
db, err := gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{
    PrepareStmt:            true,  // Кешируем prepared statements
    SkipDefaultTransaction: true,  // Не создаём транзакцию для каждого запроса
})

// Connection Pool для Serverless
sqlDB.SetMaxOpenConns(25)                  // Serverless-optimized
sqlDB.SetMaxIdleConns(10)                  // Держим несколько готовых
sqlDB.SetConnMaxLifetime(5 * time.Minute)  // Короткий lifetime
sqlDB.SetConnMaxIdleTime(10 * time.Minute) // Быстро закрываем idle
```

#### Frontend: Lazy Loading + Code Splitting
```typescript
// router.tsx — lazy loading страниц
const LoginPage = lazy(() => import('../pages/auth/login').then(m => ({ default: m.LoginPage })));

// vite.config.ts — code splitting
output: {
  manualChunks: {
    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
    'vendor-mui': ['@mui/material', '@mui/icons-material'],
    'vendor-redux': ['@reduxjs/toolkit', 'react-redux'],
    'vendor-grpc': ['google-protobuf', 'grpc-web'],
  },
}
```

---

## 🔐 Аутентификация

### Хеширование
- **Пароли:** Bcrypt (cost 12)
- **Refresh tokens:** SHA256 (bcrypt ограничен 72 байтами, JWT длиннее)
- **Библиотека:** `internal/lib/auth`

### JWT
- **Access token:** 15 минут
- **Refresh token:** 7 дней
- **Хранение:** Cookies (Secure + SameSite=Strict)

### Account Lockout
- **Попытки:** 5
- **Блокировка:** 30 минут (аккаунт целиком, не только логин)

---

## 🌐 gRPC-Web

### Proto генерация: два плагина

Для генерации TypeScript кода используются два разных плагина:
- `ts-protoc-gen` (npm, `contract/node_modules/.bin/protoc-gen-ts`) — генерирует TypeScript типы (`*_pb.d.ts`) и JS код (`*_pb.js`)
- `protoc-gen-grpc-web` (глобальный, устанавливается через brew/curl) — генерирует gRPC-Web клиент (`*ServiceClientPb.ts`)

Оба нужны: первый для типов и сериализации, второй для клиентского кода. `ts-protoc-gen` устанавливается через `cd contract && yarn install`, `protoc-gen-grpc-web` — через `install-tools.sh`.

### Proto wrapper pattern
```typescript
// user_pb_wrapper.ts
import './user_pb.js';
export const LoginRequest = (globalThis as any).proto.user.LoginRequest;
```
**Причина:** CommonJS vs ES modules конфликт в Vite.

**Структура proto файлов (4 файла на сервис):**
1. `*ServiceClientPb.ts` — сгенерированный клиент (не используем напрямую)
2. `*_pb.d.ts` — TypeScript типы
3. `*_pb.js` — сгенерированный JS (CommonJS)
4. `*_pb_wrapper.ts` — ES module wrapper (ИСПОЛЬЗУЕМ ЭТО!)

**⚠️ КРИТИЧНО:** Импортировать ТОЛЬКО из `*_pb_wrapper.ts`:
```typescript
// ✅ Правильно
import { LoginRequest } from 'shared/api/generated/auth/auth_pb_wrapper';

// ❌ Неправильно — нет такого файла!
import { LoginRequest } from 'shared/api/generated/auth/auth_pb';
```

**⚠️ КРИТИЧНО:** Это касается и ДИНАМИЧЕСКИХ импортов:
```typescript
// ✅ Правильно — динамический импорт из wrapper
const { RefreshTokenRequest } = await import('shared/api/generated/auth/auth_pb_wrapper');

// ❌ Неправильно — "RefreshTokenRequest is not a constructor"
const { RefreshTokenRequest } = await import('shared/api/generated/auth/auth_pb');
```
**Причина:** protobuf-js регистрирует классы в `globalThis.proto`, прямой импорт из `*_pb.js` не работает.

**⚠️ КРИТИЧНО:** При добавлении новых gRPC методов ОБЯЗАТЕЛЬНО обновить wrapper:
1. Добавить проверку класса (`if (!proto.NewMethodRequest)`)
2. Добавить экспорт (`export const NewMethodRequest = proto.NewMethodRequest`)
3. То же для Response класса

Без этого метод молча не работает (Response класс не загружается).

### Public methods
```go
// internal/lib/interceptors/auth.go
var publicMethods = map[string]bool{
    "/auth.AuthService/Login": true,
    "/auth.AuthService/Register": true,
    "/auth.AuthService/RefreshToken": true,
    "/auth.AuthService/SaveRegistrationProgress": true,  // Multi-step регистрация
    "/auth.AuthService/GetRegistrationProgress": true,   // Multi-step регистрация
    // GetProfile НЕТ - требует токен!
}
```

### Proto namespace в vite.config.ts (КРИТИЧНО!)

**Проблема:** `Cannot set properties of undefined (setting 'Project')` при загрузке proto.

**Причина 1:** В `protobufPlugin` polyfill жёстко заданы namespaces:
```javascript
const protoNamespace = { auth: {}, user: {}, admin: {} };
```

При добавлении нового proto сервиса — его namespace отсутствует.

**Решение 1:** При добавлении нового proto сервиса ОБЯЗАТЕЛЬНО добавить его в `vite.config.ts`:
```javascript
const protoNamespace = { auth: {}, user: {}, admin: {}, newservice: {} };
```

**Причина 2:** `goog.exportSymbol` был пустой функцией и не создавал nested namespaces.

**Решение 2:** `goog.exportSymbol` должен создавать путь namespace:
```javascript
exportSymbol: function(name, value, scope) {
  // Create nested namespace path (e.g., 'proto.project.Project')
  const parts = name.split('.');
  let current = scope || globalThis;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) {
      current[parts[i]] = {};
    }
    current = current[parts[i]];
  }
},
```

**Файл:** `frontend/vite.config.ts` → `protobufPlugin()`

---

## ☁️ Yandex Cloud

### Архитектура окружений

| Окружение | Backend | Frontend | База данных |
|-----------|---------|----------|-------------|
| **local** | localhost:44044 | localhost:3000 → localhost:44044 | localhost:5432 (docker-compose) |
| **stage** | YC Container | S3 bucket | *_stage (Managed PostgreSQL) |
| **prod** | YC Container | S3 bucket | *_prod (Managed PostgreSQL) |

> Режим выбирается при настройке: спека 3.1 (yc-setup) или 3.2 (local-development-support)

### Деплой контейнера
```bash
# 1. Обновить контейнер
cd backend && task deploy
# Выбрать "нет" для stage, "да" для production

# 2. ОБЯЗАТЕЛЬНО обновить API Gateway (делается автоматически в скрипте)
```

### Секреты (Lockbox)
<!-- TODO: Добавить ID секрета после создания -->
- `DATABASE_URL` → production БД (sslmode=require)
- `DATABASE_URL_LOCAL` → stage БД (sslmode=require)
- `JWT_SECRET` — минимум 32 символа (рекомендуется `openssl rand -base64 32`)
- `ENCRYPTION_KEY` — 32 байта (AES-256, `openssl rand -base64 32`). **Примечание:** в текущей версии шаблона `ENCRYPTION_KEY` не используется в `config.go` — это заготовка для будущего шифрования данных (например, PII). Ключ хранится в Lockbox для готовности к использованию.

### PostgreSQL пароли в YC (ВАЖНО!)
При создании пользователя через `yc managed-postgresql user create`:
- Пароль **автоматически** сохраняется в Lockbox
- Secret name: `connection-{connection_id}`
- Ключ: `postgresql_password`
- Получить: `yc lockbox payload get --id <SECRET_ID> --key postgresql_password`

### Shared PostgreSQL кластер
Один Managed PostgreSQL для нескольких проектов:
- Создать отдельного пользователя для каждого проекта
- Создать отдельные базы (stage + prod) для каждого проекта
- Подключение по hostname доступно из любого folder в том же cloud

### Seed на удалённой БД
```bash
# Stage (через Lockbox)
cd backend && task seed:stage

# Production (ОСТОРОЖНО!)
cd backend && task seed:prod
```

**Как это работает:**
1. Скрипт получает DATABASE_URL из Lockbox
2. Запускает seed с этим URL
3. Не требует локального сервера!

---

## 📁 Особенности проекта

### Импорты (Frontend)
```typescript
// ✅ Алиасы из vite.config.ts
import { api } from 'shared/api/base-api';
import { useLoginMutation } from 'entities/user';

// ❌ Относительные пути
import { api } from '../../../shared/api/base-api';
```

---

## 🔒 Security

### Headers
- CSP, X-Frame-Options, Permissions-Policy
- CORS whitelist (только production домены)
- Rate limiting: см. `#architecture-invariants`

### Валидация
- Frontend: yup schemas
- Backend: `internal/lib/validate`
- SQL injection: GORM prepared statements

---

## 🐛 Известные особенности

### Proto stub файлы vs сгенерированные файлы (КРИТИЧНО!)

**Правило:** Импорты ВСЕГДА из `internal/grpc/gen/`:
```go
pb "template/internal/grpc/gen/auth"  // ✅ Правильно (после переименования — ваш модуль вместо template)
```

**Если proto не работают — перегенерировать:**
```bash
cd contract && task generate
```

**Признаки проблемы:**
- Логин/регистрация возвращают 0 bytes
- gRPC запросы приходят, но данные не парсятся (email/password пустые)
- Нет `protoimpl.MessageState` в структурах proto файлов

### gRPC пустой ответ (0 bytes)
**Причины:**
1. Метод в publicMethods, но требует auth
2. Ошибка в service не залогирована
3. Timeout без обработки
4. **Бизнес-ошибка не замаплена в gRPC статус** (см. ниже)

**Диагностика:** Network tab → grpc-status, grpc-message headers

### Error Handling: Маппинг бизнес-ошибок в gRPC (КРИТИЧНО!)

**Проблема:** Service возвращает `errors.New("invalid credentials")`, но клиент получает 0 bytes.

**Причина:** Ошибка не преобразована в gRPC status.

**Решение:** `errutil.HandleError` должен маппить бизнес-ошибки:

```go
// internal/lib/errutil/errutil.go
func HandleError(ctx context.Context, log *slog.Logger, err error) error {
    // Маппинг бизнес-ошибок
    errMsg := err.Error()
    switch errMsg {
    case "invalid credentials":
        return status.Error(codes.Unauthenticated, "Неверный логин или пароль")
    case "account locked":
        return status.Error(codes.PermissionDenied, "Аккаунт заблокирован")
    case "user already exists":
        return status.Error(codes.AlreadyExists, "Пользователь уже существует")
    case "user not found":
        return status.Error(codes.NotFound, "Пользователь не найден")
    }
    // ... остальная логика
}
```

**Правило:** Каждая бизнес-ошибка из service должна быть замаплена в gRPC status!

### API Gateway кеширование
После деплоя контейнера ОБЯЗАТЕЛЬНО обновить API Gateway spec.

### USE_LOCAL_DB для stage (КРИТИЧНО!)

**Проблема:** Stage контейнер использовал production БД вместо stage.

**Причина:** Конфиг всегда брал `DATABASE_URL`, игнорируя `DATABASE_URL_LOCAL`.

**Решение:** В `config.go` добавлена логика:
```go
// Если USE_LOCAL_DB=true, используем DATABASE_URL_LOCAL (для stage)
if getEnv("USE_LOCAL_DB", "false") == "true" {
    if localURL := os.Getenv("DATABASE_URL_LOCAL"); localURL != "" {
        databaseURL = localURL
    }
}
```

**Как работает:**
- `USE_LOCAL_DB=true` (stage) → использует `DATABASE_URL_LOCAL`
- `USE_LOCAL_DB=false` (production) → использует `DATABASE_URL`
- `USE_LOCAL_DB` передаётся как env variable при деплое (см. `update-container.sh`)

### Переключение порта для YC (HTTP_PORT)

**Механизм:** Локально сервер слушает порт 44044 (SERVER_PORT), в YC — 8080 (HTTP_PORT).

**Как работает в `config.go`:**
```go
// HTTP_PORT (формат ":8080") имеет приоритет над SERVER_PORT
serverPort := getEnv("SERVER_PORT", "44044")
if httpPort := os.Getenv("HTTP_PORT"); httpPort != "" {
    serverPort = strings.TrimPrefix(httpPort, ":")
}
```

**Где задаётся:**
- Локально: `SERVER_PORT=44044` (из `.env` или дефолт)
- YC: `HTTP_PORT=:8080` (передаётся в `--environment` при деплое контейнера)
- Dockerfile: `EXPOSE 8080` (информационный, не влияет на runtime)

---

## 📊 Тестовые данные

**Пароль для всех:** `password123`

| Email | Роль | Статус |
|-------|------|--------|
| admin@example.com | admin | active |
| user@example.com | user | active |

**Seed команды:**
```bash
# Stage БД (через Lockbox)
cd backend && task seed:stage

# Production БД (ОСТОРОЖНО!)
cd backend && task seed:prod
```

---

## 🧪 Proto файлы в Vitest тестах

**Проблема:** Unit-тесты с proto зависимостями падают с `goog is not defined` или `globalThis.proto is undefined`.

**Причина:** Proto файлы требуют polyfill из vite.config.ts (protobufPlugin), который не применяется в vitest.

**Решение:** 
- Unit-тесты: изолированные утилиты без proto
- Proto-совместимость: `yarn type-check` + `yarn build` в CI
- E2E тесты: реальные gRPC вызовы (Playwright)

**Почему это работает:**
- TypeScript ловит несовместимость типов из `*_pb.d.ts`
- Build ловит runtime ошибки в wrapper (несуществующие классы)

**Пример:**
```typescript
// ❌ Падает — routes тянут authApi → proto
const routesModule = await import('./index');

// ✅ Работает — изолированные утилиты
const lazyModule = await import('shared/lib/lazy');
```
