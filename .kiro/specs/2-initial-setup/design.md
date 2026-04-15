# Initial Project Setup - Design

## Architecture Overview

```
initial-setup (общая инициализация)
    │
    ├── 1. Переименование проекта
    │   ├── deployment скрипты
    │   ├── package.json
    │   ├── Taskfile.yml
    │   └── steering файлы
    │
    ├── 2. Проверка компиляции
    │   ├── go build
    │   ├── yarn type-check
    │   └── yarn lint
    │
    └── 3. Выбор окружения → yc-setup ИЛИ local-development-support
```

## Файлы для переименования

| Файл | Что менять |
|------|-----------|
| `backend/deployment/scripts/1-initial-deploy.sh` | `PROJECT_NAME="my-project"` |
| `backend/deployment/scripts/1-initial-deploy.ps1` | `$PROJECT_NAME = "my-project"` |
| `backend/deployment/scripts/2-setup-stage.sh` | `PROJECT_NAME="my-project"` |
| `backend/deployment/scripts/2-setup-stage.ps1` | `$PROJECT_NAME = "my-project"` |
| `backend/deployment/scripts/update-container.sh` | `PROJECT_NAME="my-project"` |
| `backend/deployment/scripts/update-container.ps1` | `$PROJECT_NAME = "my-project"` |
| `backend/deployment/api-gateway/stage.yaml` | `my-project-frontend-stage`, `my-project-sa`, `my-project-api-stage` |
| `backend/deployment/api-gateway/production.yaml` | `my-project-frontend-prod`, `my-project-sa`, `my-project-api` |
| `backend/deployment/DEPLOY.md` | `my-project-secrets`, `my-project-api`, `my-project-gateway-*` |
| `backend/deployment/monitoring/alerting-rules.yml` | `service: my-project` (5 мест) |
| `backend/deployment/monitoring/alertmanager-telegram.yml` | `channel_names: ['my-project']` (2 места) |
| `backend/Taskfile.yml` | `LOCKBOX_SECRET: my-project-secrets` |
| `frontend/package.json` | `"name": "my-project-frontend"` |
| `frontend/deployment/scripts/deploy-frontend.sh` | `PROJECT_NAME="my-project"` |
| `frontend/deployment/scripts/deploy-frontend.ps1` | `$PROJECT_NAME = "my-project"` |
| `frontend/.env.example` | `VITE_APP_NAME=my-project` |
| `frontend/src/shared/config/.env.example` | `VITE_APP_NAME=my-project`, комментарии с `my-project-api-*` |
| `frontend/src/shared/config/.env.development` | `VITE_APP_NAME=my-project` |
| `.kiro/steering/product.md` | `[PROJECT_NAME]` в заголовке |
| `.kiro/steering/tech.md` | `[PROJECT_NAME]` в заголовке |
| `.kiro/steering/structure.md` | `[PROJECT_NAME]` в заголовке |
| `frontend/index.html` | `<title>[PROJECT_NAME]</title>` |
| `frontend/index.production.html` | `<title>[PROJECT_NAME]</title>` |
| `frontend/index.stage.html` | `<title>[PROJECT_NAME] (Stage)</title>` |
| `.kiro/steering/yc-operations.md` | Все `my-project-*` плейсхолдеры |
| `backend/go.mod` | Имя модуля `template` → новое имя |
| Все `*.go` файлы в `backend/` | Импорты `template/internal/...` → `{новое-имя}/internal/...` (~20+ файлов) |

### Конкретные Go файлы с импортами `template/...`

При переименовании модуля нужно обновить ВСЕ файлы, содержащие `"template/internal/...` или `"template/gen/...`. Основные:

| Директория | Файлы |
|-----------|-------|
| `backend/cmd/server/` | `main.go` |
| `backend/cmd/migrate/` | `main.go` |
| `backend/cmd/seed/` | `main.go` |
| `backend/internal/grpc/server/` | `server.go` |
| `backend/internal/grpc/service/auth/` | `handler.go` |
| `backend/internal/grpc/service/user/` | `handler.go` |
| `backend/internal/grpc/service/admin/` | `handler.go` |
| `backend/internal/services/service/auth/` | `auth.go` |
| `backend/internal/services/service/user/` | `user.go` |
| `backend/internal/services/service/admin/` | `admin.go` |
| `backend/internal/storage/postgres/auth/` | `auth.go` |
| `backend/internal/storage/postgres/user/` | `user.go` |
| `backend/internal/storage/postgres/` | `connection.go` |
| `backend/internal/seed/` | `seed.go`, `users.go`, `data.go` |
| `backend/internal/lib/interceptors/` | `auth.go`, `correlation.go`, `ratelimit.go`, `timeout.go`, `validation.go` |
| `backend/internal/lib/` | Все файлы с импортами из `template/...` |

**Проверка полноты:** `grep -r '"template/' --include="*.go" backend/` — должно быть 0 совпадений после переименования.

## Correctness Properties

### Property 1: Полнота переименования
*Для любого* файла в проекте, строка `my-project` НЕ должна присутствовать после переименования (кроме README с инструкциями шаблона).

### Property 1b: Полнота переименования Go модуля
*Для любого* `.go` файла в проекте, строка `"template/internal` НЕ должна присутствовать после переименования модуля.

**Validates:** Requirements 1.1

### Property 1c: Консистентность proto go_package
*Для любого* `.proto` файла, `go_package` ДОЛЖЕН содержать новое имя модуля вместо `template`. После обновления `go_package` ОБЯЗАТЕЛЬНА перегенерация: `cd contract && task generate`. Без перегенерации сгенерированные Go файлы будут содержать старый пакет.

**Validates:** Requirements 1.1

### Property 2: Компиляция после переименования
*Для любого* изменения в рамках переименования, проект ДОЛЖЕН компилироваться (`go build` и `yarn type-check`).

**Validates:** Requirements 2.1

## Testing Strategy

### Automated Checks
- `grep -r "my-project" --include="*.go" --include="*.ts" --include="*.sh" --include="*.yaml" --include="*.yml" --include="*.json" --include=".env*"` — не должно быть совпадений после переименования
- `go build -o /dev/null ./cmd/server` — backend компилируется
- `yarn type-check` — frontend компилируется
