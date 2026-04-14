#!/bin/bash

# Скрипт первоначального развертывания в Yandex Cloud
# Адаптируйте переменные под свой проект

set -e

# Переходим в корень проекта (где Dockerfile)
cd "$(dirname "$0")/../.."

# ===== КОНФИГУРАЦИЯ (ИЗМЕНИТЕ ПОД СВОЙ ПРОЕКТ) =====
PROJECT_NAME="my-project"
REGISTRY_NAME="${PROJECT_NAME}-registry"
CONTAINER_NAME="${PROJECT_NAME}-api"
SERVICE_ACCOUNT_NAME="${PROJECT_NAME}-sa"
# ===================================================

IMAGE_NAME="${PROJECT_NAME}-api"
VERSION=$(date +%Y%m%d-%H%M%S)

echo "🚀 Первоначальное развертывание ${PROJECT_NAME} API в Yandex Cloud"
echo "📝 Версия: $VERSION"

# Получаем folder-id
FOLDER_ID=$(yc config get folder-id)
if [ -z "$FOLDER_ID" ]; then
    echo "❌ Не удалось получить folder-id. Выполните: yc init"
    exit 1
fi

echo "📁 Folder ID: $FOLDER_ID"

# 1. Создаем Container Registry
echo "📦 Создание Container Registry..."
yc container registry create --name $REGISTRY_NAME --folder-id $FOLDER_ID 2>/dev/null || echo "Registry уже существует"
REGISTRY_ID=$(yc container registry get $REGISTRY_NAME --folder-id $FOLDER_ID --format json | jq -r '.id')
echo "✅ Registry ID: $REGISTRY_ID"

# 2. Настраиваем Docker
echo "🔐 Настройка Docker..."
yc container registry configure-docker

# 3. Собираем образ
echo "📦 Сборка Docker образа..."
docker build --platform linux/amd64 -t ${IMAGE_NAME}:${VERSION} .

# 4. Тегируем и загружаем
YC_IMAGE="cr.yandex/${REGISTRY_ID}/${IMAGE_NAME}:${VERSION}"
docker tag ${IMAGE_NAME}:${VERSION} ${YC_IMAGE}

echo "📤 Загрузка образа в registry..."
docker push ${YC_IMAGE}

# 5. Создаем Service Account
echo "🔐 Создание Service Account..."
yc iam service-account create --name $SERVICE_ACCOUNT_NAME --folder-id $FOLDER_ID 2>/dev/null || echo "Service Account уже существует"
SERVICE_ACCOUNT_ID=$(yc iam service-account get $SERVICE_ACCOUNT_NAME --folder-id $FOLDER_ID --format json | jq -r '.id')
echo "✅ Service Account ID: $SERVICE_ACCOUNT_ID"

# Назначаем права
echo "🔐 Назначение прав..."
yc resource-manager folder add-access-binding $FOLDER_ID \
  --role container-registry.images.puller \
  --subject serviceAccount:$SERVICE_ACCOUNT_ID 2>/dev/null || echo "Права уже назначены"

yc resource-manager folder add-access-binding $FOLDER_ID \
  --role lockbox.payloadViewer \
  --subject serviceAccount:$SERVICE_ACCOUNT_ID 2>/dev/null || echo "Права Lockbox уже назначены"

# 6. Создаем секреты
echo ""
echo "🔐 Создание секретов..."
echo "⚠️  ВАЖНО: Добавьте секреты вручную через Yandex Cloud Console:"
echo "   1. Перейдите в Lockbox"
echo "   2. Создайте секрет '${PROJECT_NAME}-secrets'"
echo "   3. Добавьте ключи: DATABASE_URL, DATABASE_URL_LOCAL, JWT_SECRET, ENCRYPTION_KEY"
echo ""
read -p "Нажмите Enter когда секреты будут созданы..."

# 7. Создаем контейнер
echo "📦 Создание Serverless Container..."
yc serverless container create --name $CONTAINER_NAME --folder-id $FOLDER_ID 2>/dev/null || echo "Container уже существует"

# 8. Развертываем ревизию
echo "🚀 Развертывание ревизии..."
yc serverless container revision deploy \
  --container-name $CONTAINER_NAME \
  --image $YC_IMAGE \
  --cores 1 \
  --memory 1GB \
  --concurrency 10 \
  --execution-timeout 60s \
  --service-account-id $SERVICE_ACCOUNT_ID \
  --environment ENVIRONMENT=production \
  --environment HTTP_PORT=:8080 \
  --environment USE_LOCAL_DB=false \
  --folder-id $FOLDER_ID

# 9. Разрешаем публичный доступ (временно для тестирования)
echo "🌐 Разрешение публичного доступа..."
yc serverless container allow-unauthenticated-invoke $CONTAINER_NAME --folder-id $FOLDER_ID

# Получаем URL
CONTAINER_URL=$(yc serverless container get $CONTAINER_NAME --folder-id $FOLDER_ID --format json | jq -r '.url')

echo ""
echo "✅ Развертывание завершено!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 URL контейнера: $CONTAINER_URL"
echo ""
echo "📋 Следующие шаги:"
echo "   1. Подключи секреты к контейнеру в консоли Yandex Cloud"
echo "   2. Создай stage контейнер: ./deployment/scripts/2-setup-stage.sh"
echo "   3. Обновления: ./deployment/scripts/update-container.sh"
