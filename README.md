# Fullstack gRPC Template

Production-ready шаблон для fullstack приложений на Go + gRPC + React.

## Стек

| Слой | Технологии |
|------|-----------|
| Backend | Go, gRPC, GORM, PostgreSQL |
| Frontend | React 19, RTK Query, MUI, Vite |
| Протокол | gRPC-Web (proto → TypeScript/Go) |
| Инфраструктура | Yandex Cloud Serverless Containers, S3, Managed PostgreSQL |

## Что внутри

- JWT авторизация (access 15 мин + refresh 7 дней)
- Multi-step регистрация
- RBAC (user / admin)
- Rate limiting, CSRF, XSS protection
- Clean Architecture (backend) + Feature-Sliced Design (frontend)
- gRPC-Web клиент с retry, circuit breaker, auto token refresh
- Деплой скрипты для Yandex Cloud
- Steering файлы для AI-ассистента (Kiro)

## Начало работы

### 1. Создайте свой репозиторий

Нажмите кнопку **"Use this template"** → **"Create a new repository"** на GitHub.

Это создаст чистый репозиторий без связи с оригиналом.

### 2. Клонируйте и настройте

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_PROJECT.git
cd YOUR_PROJECT
```

### 3. Переименуйте проект

Замените `[PROJECT_NAME]` в steering файлах (`.kiro/steering/`) на название вашего проекта.

### 4. Prerequisites

- Go 1.22+
- Node.js 20+
- Yarn
- PostgreSQL 16+ (рекомендуется Yandex Cloud Managed PostgreSQL)
- [Task](https://taskfile.dev/)
- [Buf](https://buf.build/) (для proto)
- [Yandex Cloud CLI](https://cloud.yandex.ru/docs/cli/quickstart) (для деплоя)

### 5. Настройте окружение

```bash
# Backend
cd backend
cp .env.example .env
# Отредактируйте .env — укажите DATABASE_URL, JWT_SECRET

# Frontend
cd frontend
yarn install
cp .env.example .env
# Отредактируйте .env — укажите VITE_GRPC_HOST
```

## Структура проекта

```
├── backend/             # Go gRPC сервер (Clean Architecture)
│   ├── cmd/server/      # Entry point
│   ├── internal/        # Бизнес-логика, storage, gRPC handlers
│   └── deployment/      # Скрипты деплоя
├── frontend/            # React приложение (Feature-Sliced Design)
│   ├── src/
│   └── deployment/      # Скрипты деплоя
├── contract/            # Proto файлы + генерация (Go + TypeScript)
└── .kiro/steering/      # Правила для AI-ассистента
```

## Команды

```bash
# Frontend (локальная разработка)
cd frontend && task dev          # :3000

# Proto (при изменениях в .proto файлах)
cd contract && task generate

# Деплой
cd backend && task deploy        # stage / production
cd frontend && task deploy       # stage / production

# Тесты
cd backend && go test -v ./...
cd frontend && yarn type-check && yarn test
```

> ⚠️ Backend не запускается локально. Только stage и production на Yandex Cloud.

## Окружения

| Окружение | Backend | Frontend | БД |
|-----------|---------|----------|----|
| local | — | localhost:3000 → stage backend | stage DB |
| stage | YC Container | S3 bucket | *_stage |
| production | YC Container | S3 bucket | *_prod |

## Деплой (Yandex Cloud)

### Подготовка инфраструктуры

1. Managed PostgreSQL (stage + production БД)
2. Container Registry
3. Service Account с правами
4. Lockbox секрет (DATABASE_URL, JWT_SECRET, ENCRYPTION_KEY)
5. Object Storage buckets (frontend stage + production)
6. API Gateway

### Настройка скриптов

**Backend** — `backend/deployment/scripts/update-container.sh`:
```bash
PROJECT_NAME="my-project"
```

**Frontend** — `frontend/deployment/scripts/deploy-frontend.sh`:
```bash
PROJECT_NAME="my-project"
STAGE_BUCKET="${PROJECT_NAME}-frontend-stage"
PROD_BUCKET="${PROJECT_NAME}-frontend-prod"
```

### Запуск

```bash
cd backend && task deploy     # Выберите stage или production
cd frontend && task deploy    # Выберите stage или production
```

## Работа с AI-ассистентом (Kiro)

Шаблон включает steering файлы в `.kiro/steering/`, которые автоматически подгружаются в контекст Kiro.

Доступные manual-стиринги:
- `#grpc-workflow` — добавление gRPC методов
- `#security-checklist` — security guidelines
- `#decision-making` — алгоритм принятия решений
- `#commit-checklist` — чеклист перед коммитом
- `#quick-reference` — gRPC шаблоны, частые ошибки

## License

MIT
