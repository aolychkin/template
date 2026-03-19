#!/bin/bash

# Скрипт обновления контейнера в Yandex Cloud Serverless Containers
# Адаптируйте переменные под свой проект

set -e

cd "$(dirname "$0")/../.."

# ===== КОНФИГУРАЦИЯ (ИЗМЕНИТЕ ПОД СВОЙ ПРОЕКТ) =====
PROJECT_NAME="my-project"                    # Имя проекта
REGISTRY_NAME="${PROJECT_NAME}-registry"     # Container Registry
LOCKBOX_SECRET_NAME="${PROJECT_NAME}-secrets" # Lockbox секрет
# ===================================================

FOLDER_ID=$(yc config get folder-id)

# Выбор окружения
echo "🎯 Выбор окружения для деплоя"
echo "⏱️  Автоматически stage через 5 секунд..."
read -t 5 -p "Публикуем production версию? (да/нет): " DEPLOY_PROD || DEPLOY_PROD="нет"

if [[ "$DEPLOY_PROD" == "да" || "$DEPLOY_PROD" == "yes" || "$DEPLOY_PROD" == "y" ]]; then
    ENV="production"
    CONTAINER_NAME="${PROJECT_NAME}-api"
    echo "🔴 PRODUCTION режим"
else
    ENV="stage"
    CONTAINER_NAME="${PROJECT_NAME}-api-stage"
    echo "🟡 STAGE режим"
fi

# Миграции
echo ""
read -p "Запустить миграции? (да/нет) [нет]: " RUN_MIGRATIONS
RUN_MIGRATIONS=${RUN_MIGRATIONS:-нет}

if [[ "$RUN_MIGRATIONS" == "да" || "$RUN_MIGRATIONS" == "yes" || "$RUN_MIGRATIONS" == "y" ]]; then
    echo "🗄️  Запуск миграций ($ENV)..."
    
    if [ "$ENV" = "production" ]; then
        DB_URL=$(yc lockbox payload get $LOCKBOX_SECRET_NAME --key DATABASE_URL --folder-id $FOLDER_ID 2>/dev/null | tr -d '\n')
    else
        DB_URL=$(yc lockbox payload get $LOCKBOX_SECRET_NAME --key DATABASE_URL_LOCAL --folder-id $FOLDER_ID 2>/dev/null | tr -d '\n')
    fi

    if [ -z "$DB_URL" ]; then
        echo "⚠️  Не удалось получить DATABASE_URL из Lockbox"
    else
        DATABASE_URL="$DB_URL" ENV=$ENV go run cmd/migrate/main.go
        echo "✅ Миграции завершены"
    fi
else
    echo "⏭️  Миграции пропущены"
fi

IMAGE_NAME="${PROJECT_NAME}-api"
VERSION=${1:-$(date +%Y%m%d-%H%M%S)}

echo ""
echo "🔄 Обновление $PROJECT_NAME API"
echo "📝 Версия: $VERSION"
echo "🌍 Окружение: $ENV"

# Registry
REGISTRY_ID=$(yc container registry get $REGISTRY_NAME --folder-id $FOLDER_ID --format json | jq -r '.id')

# Сборка
echo "📦 Сборка Docker образа..."
docker build --platform linux/amd64 -t ${IMAGE_NAME}:${VERSION} .

YC_IMAGE="cr.yandex/${REGISTRY_ID}/${IMAGE_NAME}:${VERSION}"
docker tag ${IMAGE_NAME}:${VERSION} ${YC_IMAGE}

echo "📤 Загрузка образа..."
docker push ${YC_IMAGE}

# Service Account и Lockbox
SERVICE_ACCOUNT_ID=$(yc iam service-account get ${PROJECT_NAME}-sa --folder-id $FOLDER_ID --format json | jq -r '.id')
SECRET_ID=$(yc lockbox secret get $LOCKBOX_SECRET_NAME --folder-id $FOLDER_ID --format json | jq -r '.id')

# Деплой
echo "🚀 Развертывание новой ревизии ($ENV)..."
yc serverless container revision deploy \
  --container-name $CONTAINER_NAME \
  --image $YC_IMAGE \
  --cores 1 \
  --memory 1GB \
  --concurrency 10 \
  --execution-timeout 60s \
  --service-account-id $SERVICE_ACCOUNT_ID \
  --environment ENV=$ENV \
  --environment HTTP_PORT=:8080 \
  --secret environment-variable=JWT_SECRET,id=$SECRET_ID,key=JWT_SECRET \
  --secret environment-variable=ENCRYPTION_KEY,id=$SECRET_ID,key=ENCRYPTION_KEY \
  --secret environment-variable=DATABASE_URL,id=$SECRET_ID,key=DATABASE_URL \
  --secret environment-variable=DATABASE_URL_LOCAL,id=$SECRET_ID,key=DATABASE_URL_LOCAL \
  --folder-id $FOLDER_ID

# Публичный доступ для stage
if [ "$ENV" = "stage" ]; then
    echo "🔓 Разрешение публичного доступа..."
    yc serverless container allow-unauthenticated-invoke $CONTAINER_NAME --folder-id $FOLDER_ID
fi

CONTAINER_URL=$(yc serverless container get $CONTAINER_NAME --folder-id $FOLDER_ID --format json | jq -r '.url')

echo ""
echo "✅ Обновление завершено!"
echo "🌍 Окружение: $ENV"
echo "📦 Контейнер: $CONTAINER_NAME"
echo "🌐 URL: $CONTAINER_URL"
