# Развертывание в Yandex Cloud

## 🔧 Подготовка

### 1. Установите Yandex Cloud CLI
```bash
curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash
```

### 2. Авторизация
```bash
yc init
```

### 3. Установите jq (для парсинга JSON)
```bash
# macOS
brew install jq

# Linux
sudo apt-get install jq
```

## 🚀 Первоначальное развертывание

### Автоматическое развертывание
```bash
cd deployment/scripts
chmod +x *.sh
./1-initial-deploy.sh
```

### Что делает скрипт:
1. ✅ Создает Container Registry
2. ✅ Собирает Docker образ
3. ✅ Загружает образ в registry
4. ✅ Создает Service Account с правами
5. ✅ Создает Serverless Container
6. ✅ Развертывает первую ревизию
7. ✅ Разрешает публичный доступ

## 🔐 Настройка секретов (Lockbox)

### ⚠️ ВАЖНО: Создавай секреты ВРУЧНУЮ в Yandex Cloud Console

1. Перейди в **Lockbox**: https://console.cloud.yandex.ru/folders/YOUR_FOLDER/lockbox
2. Создай секрет с именем `my-project-secrets` (или своим)
3. Добавь ключи (UPPERCASE!):
   - `DATABASE_URL` = `postgresql://user:PASSWORD@HOST:6432/dbname?sslmode=require`
   - `DATABASE_URL_LOCAL` = (для stage окружения)
   - `JWT_SECRET` = (сгенерируй: `openssl rand -base64 64`)
   - `ENCRYPTION_KEY` = (сгенерируй: `openssl rand -base64 32`)

### Подключение секретов к контейнеру:

1. Открой **Serverless Containers**: https://console.cloud.yandex.ru/folders/YOUR_FOLDER/serverless-containers
2. Найди контейнер `my-project-api`
3. Нажми **"Создать ревизию"**
4. В разделе **"Секреты"** → **"Добавить секрет"**
5. Выбери свой секрет
6. Добавь переменные:
   - `DATABASE_URL` → ключ `DATABASE_URL`
   - `JWT_SECRET` → ключ `JWT_SECRET`
   - `ENCRYPTION_KEY` → ключ `ENCRYPTION_KEY`
7. **"Создать"**

## 🔄 Обновление контейнера

```bash
# Интерактивный выбор stage/production
./deployment/scripts/update-container.sh

# С конкретной версией
./deployment/scripts/update-container.sh v1.2.0
```

## 🌐 API Gateway (рекомендуется для production)

### Создание gateway:
```bash
# Stage
yc serverless api-gateway create \
  --name my-project-gateway-stage \
  --spec-file deployment/api-gateway/stage.yaml

# Production
yc serverless api-gateway create \
  --name my-project-gateway-prod \
  --spec-file deployment/api-gateway/production.yaml
```

### Обновление gateway:
```bash
yc serverless api-gateway update \
  --name my-project-gateway-stage \
  --spec-file deployment/api-gateway/stage.yaml
```

## 📊 Мониторинг

### Логи контейнера
```bash
# Последние логи
yc serverless container revision logs <REVISION_ID>

# Логи в реальном времени
yc serverless container revision logs <REVISION_ID> --follow
```

### Метрики
```bash
# Дашборд в консоли
https://console.cloud.yandex.ru/folders/<FOLDER_ID>/monitoring
```

## 🔒 Безопасность

### Production checklist:
- [ ] Секреты в Lockbox (не в переменных окружения)
- [ ] Service Account с минимальными правами
- [ ] API Gateway для CORS и аутентификации
- [ ] Отключить публичный доступ к контейнеру (только через API Gateway)
- [ ] Настроить CORS только для production домена
- [ ] Включить логирование всех запросов
- [ ] Настроить алерты на ошибки

### Отключение публичного доступа:
```bash
yc serverless container revoke-unauthenticated-invoke my-project-api
```

## 💰 Оптимизация затрат

### Рекомендуемые параметры:
- **Cores**: 1 (достаточно для старта)
- **Memory**: 1GB (можно уменьшить до 512MB после тестирования)
- **Concurrency**: 10 (количество одновременных запросов)
- **Timeout**: 60s (можно уменьшить до 30s)

## 🔄 Откат к предыдущей версии

```bash
# Список ревизий
yc serverless container revision list --container-name my-project-api

# Откат
yc serverless container revision set-traffic \
  --container-name my-project-api \
  --revision-id <OLD_REVISION_ID> \
  --percent 100
```

## 🐛 Troubleshooting

### Контейнер не запускается
```bash
# Проверить логи
yc serverless container revision logs <REVISION_ID>

# Проверить переменные окружения
yc serverless container revision get <REVISION_ID>
```

### Ошибки подключения к БД
- Проверьте DATABASE_URL в секретах
- Убедитесь что Service Account имеет доступ к Lockbox
- Проверьте сетевые настройки PostgreSQL

### Timeout ошибки
- Увеличьте `executionTimeout` до 120s
- Оптимизируйте медленные запросы к БД
- Добавьте индексы в PostgreSQL

## 📝 Полезные команды

```bash
# Информация о контейнере
yc serverless container get my-project-api

# Список ревизий
yc serverless container revision list --container-name my-project-api

# Удалить старые ревизии
yc serverless container revision delete <REVISION_ID>

# Статистика использования
yc serverless container revision get <REVISION_ID> --full
```
