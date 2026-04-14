#!/bin/bash

# Скрипт создания stage контейнера (выполнять ПОСЛЕ 1-initial-deploy.sh)
# Адаптируйте переменные под свой проект

set -e

cd "$(dirname "$0")/../.."

# ===== КОНФИГУРАЦИЯ (ИЗМЕНИТЕ ПОД СВОЙ ПРОЕКТ) =====
PROJECT_NAME="my-project"
REGISTRY_NAME="${PROJECT_NAME}-registry"
CONTAINER_NAME="${PROJECT_NAME}-api-stage"
SERVICE_ACCOUNT_NAME="${PROJECT_NAME}-sa"
# ===================================================

IMAGE_NAME="${PROJECT_NAME}-api"
VERSION=$(date +%Y%m%d-%H%M%S)

echo "🎯 Создание stage контейнера"
echo "📝 Версия: $VERSION"

# Получаем folder-id
FOLDER_ID=$(yc config get folder-id)
if [ -z "$FOLDER_ID" ]; then
    echo "❌ Не удалось получить folder-id. Выполните: yc init"
    exit 1
fi

echo "📁 Folder ID: $FOLDER_ID"

# Получаем Registry ID
REGISTRY_ID=$(yc container registry get $REGISTRY_NAME --folder-id $FOLDER_ID --format json | jq -r '.id')
if [ -z "$REGISTRY_ID" ]; then
    echo "❌ Registry не найден. Сначала выполните: ./1-initial-deploy.sh"
    exit 1
fi

echo "✅ Registry ID: $REGISTRY_ID"

# Собираем образ
echo "📦 Сборка Docker образа для stage..."
docker build --platform linux/amd64 -t ${IMAGE_NAME}:${VERSION} .

# Тегируем и загружаем
YC_IMAGE="cr.yandex/${REGISTRY_ID}/${IMAGE_NAME}:${VERSION}"
docker tag ${IMAGE_NAME}:${VERSION} ${YC_IMAGE}

echo "📤 Загрузка образа в registry..."
docker push ${YC_IMAGE}

# Получаем Service Account ID
SERVICE_ACCOUNT_ID=$(yc iam service-account get $SERVICE_ACCOUNT_NAME --folder-id $FOLDER_ID --format json | jq -r '.id')
if [ -z "$SERVICE_ACCOUNT_ID" ]; then
    echo "❌ Service Account не найден. Сначала выполните: ./1-initial-deploy.sh"
    exit 1
fi

echo "✅ Service Account ID: $SERVICE_ACCOUNT_ID"

# Создаем stage контейнер
echo "📦 Создание stage контейнера..."
yc serverless container create --name $CONTAINER_NAME --folder-id $FOLDER_ID 2>/dev/null || echo "Stage контейнер уже существует"

# Развертываем ревизию
echo "🚀 Развертывание ревизии в stage..."
yc serverless container revision deploy \
  --container-name $CONTAINER_NAME \
  --image $YC_IMAGE \
  --cores 1 \
  --memory 1GB \
  --concurrency 10 \
  --execution-timeout 60s \
  --service-account-id $SERVICE_ACCOUNT_ID \
  --environment ENVIRONMENT=stage \
  --environment HTTP_PORT=:8080 \
  --environment USE_LOCAL_DB=true \
  --folder-id $FOLDER_ID

# Разрешаем публичный доступ
echo "🌐 Разрешение публичного доступа..."
yc serverless container allow-unauthenticated-invoke $CONTAINER_NAME --folder-id $FOLDER_ID

# Получаем URL
STAGE_URL=$(yc serverless container get $CONTAINER_NAME --folder-id $FOLDER_ID --format json | jq -r '.url')

echo ""
echo "✅ Stage контейнер создан и задеплоен!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Stage URL: $STAGE_URL"
echo ""
echo "📋 Следующие шаги:"
echo "   1. Подключи секреты к stage контейнеру в консоли Yandex Cloud"
echo "   2. Создай API Gateway: yc serverless api-gateway create --spec-file deployment/api-gateway/stage.yaml"
echo "   3. Обновления: ./deployment/scripts/update-container.sh (выбери 'нет')"
