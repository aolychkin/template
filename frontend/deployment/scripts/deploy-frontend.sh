#!/bin/bash

# Скрипт деплоя frontend в Yandex Object Storage
# Адаптируйте переменные под свой проект

set -e

cd "$(dirname "$0")/../.."

# ===== КОНФИГУРАЦИЯ (ИЗМЕНИТЕ ПОД СВОЙ ПРОЕКТ) =====
PROJECT_NAME="my-project"

# Stage
STAGE_BUCKET="${PROJECT_NAME}-frontend-stage"
STAGE_API_GATEWAY="https://YOUR_STAGE_GATEWAY.apigw.yandexcloud.net"

# Production
PROD_BUCKET="${PROJECT_NAME}-frontend-prod"
PROD_API_GATEWAY="https://YOUR_PROD_GATEWAY.apigw.yandexcloud.net"
# ===================================================

# Выбор окружения
echo "🎯 Выбор окружения для деплоя"
echo "⏱️  Автоматически stage через 5 секунд..."
read -t 5 -p "Публикуем production версию? (да/нет): " DEPLOY_PROD || DEPLOY_PROD="нет"

if [[ "$DEPLOY_PROD" == "да" || "$DEPLOY_PROD" == "yes" || "$DEPLOY_PROD" == "y" ]]; then
    ENV="production"
    BUCKET_NAME="$PROD_BUCKET"
    API_GATEWAY="$PROD_API_GATEWAY"
    echo "🔴 PRODUCTION режим"
else
    ENV="stage"
    BUCKET_NAME="$STAGE_BUCKET"
    API_GATEWAY="$STAGE_API_GATEWAY"
    echo "🟡 STAGE режим"
fi

BUCKET_URL="https://${BUCKET_NAME}.website.yandexcloud.net"

echo ""
echo "🔄 Деплой Frontend"
echo "🌍 Окружение: $ENV"
echo "🪣 Bucket: $BUCKET_NAME"

# Проверка bucket
echo "🔍 Проверка bucket..."
if ! yc storage bucket get $BUCKET_NAME &>/dev/null; then
    echo "📦 Создание bucket..."
    yc storage bucket create \
      --name $BUCKET_NAME \
      --default-storage-class standard \
      --public-read \
      --public-list
fi

# Website settings (SPA routing)
echo "🌐 Настройка website..."
WEBSITE_SETTINGS_FILE=$(mktemp)
echo '{"index": "index.html", "error": "index.html"}' > "$WEBSITE_SETTINGS_FILE"
yc storage bucket update $BUCKET_NAME --website-settings-from-file "$WEBSITE_SETTINGS_FILE"
rm -f "$WEBSITE_SETTINGS_FILE"

# Очистка и сборка
echo "🧹 Очистка кеша..."
rm -rf node_modules/.vite/ dist/

echo "📦 Сборка frontend ($ENV)..."
if [ "$ENV" = "production" ]; then
    yarn build --mode production
else
    yarn build --mode stage
fi

# SPA роуты
echo "📄 Создание SPA роутов..."
SPA_ROUTES=("login" "register" "profile")
for ROUTE in "${SPA_ROUTES[@]}"; do
    mkdir -p "dist/$ROUTE"
    cp dist/index.html "dist/$ROUTE/index.html"
done

# Очистка bucket
echo "🧹 Очистка bucket..."
OBJECTS=$(yc storage s3api list-objects --bucket $BUCKET_NAME --format json 2>/dev/null | jq -r '.contents[].key // empty')
if [ -n "$OBJECTS" ]; then
    for KEY in $OBJECTS; do
        yc storage s3api delete-object --bucket $BUCKET_NAME --key "$KEY" >/dev/null 2>&1 || true
    done
fi

# Загрузка файлов
echo "📤 Загрузка файлов..."
find dist -type f ! -name "*.map" | while read FILE; do
    KEY="${FILE#dist/}"
    
    case "$FILE" in
        *.js|*.mjs) CONTENT_TYPE="application/javascript"; CACHE="public, max-age=31536000, immutable" ;;
        *.css)      CONTENT_TYPE="text/css"; CACHE="public, max-age=31536000, immutable" ;;
        *.html)     CONTENT_TYPE="text/html"; CACHE="no-cache, no-store, must-revalidate" ;;
        *.json)     CONTENT_TYPE="application/json"; CACHE="public, max-age=3600" ;;
        *.png)      CONTENT_TYPE="image/png"; CACHE="public, max-age=31536000" ;;
        *.svg)      CONTENT_TYPE="image/svg+xml"; CACHE="public, max-age=31536000" ;;
        *)          CONTENT_TYPE="application/octet-stream"; CACHE="public, max-age=3600" ;;
    esac
    
    yc storage s3api put-object \
        --bucket $BUCKET_NAME \
        --key "$KEY" \
        --body "$FILE" \
        --content-type "$CONTENT_TYPE" \
        --acl public-read \
        --cache-control "$CACHE" >/dev/null
    echo "  ✓ $KEY"
done

echo ""
echo "✅ Деплой завершён!"
echo "🌐 Frontend: $BUCKET_URL"
echo "🔗 API: $API_GATEWAY"
