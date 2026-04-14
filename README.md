# Fullstack gRPC Template

Production-ready шаблон для fullstack приложений на Go + gRPC + React.

## Стек

| Слой | Технологии |
|------|-----------|
| Backend | Go, gRPC, GORM, PostgreSQL |
| Frontend | React 19, RTK Query, MUI, Vite |
| Протокол | gRPC-Web (proto → TypeScript/Go) |
| Инфраструктура | YC Serverless Containers + S3 (облако) ИЛИ Docker Compose (локалка) |

## Что внутри

- JWT авторизация (access 15 мин + refresh 7 дней)
- Multi-step регистрация
- RBAC (user / admin)
- Rate limiting, CSRF, XSS protection
- Clean Architecture (backend) + Feature-Sliced Design (frontend)
- gRPC-Web клиент с retry, circuit breaker, auto token refresh
- Деплой скрипты (.sh + .ps1) для Yandex Cloud
- Скрипты автоустановки инструментов (macOS, Linux, Windows)
- Steering файлы для AI-ассистента (Kiro)
- 4 спеки для пошаговой настройки проекта

## Быстрый старт

### 1. Создайте свой репозиторий

Нажмите **"Use this template"** → **"Create a new repository"** на GitHub.

### 2. Клонируйте и откройте в Kiro

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_PROJECT.git
cd YOUR_PROJECT
```

### 3. Следуйте спекам по порядку

Проект настраивается через 4 спеки в `.kiro/specs/`:

```
Спека 1: 1-environment-setup     → Определение ОС, установка инструментов
Спека 2: 2-initial-setup         → Переименование проекта, зависимости, компиляция
Спека 3.1: 3.1-yc-setup          → Настройка Yandex Cloud (по выбору)
Спека 3.2: 3.2-local-development-support → Настройка локальной разработки (по выбору)
```

Откройте `tasks.md` в нужной спеке и выполняйте задачи по порядку.

### Быстрый путь (локальная разработка)

После выполнения спек 1 и 2 (установка инструментов + переименование проекта):

```bash
# Спека 3.2 создаст docker-compose.yml, Taskfile.yml, .env файлы
# После этого:

task local:up                        # запуск PostgreSQL
cd backend && task migrate:local     # миграции
cd backend && task seed              # тестовые данные
cd backend && task dev               # backend :44044

# В новом терминале:
cd frontend && task dev              # frontend :3000
```

## Окружения

| Окружение | Backend | Frontend | БД |
|-----------|---------|----------|----|
| local | localhost:44044 | localhost:3000 | localhost:5432 (docker-compose) |
| stage | YC Container | S3 bucket | Managed PostgreSQL (*_stage) |
| production | YC Container | S3 bucket | Managed PostgreSQL (*_prod) |

## Структура проекта

```
├── backend/             # Go gRPC сервер (Clean Architecture)
│   ├── cmd/server/      # Entry point
│   ├── internal/        # Бизнес-логика, storage, gRPC handlers
│   └── deployment/      # Скрипты деплоя (.sh + .ps1)
├── frontend/            # React приложение (Feature-Sliced Design)
│   ├── src/
│   └── deployment/      # Скрипт деплоя (.sh + .ps1)
├── contract/            # Proto файлы + генерация (Go + TypeScript)
├── scripts/             # Скрипты установки инструментов
│   ├── install-tools.sh   # macOS/Linux
│   └── install-tools.ps1  # Windows
├── docker-compose.yml   # Локальная БД (создаётся спекой 3.2, не в git)
├── Taskfile.yml         # Корневой таск-раннер (создаётся спекой 3.2, не в git)
└── .kiro/
    ├── specs/           # Спеки настройки (1, 2, 3.1, 3.2)
    ├── settings/        # Настройки окружения (не в git)
    └── steering/        # Правила для Kiro AI
```

## Команды

```bash
# Установка инструментов
bash scripts/install-tools.sh        # macOS/Linux
powershell scripts/install-tools.ps1 # Windows

# Proto
cd contract && task generate

# Frontend
cd frontend && task dev             # :3000

# Backend
cd backend && task dev              # локальный сервер :44044

# --- Локальная разработка (после спеки 3.2) ---
task local:up                       # запуск PostgreSQL
task local:down                     # остановка
task local:reset                    # пересоздание с нуля
cd backend && task migrate:local    # миграции (из .env)
cd backend && task seed             # тестовые данные

# --- YC окружение (после спеки 3.1) ---
cd backend && task migrate:stage    # stage (Lockbox)
cd backend && task migrate:prod     # production (ОСТОРОЖНО!)
cd backend && task deploy           # деплой в YC
cd frontend && task deploy          # деплой в YC S3

# Тесты
cd backend && go test -v ./...
cd frontend && yarn type-check && yarn test
```

## Prerequisites

- Go 1.22+
- Node.js 20+
- Yarn
- Docker + Docker Compose
- [Task](https://taskfile.dev/) (go-task)
- [protoc](https://github.com/protocolbuffers/protobuf/releases) + плагины (protoc-gen-go, protoc-gen-go-grpc, protoc-gen-grpc-web)
- [buf](https://buf.build/)
- [YC CLI](https://cloud.yandex.ru/docs/cli/quickstart) (только для yc-setup)

Все инструменты устанавливаются автоматически: `bash scripts/install-tools.sh`

## Работа с Kiro AI

Шаблон включает steering файлы в `.kiro/steering/`, которые автоматически подгружаются в контекст Kiro по типу файла или по контексту запроса.

## License

MIT
