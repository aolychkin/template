# Update container in Yandex Cloud Serverless Containers (PowerShell)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$ScriptDir/../.."

# ===== CONFIGURATION (CHANGE FOR YOUR PROJECT) =====
$PROJECT_NAME = "my-project"
$REGISTRY_NAME = "$PROJECT_NAME-registry"
$LOCKBOX_SECRET_NAME = "$PROJECT_NAME-secrets"
# ===================================================

$FOLDER_ID = yc config get folder-id

# Environment selection
Write-Host "Select deployment environment"
$DEPLOY_PROD = Read-Host "Deploy production version? (yes/no) [no]"
if (-not $DEPLOY_PROD) { $DEPLOY_PROD = "no" }

if ($DEPLOY_PROD -eq "yes" -or $DEPLOY_PROD -eq "y") {
    $ENV_NAME = "production"
    $CONTAINER_NAME = "$PROJECT_NAME-api"
    Write-Host "PRODUCTION mode"
} else {
    $ENV_NAME = "stage"
    $CONTAINER_NAME = "$PROJECT_NAME-api-stage"
    Write-Host "STAGE mode"
}

# Migrations
Write-Host ""
$RUN_MIGRATIONS = Read-Host "Run migrations? (yes/no) [no]"
if (-not $RUN_MIGRATIONS) { $RUN_MIGRATIONS = "no" }

if ($RUN_MIGRATIONS -eq "yes" -or $RUN_MIGRATIONS -eq "y") {
    Write-Host "Running migrations ($ENV_NAME)..."

    if ($ENV_NAME -eq "production") {
        $DB_URL = (yc lockbox payload get $LOCKBOX_SECRET_NAME --key DATABASE_URL --folder-id $FOLDER_ID 2>$null).Trim()
    } else {
        $DB_URL = (yc lockbox payload get $LOCKBOX_SECRET_NAME --key DATABASE_URL_LOCAL --folder-id $FOLDER_ID 2>$null).Trim()
    }

    if (-not $DB_URL) {
        Write-Host "WARNING: Failed to get DATABASE_URL from Lockbox"
    } else {
        $env:DATABASE_URL = $DB_URL
        $env:ENV = $ENV_NAME
        go run cmd/migrate/main.go
        Write-Host "Migrations complete"
    }
} else {
    Write-Host "Migrations skipped"
}

$IMAGE_NAME = "$PROJECT_NAME-api"
if ($args.Count -gt 0) { $VERSION = $args[0] } else { $VERSION = Get-Date -Format "yyyyMMdd-HHmmss" }

Write-Host ""
Write-Host "Updating $PROJECT_NAME API"
Write-Host "Version: $VERSION"
Write-Host "Environment: $ENV_NAME"

$registryJson = yc container registry get $REGISTRY_NAME --folder-id $FOLDER_ID --format json | ConvertFrom-Json
$REGISTRY_ID = $registryJson.id

Write-Host "Building Docker image..."
docker build --platform linux/amd64 -t "${IMAGE_NAME}:${VERSION}" .

$YC_IMAGE = "cr.yandex/$REGISTRY_ID/${IMAGE_NAME}:${VERSION}"
docker tag "${IMAGE_NAME}:${VERSION}" $YC_IMAGE

Write-Host "Pushing image..."
docker push $YC_IMAGE

$saJson = yc iam service-account get "$PROJECT_NAME-sa" --folder-id $FOLDER_ID --format json | ConvertFrom-Json
$SERVICE_ACCOUNT_ID = $saJson.id
$secretJson = yc lockbox secret get $LOCKBOX_SECRET_NAME --folder-id $FOLDER_ID --format json | ConvertFrom-Json
$SECRET_ID = $secretJson.id

Write-Host "Deploying new revision ($ENV_NAME)..."
yc serverless container revision deploy `
  --container-name $CONTAINER_NAME `
  --image $YC_IMAGE `
  --cores 1 `
  --memory 1GB `
  --concurrency 10 `
  --execution-timeout 60s `
  --service-account-id $SERVICE_ACCOUNT_ID `
  --environment "ENV=$ENV_NAME" `
  --environment "HTTP_PORT=:8080" `
  --secret "environment-variable=JWT_SECRET,id=$SECRET_ID,key=JWT_SECRET" `
  --secret "environment-variable=ENCRYPTION_KEY,id=$SECRET_ID,key=ENCRYPTION_KEY" `
  --secret "environment-variable=DATABASE_URL,id=$SECRET_ID,key=DATABASE_URL" `
  --secret "environment-variable=DATABASE_URL_LOCAL,id=$SECRET_ID,key=DATABASE_URL_LOCAL" `
  --folder-id $FOLDER_ID

if ($ENV_NAME -eq "stage") {
    Write-Host "Allowing public access..."
    yc serverless container allow-unauthenticated-invoke $CONTAINER_NAME --folder-id $FOLDER_ID
}

$containerJson = yc serverless container get $CONTAINER_NAME --folder-id $FOLDER_ID --format json | ConvertFrom-Json
$CONTAINER_URL = $containerJson.url

Write-Host ""
Write-Host "Update complete!"
Write-Host "Environment: $ENV_NAME"
Write-Host "Container: $CONTAINER_NAME"
Write-Host "URL: $CONTAINER_URL"
