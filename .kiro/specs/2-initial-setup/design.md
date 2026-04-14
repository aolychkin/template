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
| `backend/Taskfile.yml` | `LOCKBOX_SECRET: my-project-secrets` |
| `frontend/package.json` | `"name": "my-project-frontend"` |
| `frontend/deployment/scripts/deploy-frontend.sh` | `PROJECT_NAME="my-project"` |
| `frontend/deployment/scripts/deploy-frontend.ps1` | `$PROJECT_NAME = "my-project"` |
| `frontend/src/shared/config/.env.example` | Комментарии с `my-project-api-*` |
| `.kiro/steering/product.md` | `[PROJECT_NAME]` в заголовке |
| `.kiro/steering/tech.md` | `[PROJECT_NAME]` в заголовке |
| `.kiro/steering/structure.md` | `[PROJECT_NAME]` в заголовке |
| `.kiro/steering/yc-operations.md` | Все `my-project-*` плейсхолдеры |

## Correctness Properties

### Property 1: Полнота переименования
*Для любого* файла в проекте, строка `my-project` НЕ должна присутствовать после переименования (кроме README с инструкциями шаблона).

**Validates:** Requirements 1.1

### Property 2: Компиляция после переименования
*Для любого* изменения в рамках переименования, проект ДОЛЖЕН компилироваться (`go build` и `yarn type-check`).

**Validates:** Requirements 2.1

## Testing Strategy

### Automated Checks
- `grep -r "my-project" --include="*.go" --include="*.ts" --include="*.sh" --include="*.yaml" --include="*.yml" --include="*.json"` — не должно быть совпадений после переименования
- `go build -o /dev/null ./cmd/server` — backend компилируется
- `yarn type-check` — frontend компилируется
