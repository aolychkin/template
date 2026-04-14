# Поддержка локальной разработки — Requirements

## Введение

Данная спека настраивает полностью локальную разработку: backend + PostgreSQL запускаются локально через docker-compose, фронтенд подключается к локальному бекенду. Спека выполняется после `initial-setup` (общая инициализация проекта) как альтернатива `yc-setup`.

### Связь со спеками

```
Спека 1: environment-setup (ОС, зависимости, shell)
    └── Спека 2: initial-setup (общая инициализация)
        ├── Спека 3.1: yc-setup (облачное окружение)
        └── Спека 3.2: local-development-support (локальное окружение) ← ЭТА СПЕКА
```

## Глоссарий

- **Local_Mode** — режим работы, при котором backend и PostgreSQL запускаются локально через docker-compose
- **Environment_Config** — файлы `.env` для backend и frontend, определяющие параметры подключения
- **Steering_Files** — файлы в `.kiro/steering/` (tech.md, structure.md и др.), описывающие правила и архитектуру проекта
- **Docker_Compose_Stack** — набор сервисов (PostgreSQL), описанных в `docker-compose.yml` для локальной разработки

---

## Требования

### Требование 1: Docker Compose Stack для локальной БД

**User Story:** Как разработчик, я хочу иметь docker-compose конфигурацию для локальной БД, чтобы запускать PostgreSQL одной командой.

#### Acceptance Criteria

1. THE Docker_Compose_Stack SHALL содержать сервис PostgreSQL версии 16 с volume для персистентности данных
2. THE Docker_Compose_Stack SHALL пробрасывать порт 5432 на хост-машину
3. THE Docker_Compose_Stack SHALL использовать переменные окружения: `POSTGRES_USER=postgres`, `POSTGRES_PASSWORD=postgres`, `POSTGRES_DB=app`
4. THE Docker_Compose_Stack SHALL включать healthcheck для PostgreSQL с интервалом проверки 5 секунд
5. IF порт 5432 занят на хост-машине, THEN THE Docker_Compose_Stack SHALL завершиться с ошибкой Docker о конфликте портов (стандартное поведение Docker)

### Требование 2: Настройка Environment_Config для локальной разработки

**User Story:** Как разработчик, я хочу получить готовые .env файлы для локальной работы, чтобы бекенд и фронтенд сразу подключались к локальным сервисам.

#### Acceptance Criteria

1. WHEN выполняется настройка Local_Mode, THE System SHALL создать файл `backend/.env` на основе `backend/.env.example` с параметром `DATABASE_URL=postgres://postgres:postgres@localhost:5432/app?sslmode=disable`
2. WHEN выполняется настройка Local_Mode, THE System SHALL создать файл `frontend/.env` на основе `frontend/.env.example` с параметром `VITE_GRPC_HOST=http://localhost:44044`
3. WHEN файлы `.env` уже существуют, THE System SHALL НЕ перезаписывать их без подтверждения

### Требование 3: Обновление Steering-файлов для локального режима

**User Story:** Как разработчик, я хочу чтобы steering-файлы отражали локальный режим, чтобы Kiro давал корректные рекомендации для локального окружения.

#### Acceptance Criteria

1. WHEN выполняется настройка Local_Mode, THE System SHALL обновить `tech.md`: таблица окружений включает строку local с backend на localhost:44044 и БД на localhost:5432
2. WHEN выполняется настройка Local_Mode, THE System SHALL обновить `tech.md`: секция Commands включает `cd backend && task dev`, `task local:up`, `task migrate:local`
3. WHEN выполняется настройка Local_Mode, THE System SHALL обновить `structure.md`: добавить `docker-compose.yml` и корневой `Taskfile.yml` в корневую структуру проекта

### Требование 4: Taskfile интеграция для локального режима

**User Story:** Как разработчик, я хочу иметь удобные команды для управления локальным окружением, чтобы запускать и останавливать сервисы одной командой.

#### Acceptance Criteria

1. WHEN проект настроен в Local_Mode, THE System SHALL добавить задачу `local:up` в корневой `Taskfile.yml`, запускающую `docker-compose up -d`
2. WHEN проект настроен в Local_Mode, THE System SHALL добавить задачу `local:down` в корневой `Taskfile.yml`, останавливающую `docker-compose down`
3. WHEN проект настроен в Local_Mode, THE System SHALL добавить задачу `local:reset` в корневой `Taskfile.yml`, выполняющую `docker-compose down -v` и `docker-compose up -d` для пересоздания БД с нуля
4. WHEN разработчик запускает `task local:up`, THE Docker_Compose_Stack SHALL запустить PostgreSQL и дождаться прохождения healthcheck перед завершением команды

### Требование 5: Миграции и seed для локальной БД

**User Story:** Как разработчик, я хочу запускать миграции и seed на локальной БД без указания DATABASE_URL вручную.

#### Acceptance Criteria

1. WHEN проект настроен в Local_Mode, THE System SHALL позволять запуск `cd backend && task migrate` с DATABASE_URL из `backend/.env`
2. WHEN проект настроен в Local_Mode, THE System SHALL позволять запуск `cd backend && task seed` для заполнения локальной БД тестовыми данными
3. WHEN локальная БД недоступна, THE System SHALL вывести понятное сообщение об ошибке с подсказкой запустить `task local:up`

### Требование 6: .gitignore для локальных файлов

**User Story:** Как разработчик, я хочу чтобы локальные файлы не попадали в git, чтобы каждый разработчик мог настроить своё окружение независимо.

#### Acceptance Criteria

1. THE System SHALL добавить `docker-compose.yml` в корневой `.gitignore`, если запись отсутствует (файл генерируется при настройке, не хранится в шаблоне)
2. THE System SHALL убедиться что `backend/.env` и `frontend/.env` присутствуют в соответствующих `.gitignore` файлах
