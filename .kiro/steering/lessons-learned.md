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

**Файл:** `internal/storage/postgres/scopes.go`

```go
// Пример: Активные пользователи
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
ENV=production task migrate  # production
```

**ВАЖНО:** Запускай миграции ПЕРЕД деплоем, не во время runtime!

#### Backend: GORM оптимизации
```go
db, err := gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{
    PrepareStmt:            true,  // Кешируем prepared statements
    SkipDefaultTransaction: true,  // Не создаём транзакцию для каждого запроса
})

// Connection Pool для Serverless
sqlDB.SetMaxOpenConns(10)                 // Мало! 10 контейнеров × 10 = 100 соединений
sqlDB.SetMaxIdleConns(5)                  // Держим несколько готовых
sqlDB.SetConnMaxLifetime(5 * time.Minute) // Короткий lifetime
sqlDB.SetConnMaxIdleTime(1 * time.Minute) // Быстро закрываем idle
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
- **Блокировка:** 15 минут (аккаунт целиком, не только логин)

---

## 🌐 gRPC-Web

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
    "/user.UserService/Login": true,
    "/user.UserService/Register": true,
    // GetMe НЕТ - требует токен!
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

### Архитектура окружений (КРИТИЧНО!)

| Окружение | Backend | Frontend | База данных |
|-----------|---------|----------|-------------|
| **local** | — (НЕТ!) | localhost:3000 → stage backend | stage DB |
| **stage** | YC Container | S3 bucket | *_stage |
| **prod** | YC Container | S3 bucket | *_prod |

**⚠️ Backend НИКОГДА не запускается локально!** Только stage и prod на YC.

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
- `JWT_SECRET` — 64 байта
- `ENCRYPTION_KEY` — 32 байта

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

**Проблема:** Backend использовал stub файлы из `internal/grpc/proto/` вместо сгенерированных из `internal/grpc/gen/`.

**Симптомы:**
- Логин/регистрация возвращают 0 bytes
- Ошибка "Неверный логин или пароль" даже с правильными данными
- gRPC запросы приходят, но данные не парсятся (email/password пустые)

**Причина:** 
1. Taskfile копирует в `internal/grpc/gen/`
2. Но handlers импортировали из `internal/grpc/proto/` (stub файлы)

**Решение:**
1. Импорты должны быть из `internal/grpc/gen/`:
```go
pb "template/internal/grpc/gen/auth"  // ✅ Правильно
pb "template/internal/grpc/proto/auth"  // ❌ Неправильно (stub)
```

2. Удалить папку `internal/grpc/proto/` — она не нужна

3. После `cd contract && task generate` файлы автоматически копируются в `internal/grpc/gen/`

**Признаки stub файлов:**
- Комментарий `// STUB FILE` в начале
- Нет `protoimpl.MessageState` в структурах
- Нет `ProtoReflect()`, `ProtoMessage()` методов

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
