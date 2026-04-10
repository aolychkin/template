---
inclusion: auto
name: yc-operations
description: Yandex Cloud operations, resource IDs, and common YC CLI commands. Use when deploying, managing cloud resources, or troubleshooting YC infrastructure.
---

> Этот файл содержит информацию о ресурсах YC и частые команды.
> Заполняется после настройки инфраструктуры.

## Ресурсы

<!-- TODO: Заполнить после создания ресурсов -->

### Контейнеры (Serverless Containers)
| Окружение | Контейнер | ID |
|-----------|-----------|-----|
| Stage | my-project-api-stage | <!-- TODO --> |
| Production | my-project-api | <!-- TODO --> |

### API Gateway
| Окружение | ID | URL |
|-----------|-----|-----|
| Stage | <!-- TODO --> | <!-- TODO --> |
| Production | <!-- TODO --> | <!-- TODO --> |

### S3 Buckets (Frontend)
| Окружение | Bucket | URL |
|-----------|--------|-----|
| Stage | my-project-frontend-stage | <!-- TODO --> |
| Production | my-project-frontend-prod | <!-- TODO --> |

### PostgreSQL
| БД | Назначение |
|----|------------|
| my_project | Stage (тестовая) |
| my_project_prod | Production |

Хост: `<!-- TODO: Managed PostgreSQL host -->`

### Lockbox
Секрет: `my-project-secrets`

**Ключи:**
- `DATABASE_URL` → production БД
- `DATABASE_URL_LOCAL` → stage БД
- `JWT_SECRET`, `ENCRYPTION_KEY`
- `SMTP_*` (email)


## Частые команды

### Проверка контейнера
```bash
# Список ревизий
yc serverless container revision list --container-name my-project-api --format json

# Health check
curl -s "https://<API_GATEWAY_URL>/health"
```

### Lockbox
```bash
# Просмотр секретов
yc lockbox payload get my-project-secrets --format json | jq -r '.entries[] | "\(.key): \(.text_value | .[0:30])..."'

# Обновление секрета (добавление новой версии)
echo '[{"key": "KEY_NAME", "text_value": "new_value"}]' | yc lockbox secret add-version my-project-secrets --payload -
```

### S3 Bucket
```bash
# Проверка настроек
yc storage bucket get my-project-frontend-prod --format json

# Включение website hosting (SPA routing)
yc storage bucket update my-project-frontend-prod --website-settings-from-file /dev/stdin << 'EOF'
{
  "index": "index.html",
  "error": "index.html"
}
EOF

# Список файлов
yc storage s3api list-objects --bucket my-project-frontend-prod --format json | jq -r '.contents[].key'
```

## Деплой

### Backend
```bash
cd backend && task deploy
# Выбрать "да" для production, "нет" для stage
```

### Frontend
```bash
cd frontend && ./deployment/scripts/deploy-frontend.sh
# Выбрать "да" для production, "нет" для stage
```

## Типичные проблемы и решения

### 502 Bad Gateway
1. **Проверить логи контейнера** в YC Console
2. **HTTP_PORT** - контейнер должен слушать `:8080` (YC Serverless требует)
3. **DATABASE_URL** - проверить что указывает на правильную БД
4. **Миграции** - если падает на AutoMigrate, проверить что таблицы не конфликтуют

### 404 на SPA роутах (/login, /register)
**Причина:** S3 bucket не настроен для SPA routing

**Решение:**
```bash
yc storage bucket update BUCKET_NAME --website-settings-from-file /dev/stdin << 'EOF'
{
  "index": "index.html",
  "error": "index.html"
}
EOF
```

### Stage и Production используют одну БД
**Проверка:**
```bash
yc lockbox payload get my-project-secrets --format json | jq -r '.entries[] | select(.key | contains("DATABASE"))'
```

**Должно быть:**
- `DATABASE_URL` → production БД
- `DATABASE_URL_LOCAL` → stage БД

### Контейнер не подхватывает новые секреты
После обновления Lockbox нужно **передеплоить контейнер** - он читает секреты при старте.

## Логика выбора БД (config.go)

```
ENV=stage     → USE_LOCAL_DB=true  → DATABASE_URL_LOCAL (stage)
ENV=production → USE_LOCAL_DB=false → DATABASE_URL (production)
```

## Важно помнить

1. **HTTP_PORT=:8080** обязателен для YC Serverless Containers
2. **Website settings** нужны для SPA routing в S3
3. **Lockbox версии** - после обновления секрета создаётся новая версия, контейнер нужно передеплоить
4. **Миграции** - не должны падать с panic на существующих таблицах
5. **CORS** - AllowedOrigins должны включать frontend URL и API Gateway URL
