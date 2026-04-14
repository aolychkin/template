---
inclusion: always
---

# Project Structure - [PROJECT_NAME]

## Directories

```
project/
├── backend/
│   ├── cmd/server/      # Entry point
│   ├── deployment/      # Скрипты деплоя (.sh + .ps1)
│   └── internal/        # Go gRPC сервер
├── frontend/
│   ├── deployment/      # Скрипт деплоя frontend (.sh + .ps1)
│   └── src/             # React приложение
├── contract/            # Proto + генерация
├── scripts/             # Скрипты установки инструментов
│   ├── install-tools.sh   # macOS/Linux
│   └── install-tools.ps1  # Windows
├── docker-compose.yml   # Локальная БД (только после спеки 3.2, не в git)
├── Taskfile.yml         # Корневой таск-раннер (только после спеки 3.2, не в git)
└── .kiro/
    ├── specs/           # Спецификации (1-environment-setup, 2-initial-setup, 3.1/3.2)
    ├── settings/        # Настройки окружения (environment.json, не в git)
    └── steering/        # Правила для Kiro
```

## Backend Structure

```
internal/
├── domain/models/       # GORM модели
├── grpc/
│   ├── server/          # gRPC server setup
│   └── service/         # Handlers
├── services/service/    # Бизнес-логика
├── storage/postgres/    # БД операции
├── lib/                 # Утилиты
│   ├── auth/            # JWT, bcrypt, SHA256
│   ├── validate/        # Бизнес-правила
│   ├── errutil/         # Стратегии обработки ошибок
│   └── interceptors/    # gRPC middleware (auth, validation, timeout, etc.)
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

**Всегда загружается (always):**
- product.md, tech.md, structure.md

**По типу файла (fileMatch):**
- `**/*.go` → backend-patterns, architecture-invariants
- `**/*.tsx`, `**/*.ts` → frontend-patterns, architecture-invariants
- `**/*.tsx` → design-system

**Автоматически по контексту (auto):**
- quick-reference — gRPC шаблоны, частые ошибки
- decision-making — алгоритм принятия решений
- commit-checklist — перед коммитом
- grpc-workflow — добавление gRPC методов
- security-checklist — security guidelines
- lessons-learned — технические детали проекта
- development-workflow — workflow разработки
- investigation-methods — методы диагностики
- yc-operations — Yandex Cloud операции
- steering-readme — навигация по steering
- domain-glossary — словарь терминов
