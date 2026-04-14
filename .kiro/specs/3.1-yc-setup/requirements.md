# Настройка YC окружения — Requirements

## Введение

Эта спека описывает настройку облачного окружения в Yandex Cloud для проекта. Выполняется после `initial-setup` (общая инициализация) как альтернатива `local-development-support`.

### Связь со спеками

```
Спека 1: environment-setup (ОС, зависимости, shell)
    └── Спека 2: initial-setup (общая инициализация)
        ├── Спека 3.1: yc-setup (облачное окружение) ← ЭТА СПЕКА
        └── Спека 3.2: local-development-support (локальное окружение)
```

## Glossary

- **YC** — Yandex Cloud
- **Lockbox** — YC сервис для хранения секретов
- **Serverless Container** — YC сервис для запуска контейнеров
- **API Gateway** — YC сервис для маршрутизации HTTP/gRPC запросов
- **Object Storage** — YC S3-совместимое хранилище
- **Container Registry** — YC сервис для хранения Docker образов

---

## Требования

### Требование 1: Подготовка YC CLI

**User Story:** Как разработчик, я хочу настроить YC CLI, чтобы управлять облачными ресурсами из терминала.

#### Acceptance Criteria

1. WHEN разработчик запускает `yc init` THE System SHALL настроить CLI с правильным folder-id
2. WHEN разработчик создаёт service account THE System SHALL назначить права: `container-registry.images.pusher`, `serverless-containers.editor`, `lockbox.payloadViewer`, `storage.editor`

### Требование 2: Создание облачных ресурсов

**User Story:** Как разработчик, я хочу создать необходимые ресурсы в YC, чтобы развернуть приложение.

#### Acceptance Criteria

1. WHEN разработчик запускает скрипт `1-initial-deploy.sh` THE System SHALL создать Container Registry
2. WHEN разработчик запускает скрипт THE System SHALL создать Serverless Container для stage
3. WHEN разработчик запускает скрипт THE System SHALL создать API Gateway для stage
4. WHEN разработчик запускает скрипт THE System SHALL создать Lockbox секрет

### Требование 3: Настройка PostgreSQL

**User Story:** Как разработчик, я хочу настроить базу данных в YC, чтобы хранить данные приложения.

#### Acceptance Criteria

1. WHEN разработчик создаёт Managed PostgreSQL THE System SHALL иметь две базы: stage и production
2. WHEN разработчик добавляет DATABASE_URL в Lockbox THE System SHALL использовать SSL соединение
3. WHEN разработчик запускает миграции THE System SHALL создать все необходимые таблицы

### Требование 4: Генерация и настройка секретов в Lockbox

**User Story:** Как разработчик, я хочу сгенерировать секреты и разместить их в Lockbox, чтобы они были доступны контейнерам безопасно.

#### Acceptance Criteria

1. WHEN разработчик генерирует JWT_SECRET THE System SHALL использовать криптографически стойкий ключ (минимум 32 байта, `openssl rand -base64 32`)
2. WHEN разработчик генерирует ENCRYPTION_KEY THE System SHALL использовать 32-байтный ключ для AES-256 (`openssl rand -base64 32`)
3. WHEN разработчик добавляет секреты в Lockbox THE System SHALL содержать: DATABASE_URL, DATABASE_URL_LOCAL, JWT_SECRET, ENCRYPTION_KEY
4. WHEN разработчик добавляет SMTP секреты THE System SHALL содержать: SMTP_HOST, SMTP_USER, SMTP_PASSWORD, SMTP_FROM (если нужен email)
5. THE System SHALL НЕ хранить секреты в .env файлах в репозитории

### Требование 5: Создание S3 buckets для frontend

**User Story:** Как разработчик, я хочу создать S3 buckets для хостинга frontend, чтобы UI было доступно через браузер.

#### Acceptance Criteria

1. WHEN разработчик создаёт S3 buckets THE System SHALL создать `{project}-frontend-stage` и `{project}-frontend-prod`
2. WHEN S3 bucket настроен THE System SHALL поддерживать SPA routing (index.html для всех путей)
3. WHEN S3 bucket настроен THE System SHALL быть доступен через HTTPS

### Требование 6: Первый деплой Backend

**User Story:** Как разработчик, я хочу задеплоить backend в YC, чтобы API было доступно.

#### Acceptance Criteria

1. WHEN разработчик запускает `task deploy` THE System SHALL собрать Docker образ
2. WHEN разработчик запускает `task deploy` THE System SHALL загрузить образ в Container Registry
3. WHEN разработчик запускает `task deploy` THE System SHALL обновить Serverless Container
4. WHEN контейнер запускается THE System SHALL слушать порт 8080

### Требование 7: Первый деплой Frontend

**User Story:** Как разработчик, я хочу задеплоить frontend в S3, чтобы UI было доступно.

#### Acceptance Criteria

1. WHEN разработчик запускает `deploy-frontend.sh` THE System SHALL собрать production bundle
2. WHEN разработчик запускает `deploy-frontend.sh` THE System SHALL загрузить файлы в S3 bucket
3. WHEN разработчик обновляет `.env.stage` THE System SHALL содержать правильный `VITE_GRPC_HOST` (URL API Gateway)
4. WHEN разработчик обновляет CSP в HTML файлах THE System SHALL заменить `YOUR_*_API_GATEWAY` плейсхолдеры на реальные URL API Gateway (иначе браузер заблокирует запросы к backend)

### Требование 8: Проверка работоспособности

**User Story:** Как разработчик, я хочу проверить что облачное окружение работает.

#### Acceptance Criteria

1. WHEN разработчик вызывает /health THE System SHALL вернуть 200 OK
2. WHEN разработчик открывает frontend URL THE System SHALL показать страницу входа
3. WHEN разработчик пытается войти THE System SHALL успешно аутентифицировать тестового пользователя

### Требование 9: Обновление Steering-файлов для YC режима

**User Story:** Как разработчик, я хочу обновить steering-файлы с реальными ID ресурсов YC.

#### Acceptance Criteria

1. WHEN разработчик завершает настройку YC THE System SHALL обновить `yc-operations.md` с реальными ID ресурсов (Container Registry, Container, API Gateway, S3 buckets)
2. WHEN разработчик завершает настройку YC THE System SHALL обновить `tech.md`: в секции Commands оставить только YC-релевантные команды (deploy, migrate:stage, seed:stage)
