# Initial deployment to Yandex Cloud (PowerShell)
# Adapt variables for your project

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$ScriptDir/../.."

# ===== CONFIGURATION (CHANGE FOR YOUR PROJECT) =====
$PROJECT_NAME = "my-project"
$REGISTRY_NAME = "$PROJECT_NAME-registry"
$CONTAINER_NAME = "$PROJECT_NAME-api"
$SERVICE_ACCOUNT_NAME = "$PROJECT_NAME-sa"
# ===================================================

$IMAGE_NAME = "$PROJECT_NAME-api"
$VERSION = Get-Date -Format "yyyyMMdd-HHmmss"

Write-Host "Deploying $PROJECT_NAME API to Yandex Cloud"
Write-Host "Version: $VERSION"

# Get folder-id
$FOLDER_ID = yc config get folder-id
if (-not $FOLDER_ID) {
    Write-Error "Failed to get folder-id. Run: yc init"
    exit 1
}

Write-Host "Folder ID: $FOLDER_ID"

# 1. Create Container Registry
Write-Host "Creating Container Registry..."
try { yc container registry create --name $REGISTRY_NAME --folder-id $FOLDER_ID 2>$null } catch { Write-Host "Registry already exists" }
$registryJson = yc container registry get $REGISTRY_NAME --folder-id $FOLDER_ID --format json | ConvertFrom-Json
$REGISTRY_ID = $registryJson.id
Write-Host "Registry ID: $REGISTRY_ID"

# 2. Configure Docker
Write-Host "Configuring Docker..."
yc container registry configure-docker

# 3. Build image
Write-Host "Building Docker image..."
docker build --platform linux/amd64 -t "${IMAGE_NAME}:${VERSION}" .

# 4. Tag and push
$YC_IMAGE = "cr.yandex/$REGISTRY_ID/${IMAGE_NAME}:${VERSION}"
docker tag "${IMAGE_NAME}:${VERSION}" $YC_IMAGE

Write-Host "Pushing image to registry..."
docker push $YC_IMAGE

# 5. Create Service Account
Write-Host "Creating Service Account..."
try { yc iam service-account create --name $SERVICE_ACCOUNT_NAME --folder-id $FOLDER_ID 2>$null } catch { Write-Host "Service Account already exists" }
$saJson = yc iam service-account get $SERVICE_ACCOUNT_NAME --folder-id $FOLDER_ID --format json | ConvertFrom-Json
$SERVICE_ACCOUNT_ID = $saJson.id
Write-Host "Service Account ID: $SERVICE_ACCOUNT_ID"

# Assign roles
Write-Host "Assigning roles..."
try { yc resource-manager folder add-access-binding $FOLDER_ID --role container-registry.images.puller --subject "serviceAccount:$SERVICE_ACCOUNT_ID" 2>$null } catch { Write-Host "Roles already assigned" }
try { yc resource-manager folder add-access-binding $FOLDER_ID --role lockbox.payloadViewer --subject "serviceAccount:$SERVICE_ACCOUNT_ID" 2>$null } catch { Write-Host "Lockbox roles already assigned" }

# 6. Secrets
Write-Host ""
Write-Host "IMPORTANT: Add secrets manually via Yandex Cloud Console:"
Write-Host "   1. Go to Lockbox"
Write-Host "   2. Create secret '$PROJECT_NAME-secrets'"
Write-Host "   3. Add keys: DATABASE_URL, DATABASE_URL_LOCAL, JWT_SECRET, ENCRYPTION_KEY"
Write-Host ""
Read-Host "Press Enter when secrets are created"

# 7. Create container
Write-Host "Creating Serverless Container..."
try { yc serverless container create --name $CONTAINER_NAME --folder-id $FOLDER_ID 2>$null } catch { Write-Host "Container already exists" }

# 8. Deploy revision
Write-Host "Deploying revision..."
yc serverless container revision deploy `
  --container-name $CONTAINER_NAME `
  --image $YC_IMAGE `
  --cores 1 `
  --memory 1GB `
  --concurrency 10 `
  --execution-timeout 60s `
  --service-account-id $SERVICE_ACCOUNT_ID `
  --environment ENVIRONMENT=production `
  --environment HTTP_PORT=:8080 `
  --environment USE_LOCAL_DB=false `
  --folder-id $FOLDER_ID

# 9. Allow public access (temporary for testing)
Write-Host "Allowing public access..."
yc serverless container allow-unauthenticated-invoke $CONTAINER_NAME --folder-id $FOLDER_ID

# Get URL
$containerJson = yc serverless container get $CONTAINER_NAME --folder-id $FOLDER_ID --format json | ConvertFrom-Json
$CONTAINER_URL = $containerJson.url

Write-Host ""
Write-Host "Deployment complete!"
Write-Host "Container URL: $CONTAINER_URL"
Write-Host ""
Write-Host "Next steps:"
Write-Host "   1. Attach secrets to container in Yandex Cloud Console"
Write-Host "   2. Create stage container: .\deployment\scripts\2-setup-stage.ps1"
Write-Host "   3. Updates: .\deployment\scripts\update-container.ps1"
