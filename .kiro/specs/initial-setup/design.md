# Initial Project Setup - Design

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Yandex Cloud                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │   Lockbox    │    │  Container   │    │   Object     │          │
│  │   Secrets    │    │  Registry    │    │   Storage    │          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
│         │                   │                   │                   │
│         ▼                   ▼                   ▼                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │  Serverless  │◄───│    Docker    │    │   Frontend   │          │
│  │  Container   │    │    Image     │    │   (S3 SPA)   │          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
│         │                                       │                   │
│         ▼                                       │                   │
│  ┌──────────────┐                              │                   │
│  │ API Gateway  │◄─────────────────────────────┘                   │
│  │  (gRPC-Web)  │                                                  │
│  └──────────────┘                                                  │
│         │                                                          │
│         ▼                                                          │
│  ┌──────────────┐                                                  │
│  │  Managed     │                                                  │
│  │  PostgreSQL  │                                                  │
│  └──────────────┘                                                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Setup Sequence

```
1. Создание ресурсов YC
   ├── Container Registry
   ├── Lockbox Secret
   ├── Managed PostgreSQL
   ├── S3 Buckets (stage + prod)
   └── API Gateway (stage + prod)

2. Конфигурация
   ├── Генерация секретов (JWT, Encryption)
   ├── Добавление секретов в Lockbox
   ├── Обновление PROJECT_NAME в скриптах
   └── Обновление steering файлов

3. Первый деплой
   ├── Миграции БД
   ├── Backend → Serverless Container
   ├── Frontend → S3 Bucket
   └── API Gateway spec update

4. Проверка
   ├── Health check
   ├── Frontend доступен
   └── Авторизация работает
```

## Secrets Structure (Lockbox)

| Key | Description | Example |
|-----|-------------|---------|
| DATABASE_URL | Production PostgreSQL | postgresql://user:pass@host:6432/db_prod?sslmode=require |
| DATABASE_URL_LOCAL | Stage PostgreSQL | postgresql://user:pass@host:6432/db_stage?sslmode=require |
| JWT_SECRET | JWT signing key | 32+ random bytes, base64 |
| ENCRYPTION_KEY | AES-256 key | 32 random bytes, base64 |
| SMTP_HOST | Email server | smtp.example.com |
| SMTP_USER | Email user | noreply@example.com |
| SMTP_PASSWORD | Email password | app-specific password |
| SMTP_FROM | From address | noreply@example.com |

## Environment Selection

```go
// config.go
if cfg.Env == "production" {
    // USE_LOCAL_DB = false → DATABASE_URL
} else {
    // USE_LOCAL_DB = true → DATABASE_URL_LOCAL
}
```

## Correctness Properties

### Property 1: Secret Isolation
*Для любого* секрета в Lockbox, он НЕ должен присутствовать в:
- .env файлах в репозитории
- Docker образах
- Логах приложения

**Validates:** Requirements 2.2.3

### Property 2: Environment Separation
*Для любого* запроса к stage окружению, он НЕ должен затрагивать production данные.

**Validates:** Requirements 1.2.1

### Property 3: SSL Enforcement
*Для любого* соединения с PostgreSQL, оно ДОЛЖНО использовать SSL.

**Validates:** Requirements 1.2.2

### Property 4: Port Compliance
*Для любого* Serverless Container, он ДОЛЖЕН слушать порт 8080.

**Validates:** Requirements 3.1.4

## Testing Strategy

### Manual Verification
- Health check endpoint
- Frontend accessibility
- Login flow

### Automated Checks
- `go build` - backend компилируется
- `yarn type-check` - frontend компилируется
- `yarn lint` - нет ошибок линтера
