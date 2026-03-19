---
inclusion: always
---

# Project Structure - [PROJECT_NAME]

## Directories

```
project/
├── backend/
│   ├── cmd/server/      # Entry point
│   └── internal/        # Go gRPC сервер
├── frontend/            # React приложение
├── contract/            # Proto + генерация
└── .kiro/               # Документация
    ├── specs/           # Спецификации фич
    └── steering/        # Правила для Kiro
```

## Backend Structure

```
internal/
├── domain/models/       # GORM модели
├── grpc/
│   ├── server/          # gRPC server setup
│   ├── interceptors/    # Auth, validation, logging
│   └── service/         # Handlers
├── services/service/    # Бизнес-логика
├── storage/postgres/    # БД операции
├── lib/                 # Утилиты (auth, validate, errutil)
└── config/              # Конфигурация
```

## Frontend Structure (FSD)

```
src/
├── app/                 # Store, providers, routes
├── pages/               # Страницы
├── widgets/             # Композитные блоки
├── features/            # Фичи
├── entities/            # Бизнес-сущности + API
└── shared/              # UI, lib, api, config
```

## Steering Navigation

**Всегда загружается:**
- product.md, tech.md, structure.md

**По типу файла (fileMatch):**
- `**/*.go` → `#backend-patterns`, `#architecture-invariants`
- `**/*.tsx,**/*.ts` → `#frontend-patterns`, `#architecture-invariants`
- `**/*.tsx` → `#design-system`

**По запросу (manual):**
- `#quick-reference` - gRPC шаблоны, частые ошибки
- `#decision-making` - алгоритм принятия решений
- `#commit-checklist` - перед коммитом
- `#grpc-workflow` - добавление gRPC методов
- `#security-checklist` - security guidelines
- `#lessons-learned` - технические детали проекта
- `#development-workflow` - workflow разработки
- `#investigation-methods` - методы диагностики
- `#yc-operations` - Yandex Cloud операции
