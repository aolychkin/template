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
  - `backend/deployment/monitoring/alertmanager-telegram.yml` (поле `channel_names`, 2 места)
  - `frontend/deployment/scripts/deploy-frontend.sh` и `.ps1`
  - `frontend/.env.example` (поле `VITE_APP_NAME`)
  - `frontend/src/shared/config/.env.example` (комментарии и `VITE_APP_NAME`)
  - `frontend/src/shared/config/.env.development` (поле `VITE_APP_NAME`)
  - `.kiro/steering/yc-operations.md` (все `my-project-*` плейсхолдеры и `my_project` / `my_project_prod` в секции PostgreSQL)
- [ ] 1.3 Заменить `[PROJECT_NAME]` на реальное имя в:
  - `frontend/index.html` (тег `<title>`)
  - `frontend/index.production.html` (тег `<title>`)
  - `frontend/index.stage.html` (тег `<title>`)
- [ ] 1.4 Обновить `backend/Taskfile.yml` — переменная `LOCKBOX_SECRET`
- [ ] 1.5 Обновить `frontend/package.json` — поле `name`
- [ ] 1.6 В `.kiro/steering/product.md`:
  - Заменить `[PROJECT_NAME]` в заголовке на реальное имя
  - Заполнить секцию `## Purpose` — описание продукта
  - Заполнить `## Scale & Context` — масштаб и аудитория
  - Обновить `## Key Features` если нужно
- [ ] 1.7 В `.kiro/steering/tech.md`:
  - Заменить `[PROJECT_NAME]` в заголовке `# Tech Stack - [PROJECT_NAME]` на реальное имя
- [ ] 1.8 В `.kiro/steering/structure.md`:
  - Заменить `[PROJECT_NAME]` в заголовке `# Project Structure - [PROJECT_NAME]` на реальное имя
- [ ] 1.9 Обновить `backend/go.mod` — имя модуля `template` → новое имя. **ВАЖНО:** это потребует обновления ВСЕХ Go импортов (`template/internal/...` → `{новое-имя}/internal/...`) во всех `.go` файлах проекта (~20+ файлов)
- [ ] 1.10 Обновить `go_package` в proto файлах (`contract/proto/*//*.proto`): `template/gen/go/...` → `{новое-имя}/gen/go/...`
- [ ] 1.11 После обновления proto файлов — перегенерировать код: `cd contract && task generate` (скрипт генерации копирует файлы в `backend/internal/grpc/gen/`, путь `go_package` в proto влияет только на содержимое сгенерированных `.go` файлов, не на расположение)

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
- [ ] 2.5 Проверить что `go.mod` не перезаписан на версию выше 1.22:
  ```bash
  head -3 backend/go.mod
  ```
  Должно быть `go 1.22.7`. Если `go mod tidy`/`go get` перезаписал на более высокую версию — вручную вернуть `go 1.22.7` в `backend/go.mod`. Причина: YC Serverless Containers поддерживает только Go 1.22, Dockerfile использует `golang:1.22-alpine`.

### 3. Проверка компиляции

- [ ] 3.0 Проверить что `go.mod` содержит `go 1.22.7` (не выше!):
  ```bash
  grep "^go " backend/go.mod
  ```
  Если версия выше — исправить вручную на `go 1.22.7`
- [ ] 3.1 Проверить что `my-project`, `my_project` и `[PROJECT_NAME]` нигде не осталось:
  ```bash
  grep -rn "my-project\|my_project\|\[PROJECT_NAME\]" --include="*.go" --include="*.ts" --include="*.sh" --include="*.ps1" --include="*.yaml" --include="*.yml" --include="*.json" --include="*.md" --include=".env*" --include="*.html" . | grep -v node_modules | grep -v ".git/"
  ```
  Допустимые исключения: README.md (инструкции шаблона), спеки (документация)
- [ ] 3.1b Проверить что Go модуль `template` переименован:
  ```bash
  grep -r '"template/internal' --include="*.go" backend/
  ```
  Должно быть 0 совпадений после переименования
- [ ] 3.1c Проверить что proto файлы обновлены:
  ```bash
  grep -r 'template/' --include="*.proto" contract/
  ```
  Должно быть 0 совпадений после переименования
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
