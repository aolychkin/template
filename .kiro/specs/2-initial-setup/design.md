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
| `backend/deployment/scripts/2-setup-stage.sh` | `PROJECT_NAME="my-project"` |
| `backend/deployment/scripts/update-container.sh` | `PROJECT_NAME="my-project"` |
| `backend/deployment/api-gateway/*.yaml` | URL и имена сервисов |
| `backend/Taskfile.yml` | `LOCKBOX_SECRET: my-project-secrets` |
| `frontend/package.json` | `"name": "my-project-frontend"` |
| `frontend/deployment/scripts/deploy-frontend.sh` | Имя S3 bucket |
| `.kiro/steering/product.md` | Название и описание проекта |
| `.kiro/steering/tech.md` | Имя проекта в заголовке |

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
