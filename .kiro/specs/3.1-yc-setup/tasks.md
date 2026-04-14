# Настройка YC окружения — Tasks

## Task List

### 1. Подготовка YC CLI

- [ ] 1.1 Установить и настроить YC CLI (`yc init`)
- [ ] 1.2 Создать folder для проекта (или использовать существующий)
- [ ] 1.3 Создать service account с правами:
  - `container-registry.images.pusher`
  - `serverless-containers.editor`
  - `lockbox.payloadViewer`
  - `storage.editor`

### 2. Создание ресурсов YC

- [ ] 2.1 Создать Managed PostgreSQL:
  - Две базы: `{project}_stage`, `{project}_prod`
  - Пользователь с правами на обе базы
- [ ] 2.2 Создать Lockbox секрет
- [ ] 2.3 Запустить `1-initial-deploy.sh` или `.ps1` (создаст Container Registry, Container, API Gateway)
- [ ] 2.4 Создать S3 buckets для frontend:
  - `{project}-frontend-stage`
  - `{project}-frontend-prod`
- [ ] 2.5 Настроить S3 buckets для SPA (website hosting)

### 3. Настройка секретов в Lockbox

- [ ] 3.1 Сгенерировать JWT_SECRET:
  ```bash
  openssl rand -base64 32
  ```
- [ ] 3.2 Сгенерировать ENCRYPTION_KEY:
  ```bash
  openssl rand -base64 32
  ```
- [ ] 3.3 Добавить DATABASE_URL (production, с SSL)
- [ ] 3.4 Добавить DATABASE_URL_LOCAL (stage, с SSL)
- [ ] 3.5 Добавить JWT_SECRET в Lockbox
- [ ] 3.6 Добавить ENCRYPTION_KEY в Lockbox
- [ ] 3.7 Добавить SMTP_* секреты (если нужен email)

### 4. Первый деплой Backend

- [ ] 4.1 Запустить миграции:
  ```bash
  cd backend && task migrate:stage
  ```
- [ ] 4.2 Задеплоить контейнер:
  ```bash
  cd backend && task deploy
  ```
- [ ] 4.3 Обновить API Gateway:
  ```bash
  yc serverless api-gateway update <ID> --spec deployment/api-gateway/stage.yaml
  ```
- [ ] 4.4 Проверить health:
  ```bash
  curl https://<API_GATEWAY_URL>/health
  ```

### 5. Первый деплой Frontend

- [ ] 5.1 Создать `frontend/.env` с `VITE_GRPC_HOST` указывающим на stage API Gateway:
  ```
  VITE_GRPC_HOST=https://<API_GATEWAY_URL>
  ```
- [ ] 5.2 Обновить API URL в `.env.stage` (если используется отдельный файл)
- [ ] 5.3 Задеплоить frontend:
  ```bash
  cd frontend && ./deployment/scripts/deploy-frontend.sh  # или .ps1 для Windows
  ```
- [ ] 5.4 Проверить доступность:
  ```bash
  curl https://<S3_BUCKET_URL>
  ```

### 6. Проверка

- [ ] 6.1 Открыть frontend в браузере
- [ ] 6.2 Проверить страницу входа
- [ ] 6.3 Создать тестового пользователя (через seed или регистрацию):
  ```bash
  cd backend && task seed:stage
  ```
- [ ] 6.4 Проверить вход в систему

### 7. Обновление Steering-файлов

- [ ] 7.1 В `.kiro/steering/yc-operations.md`:
  - Заполнить секцию `## Ресурсы` реальными ID:
    - Container Registry ID
    - Serverless Container ID (prod + stage)
    - API Gateway ID (prod + stage)
    - S3 bucket names (prod + stage)
    - Lockbox secret name
    - Service Account ID
  - Добавить часто используемые YC CLI команды для этого проекта
- [ ] 7.2 В `.kiro/steering/lessons-learned.md`:
  - Добавить особенности настройки YC для этого проекта
  - Добавить решённые проблемы при деплое (если были)

---

## Notes

- Все команды выполняются из корня соответствующей директории
- Секреты НИКОГДА не коммитятся в репозиторий
- После каждого изменения Lockbox нужно передеплоить контейнер
- API Gateway нужно обновлять после каждого деплоя контейнера
- Предполагается что `initial-setup` уже выполнен (проект переименован, секреты сгенерированы)
