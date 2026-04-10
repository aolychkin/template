# Настройка YC окружения — Design

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
1. Подготовка YC CLI
   ├── yc init
   └── Service Account + права

2. Создание ресурсов
   ├── Container Registry
   ├── Lockbox Secret
   ├── Managed PostgreSQL (stage + prod)
   ├── S3 Buckets (stage + prod)
   └── API Gateway (stage + prod)

3. Настройка секретов в Lockbox
   ├── DATABASE_URL (production)
   ├── DATABASE_URL_LOCAL (stage)
   ├── JWT_SECRET
   ├── ENCRYPTION_KEY
   └── SMTP_* (опционально)

4. Первый деплой
   ├── Миграции БД
   ├── Backend → Serverless Container
   ├── Frontend → S3 Bucket
   └── API Gateway spec update

5. Проверка
   ├── Health check
   ├── Frontend доступен
   └── Авторизация работает

6. Документация
   └── yc-operations.md с реальными ID
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

## Correctness Properties

### Property 1: Secret Isolation
*Для любого* секрета в Lockbox, он НЕ должен присутствовать в:
- .env файлах в репозитории
- Docker образах
- Логах приложения

**Validates:** Requirement 4

### Property 2: Environment Separation
*Для любого* запроса к stage окружению, он НЕ должен затрагивать production данные.

**Validates:** Requirement 3

### Property 3: SSL Enforcement
*Для любого* соединения с PostgreSQL в YC, оно ДОЛЖНО использовать SSL.

**Validates:** Requirement 3

### Property 4: Port Compliance
*Для любого* Serverless Container, он ДОЛЖЕН слушать порт 8080.

**Validates:** Requirement 6

## Testing Strategy

### Manual Verification
- Health check endpoint: `curl https://<API_GATEWAY_URL>/health`
- Frontend accessibility: открыть URL в браузере
- Login flow: войти тестовым пользователем
