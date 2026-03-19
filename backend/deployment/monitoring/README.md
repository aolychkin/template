# Security Monitoring - Yandex Managed Service for Prometheus

## Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Go)                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Prometheus Pusher (internal/lib/metrics/)            │  │
│  │  - Immediate mode: отправка СРАЗУ при событии        │  │
│  │  - Асинхронно (go routine) - не блокирует запрос     │  │
│  │  - Prometheus Remote Write API (protobuf + snappy)   │  │
│  │                                                       │  │
│  │ Метрики:                                              │  │
│  │  - failed_login_attempts_total                       │  │
│  │  - account_locked_total                              │  │
│  │  - rate_limit_exceeded_total                         │  │
│  │  - sql_injection_attempts_total                      │  │
│  │  - csrf_validation_failed_total                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          ↓ (HTTP POST, protobuf + snappy)
┌─────────────────────────────────────────────────────────────┐
│         Yandex Managed Service for Prometheus                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Remote Write API                                      │  │
│  │ https://monitoring.api.cloud.yandex.net/prometheus/   │  │
│  │   workspaces/{workspace_id}/api/v1/write             │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Alerting Rules (PromQL)                              │  │
│  │  - MultipleFailedLogins                              │  │
│  │  - AccountLocked                                     │  │
│  │  - SQLInjectionAttempt                               │  │
│  │  - RateLimitExceeded                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Alert Manager → Telegram                             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Настройка

### Шаг 1: Создать сервисный аккаунт с правами на запись

```bash
# Создать service account
yc iam service-account create \
  --name prometheus-writer \
  --folder-id YOUR_FOLDER_ID

# Назначить роль monitoring.editor
yc resource-manager folder add-access-binding YOUR_FOLDER_ID \
  --role monitoring.editor \
  --subject serviceAccount:<SERVICE_ACCOUNT_ID>
```

### Шаг 2: Создать API Key

```bash
yc iam api-key create \
  --service-account-name prometheus-writer \
  --folder-id YOUR_FOLDER_ID
```

### Шаг 3: Сохранить API Key в Lockbox

```bash
yc lockbox secret add-version --id <LOCKBOX_SECRET_ID> \
  --payload '[{"key": "YC_PROMETHEUS_API_KEY", "text_value": "<API_KEY>"}]'
```

### Шаг 4: Переменные окружения контейнера

```bash
# Добавить в deployment/scripts/update-container.sh
YC_PROMETHEUS_WORKSPACE_ID=<YOUR_WORKSPACE_ID>  # ID workspace
YC_PROMETHEUS_API_KEY=<из Lockbox>               # API key
YC_PROMETHEUS_PUSH=true                          # Включить push
```

### Шаг 5: Настроить Alerting в YC Console

1. Перейти в Managed Prometheus workspace
2. Создать Alerting Rules (PromQL) — см. `alerting-rules.yml`
3. Настроить Notification Channel (Telegram)

## Почему Prometheus Remote Write?

**Преимущества:**
- ✅ Стандартный Prometheus формат (PromQL для запросов и алертов)
- ✅ Managed сервис - не нужен свой Prometheus сервер
- ✅ Интеграция с Grafana для визуализации
- ✅ Alert Manager для уведомлений

**Почему Immediate Mode для Serverless:**
- Serverless Container может "заснуть" между запросами
- Буфер с метриками потеряется при остановке контейнера
- Immediate mode: метрика отправляется СРАЗУ при событии
- Отправка асинхронная (go routine) - не блокирует основной запрос

## Метрики

| Метрика | Тип | Labels | Описание |
|---------|-----|--------|----------|
| `failed_login_attempts_total` | Counter | email, ip | Неудачные попытки входа |
| `account_locked_total` | Counter | user_id | Блокировки аккаунтов |
| `rate_limit_exceeded_total` | Counter | user_id, ip, type | Превышения rate limit |
| `sql_injection_attempts_total` | Counter | user_id, ip, relation | Попытки SQL injection |
| `csrf_validation_failed_total` | Counter | - | Неудачные валидации CSRF |

## Просмотр метрик

### В YC Console

1. Перейти в Managed Prometheus → Workspace
2. Открыть Query API или подключить Grafana
3. Использовать PromQL запросы:

```promql
# Все неудачные логины за последний час
sum(increase(failed_login_attempts_total[1h]))

# Топ IP по неудачным логинам
topk(10, sum by (ip) (increase(failed_login_attempts_total[1h])))

# Попытки SQL injection
sql_injection_attempts_total
```

### Через Grafana

1. Добавить Data Source: Prometheus
2. URL: `https://monitoring.api.cloud.yandex.net/prometheus/workspaces/<WORKSPACE_ID>`
3. Auth: Bearer Token (API Key)

## Troubleshooting

### Метрики не появляются

1. Проверить что `YC_PROMETHEUS_PUSH=true`
2. Проверить API key в Lockbox (должен начинаться с `AQVN...`)
3. Проверить логи контейнера
4. Проверить что workspace ID правильный

### Алерты не приходят

1. Проверить что Alerting Rules созданы в YC Console
2. Проверить Notification Channel (Telegram)
3. Проверить что метрики генерируются (сделать тестовый failed login)
