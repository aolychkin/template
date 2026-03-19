# Initial Project Setup - Tasks

## Task List

### 1. Подготовка YC

- [ ] 1.1 Установить и настроить YC CLI (`yc init`)
- [ ] 1.2 Создать folder для проекта (или использовать существующий)
- [ ] 1.3 Создать service account с правами:
  - `container-registry.images.pusher`
  - `serverless-containers.editor`
  - `lockbox.payloadViewer`
  - `storage.editor`

### 2. Переименование проекта

- [ ] 2.1 Заменить `my-project` на реальное имя в:
  - `backend/deployment/scripts/*.sh`
  - `backend/deployment/api-gateway/*.yaml`
  - `frontend/deployment/scripts/*.sh`
- [ ] 2.2 Обновить `package.json` (name)
- [ ] 2.3 Обновить `.kiro/steering/product.md`
- [ ] 2.4 Обновить `.kiro/steering/yc-operations.md` (после создания ресурсов)

### 3. Создание ресурсов YC

- [ ] 3.1 Создать Managed PostgreSQL:
  - Две базы: `{project}_stage`, `{project}_prod`
  - Пользователь с правами на обе базы
- [ ] 3.2 Создать Lockbox секрет
- [ ] 3.3 Запустить `1-initial-deploy.sh` (создаст Container Registry, Container, API Gateway)
- [ ] 3.4 Создать S3 buckets для frontend:
  - `{project}-frontend-stage`
  - `{project}-frontend-prod`
- [ ] 3.5 Настроить S3 buckets для SPA (website hosting)

### 4. Настройка секретов

- [ ] 4.1 Сгенерировать JWT_SECRET:
  ```bash
  openssl rand -base64 32
  ```
- [ ] 4.2 Сгенерировать ENCRYPTION_KEY:
  ```bash
  openssl rand -base64 32
  ```
- [ ] 4.3 Добавить все секреты в Lockbox:
  - DATABASE_URL (production)
  - DATABASE_URL_LOCAL (stage)
  - JWT_SECRET
  - ENCRYPTION_KEY
  - SMTP_* (если нужен email)

### 5. Первый деплой Backend

- [ ] 5.1 Запустить миграции:
  ```bash
  cd backend && task migrate
  ```
- [ ] 5.2 Задеплоить контейнер:
  ```bash
  cd backend && task deploy
  ```
- [ ] 5.3 Обновить API Gateway:
  ```bash
  yc serverless api-gateway update <ID> --spec deployment/api-gateway/stage.yaml
  ```
- [ ] 5.4 Проверить health:
  ```bash
  curl https://<API_GATEWAY_URL>/health
  ```

### 6. Первый деплой Frontend

- [ ] 6.1 Обновить API URL в `.env.stage`:
  ```
  VITE_API_URL=https://<API_GATEWAY_URL>
  ```
- [ ] 6.2 Задеплоить frontend:
  ```bash
  cd frontend && ./deployment/scripts/deploy-frontend.sh
  ```
- [ ] 6.3 Проверить доступность:
  ```bash
  curl https://<S3_BUCKET_URL>
  ```

### 7. Проверка

- [ ] 7.1 Открыть frontend в браузере
- [ ] 7.2 Проверить страницу входа
- [ ] 7.3 Создать тестового пользователя (через seed или регистрацию)
- [ ] 7.4 Проверить вход в систему

### 8. Документация

- [ ] 8.1 Обновить `yc-operations.md` с реальными ID ресурсов
- [ ] 8.2 Обновить `lessons-learned.md` с особенностями проекта
- [ ] 8.3 Удалить этот spec или пометить как завершённый

---

## Notes

- Все команды выполняются из корня соответствующей директории
- Секреты НИКОГДА не коммитятся в репозиторий
- После каждого изменения Lockbox нужно передеплоить контейнер
- API Gateway нужно обновлять после каждого деплоя контейнера
