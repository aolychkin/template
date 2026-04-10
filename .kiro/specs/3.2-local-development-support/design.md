# Поддержка локальной разработки — Design

## Architecture Overview

```
Локальная разработка
    │
    ├── docker-compose.yml
    │   └── PostgreSQL 16 (порт 5432)
    │
    ├── Backend (localhost:44044)
    │   ├── task dev → go run ./cmd/server
    │   └── .env → DATABASE_URL=localhost:5432
    │
    ├── Frontend (localhost:3000)
    │   ├── task dev → yarn dev
    │   └── .env → VITE_GRPC_HOST=http://localhost:44044
    │
    └── Корневой Taskfile.yml
        ├── local:up → docker-compose up -d
        ├── local:down → docker-compose down
        └── local:reset → docker-compose down -v && up -d
```

## Что создаётся

### 1. docker-compose.yml (корень проекта)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: app
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  pgdata:
```

### 2. Корневой Taskfile.yml

```yaml
version: '3'

tasks:
  local:up:
    desc: Запуск локальной БД
    cmds:
      - docker-compose up -d
      - echo "⏳ Ожидание PostgreSQL..."
      - docker-compose exec postgres pg_isready -U postgres
      - echo "✅ PostgreSQL готов"

  local:down:
    desc: Остановка локальной БД
    cmds:
      - docker-compose down

  local:reset:
    desc: Пересоздание локальной БД с нуля
    cmds:
      - docker-compose down -v
      - docker-compose up -d
      - echo "⏳ Ожидание PostgreSQL..."
      - sleep 3
      - docker-compose exec postgres pg_isready -U postgres
      - echo "✅ PostgreSQL пересоздан"
```

### 3. backend/.env

Копия `backend/.env.example` — все дефолтные значения уже настроены на localhost.

### 4. frontend/.env

Копия `frontend/.env.example` — `VITE_GRPC_HOST=http://localhost:44044` уже на месте.

## Изменения в существующих файлах

### backend/Taskfile.yml — задача migrate:local

Текущая задача `migrate` требует явный `DATABASE_URL` через env переменную (проверка в shell ДО запуска Go). Для локальной разработки добавляем `migrate:local`:

```yaml
  migrate:local:
    desc: Миграции в локальную БД (из .env)
    cmds:
      - go run ./cmd/migrate
    dotenv:
      - .env
```

Taskfile поддерживает `dotenv` — это загрузит `.env` перед выполнением команды, и `DATABASE_URL` будет доступен.

### .gitignore (корневой)

Добавить:
```
docker-compose.yml
```

### Steering файлы

**tech.md** — обновить:
- Таблица окружений: добавить строку `local`
- Убрать "Backend НИКОГДА не запускается локально"
- Добавить `cd backend && task dev` в Commands

**structure.md** — добавить `docker-compose.yml` в корневую структуру

## Что НЕ меняется

- `backend/config.go` — дефолты уже на localhost:5432, порт 44044
- `backend/cmd/server/main.go` — godotenv.Load() уже читает .env
- `backend/cmd/migrate/main.go` — godotenv.Load() уже читает .env
- `backend/Taskfile.yml` — существующие задачи (dev, seed, migrate) не трогаем
- `frontend/.env.example` — уже настроен на localhost

## Correctness Properties

### Property 1: Локальная связность
*Для любого* запуска в Local_Mode, backend ДОЛЖЕН подключаться к PostgreSQL на localhost:5432 с DATABASE_URL из `.env`.

**Validates:** Requirements 1, 2

### Property 2: Изоляция от YC
*Для любого* файла, созданного в Local_Mode, он НЕ должен содержать ссылок на YC ресурсы (Lockbox, Serverless Containers, API Gateway).

**Validates:** Requirements 2

### Property 3: Идемпотентность docker-compose
*Для любого* повторного запуска `docker-compose up -d`, данные в PostgreSQL ДОЛЖНЫ сохраняться (volume persistence).

**Validates:** Requirements 1

### Property 4: Миграции без ручного ввода
*Для любого* запуска `task migrate:local`, миграции ДОЛЖНЫ выполняться без явного указания DATABASE_URL (читается из .env).

**Validates:** Requirements 5

## Testing Strategy

### Manual Verification
1. `task local:up` → PostgreSQL доступен на localhost:5432
2. `cd backend && task migrate:local` → таблицы созданы
3. `cd backend && task seed` → данные заполнены
4. `cd backend && task dev` → сервер стартует на :44044
5. `cd frontend && task dev` → фронтенд подключается к localhost:44044
