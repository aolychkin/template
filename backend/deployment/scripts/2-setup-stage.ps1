# Create stage container (PowerShell)
# Run AFTER 1-initial-deploy.ps1

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$ScriptDir/../.."

# ===== CONFIGURATION (CHANGE FOR YOUR PROJECT) =====
$PROJECT_NAME = "my-project"
$REGISTRY_NAME = "$PROJECT_NAME-registry"
$CONTAINER_NAME = "$PROJECT_NAME-api-stage"
$SERVICE_ACCOUNT_NAME = "$PROJECT_NAME-sa"
# ===================================================

$IMAGE_NAME = "$PROJECT_NAME-api"
$VERSION = Get-Date -Format "yyyyMMdd-HHmmss"

Write-Host "Creating stage container"
Write-Host "Version: $VERSION"

$FOLDER_ID = yc config get folder-id
if (-not $FOLDER_ID) {
    Write-Error "Failed to get folder-id. Run: yc init"
    exit 1
}

Write-Host "Folder ID: $FOLDER_ID"

$registryJson = yc container registry get $REGISTRY_NAME --folder-id $FOLDER_ID --format json | ConvertFrom-Json
$REGISTRY_ID = $registryJson.id
if (-not $REGISTRY_ID) {
    Write-Error "Registry not found. Run .\1-initial-deploy.ps1 first"
    exit 1
}

Write-Host "Registry ID: $REGISTRY_ID"

Write-Host "Building Docker image for stage..."
docker build --platform linux/amd64 -t "${IMAGE_NAME}:${VERSION}" .

$YC_IMAGE = "cr.yandex/$REGISTRY_ID/${IMAGE_NAME}:${VERSION}"
docker tag "${IMAGE_NAME}:${VERSION}" $YC_IMAGE

Write-Host "Pushing image to registry..."
docker push $YC_IMAGE

$saJson = yc iam service-account get $SERVICE_ACCOUNT_NAME --folder-id $FOLDER_ID --format json | ConvertFrom-Json
$SERVICE_ACCOUNT_ID = $saJson.id
if (-not $SERVICE_ACCOUNT_ID) {
    Write-Error "Service Account not found. Run .\1-initial-deploy.ps1 first"
    exit 1
}

Write-Host "Service Account ID: $SERVICE_ACCOUNT_ID"

Write-Host "Creating stage container..."
try { yc serverless container create --name $CONTAINER_NAME --folder-id $FOLDER_ID 2>$null } catch { Write-Host "Stage container already exists" }

Write-Host "Deploying revision to stage..."
yc serverless container revision deploy `
  --container-name $CONTAINER_NAME `
  --image $YC_IMAGE `
  --cores 1 `
  --memory 1GB `
  --concurrency 10 `
  --execution-timeout 60s `
  --service-account-id $SERVICE_ACCOUNT_ID `
  --environment ENV=stage `
  --environment HTTP_PORT=:8080 `
  --folder-id $FOLDER_ID

Write-Host "Allowing public access..."
yc serverless container allow-unauthenticated-invoke $CONTAINER_NAME --folder-id $FOLDER_ID

$containerJson = yc serverless container get $CONTAINER_NAME --folder-id $FOLDER_ID --format json | ConvertFrom-Json
$STAGE_URL = $containerJson.url

Write-Host ""
Write-Host "Stage container created and deployed!"
Write-Host "Stage URL: $STAGE_URL"
Write-Host ""
Write-Host "Next steps:"
Write-Host "   1. Attach secrets to stage container in Yandex Cloud Console"
Write-Host "   2. Create API Gateway: yc serverless api-gateway create --spec-file deployment/api-gateway/stage.yaml"
Write-Host "   3. Updates: .\deployment\scripts\update-container.ps1"
