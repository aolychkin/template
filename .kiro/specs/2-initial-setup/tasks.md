# Initial Project Setup - Tasks

## Task List

### 1. Переименование проекта

- [ ] 1.1 Спросить у разработчика имя проекта (kebab-case, например `my-awesome-app`)
- [ ] 1.2 Заменить `my-project` на реальное имя в:
  - `backend/deployment/scripts/1-initial-deploy.sh` и `.ps1`
  - `backend/deployment/scripts/2-setup-stage.sh` и `.ps1`
  - `backend/deployment/scripts/update-container.sh` и `.ps1`
  - `backend/deployment/api-gateway/stage.yaml`
  - `backend/deployment/api-gateway/production.yaml`
  - `backend/deployment/DEPLOY.md`
  - `backend/deployment/monitoring/alerting-rules.yml` (поле `service:`, 5 мест)
  - `frontend/deployment/scripts/deploy-frontend.sh` и `.ps1`
  - `frontend/src/shared/config/.env.example` (комментарии)
  - `.kiro/steering/yc-operations.md` (все `my-project-*` плейсхолдеры)
- [ ] 1.3 Обновить `backend/Taskfile.yml` — переменная `LOCKBOX_SECRET`
- [ ] 1.4 Обновить `frontend/package.json` — поле `name`
- [ ] 1.5 В `.kiro/steering/product.md`:
  - Заменить `[PROJECT_NAME]` в заголовке на реальное имя
  - Заполнить секцию `## Purpose` — описание продукта
  - Заполнить `## Scale & Context` — масштаб и аудитория
  - Обновить `## Key Features` если нужно
- [ ] 1.6 В `.kiro/steering/tech.md`:
  - Заменить `[PROJECT_NAME]` в заголовке `# Tech Stack - [PROJECT_NAME]` на реальное имя
- [ ] 1.7 В `.kiro/steering/structure.md`:
  - Заменить `[PROJECT_NAME]` в заголовке `# Project Structure - [PROJECT_NAME]` на реальное имя
- [ ] 1.8 Обновить `backend/go.mod` — имя модуля (если нужно)

### 2. Установка зависимостей

- [ ] 2.1 Установить Go зависимости:
  ```bash
  cd backend && go mod download
  ```
- [ ] 2.2 Установить frontend зависимости:
  ```bash
  cd frontend && yarn install
  ```
- [ ] 2.3 Установить contract зависимости:
  ```bash
  cd contract && yarn install
  ```
- [ ] 2.4 Сгенерировать proto код (gRPC типы для backend и frontend):
  ```bash
  cd contract && task generate
  ```

### 3. Проверка компиляции

- [ ] 3.1 Проверить что `my-project` нигде не осталось:
  ```bash
  grep -r "my-project" --include="*.go" --include="*.ts" --include="*.sh" --include="*.ps1" --include="*.yaml" --include="*.yml" --include="*.json" --include="*.md" . | grep -v node_modules | grep -v ".git/"
  ```
  Допустимые исключения: README.md (инструкции шаблона), спеки (документация)
- [ ] 3.2 Проверить backend:
  ```bash
  cd backend && go build -o /dev/null ./cmd/server
  ```
- [ ] 3.3 Проверить frontend:
  ```bash
  cd frontend && yarn type-check
  ```
- [ ] 3.4 Проверить линтер:
  ```bash
  cd frontend && yarn lint
  ```

### 4. Выбор окружения

- [ ] 4.1 Выбрать следующую спеку:
  - **`yc-setup`** — если есть аккаунт Yandex Cloud и нужно облачное окружение
  - **`local-development-support`** — если хочется работать полностью локально (docker-compose + локальный бекенд)

---

## Notes

- Предполагается что `environment-setup` уже выполнен (ОС определена, инструменты установлены, .ps1 скрипты созданы)
- Эта спека НЕ включает настройку окружения (ни YC, ни локального)
- После выполнения — перейти к `yc-setup` или `local-development-support`
