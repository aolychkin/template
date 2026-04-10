# Deploy frontend to Yandex Object Storage (PowerShell)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$ScriptDir/../.."

# ===== CONFIGURATION (CHANGE FOR YOUR PROJECT) =====
$PROJECT_NAME = "my-project"

$STAGE_BUCKET = "$PROJECT_NAME-frontend-stage"
$STAGE_API_GATEWAY = "https://YOUR_STAGE_GATEWAY.apigw.yandexcloud.net"

$PROD_BUCKET = "$PROJECT_NAME-frontend-prod"
$PROD_API_GATEWAY = "https://YOUR_PROD_GATEWAY.apigw.yandexcloud.net"
# ===================================================

Write-Host "Select deployment environment"
$DEPLOY_PROD = Read-Host "Deploy production version? (yes/no) [no]"
if (-not $DEPLOY_PROD) { $DEPLOY_PROD = "no" }

if ($DEPLOY_PROD -eq "yes" -or $DEPLOY_PROD -eq "y") {
    $ENV_NAME = "production"
    $BUCKET_NAME = $PROD_BUCKET
    $API_GATEWAY = $PROD_API_GATEWAY
    Write-Host "PRODUCTION mode"
} else {
    $ENV_NAME = "stage"
    $BUCKET_NAME = $STAGE_BUCKET
    $API_GATEWAY = $STAGE_API_GATEWAY
    Write-Host "STAGE mode"
}

$BUCKET_URL = "https://$BUCKET_NAME.website.yandexcloud.net"

Write-Host ""
Write-Host "Deploying Frontend"
Write-Host "Environment: $ENV_NAME"
Write-Host "Bucket: $BUCKET_NAME"

# Check bucket
Write-Host "Checking bucket..."
try {
    yc storage bucket get $BUCKET_NAME 2>$null
} catch {
    Write-Host "Creating bucket..."
    yc storage bucket create `
      --name $BUCKET_NAME `
      --default-storage-class standard `
      --public-read `
      --public-list
}

# Website settings (SPA routing)
Write-Host "Configuring website..."
$tempFile = [System.IO.Path]::GetTempFileName()
'{"index": "index.html", "error": "index.html"}' | Out-File -FilePath $tempFile -Encoding ascii
yc storage bucket update $BUCKET_NAME --website-settings-from-file $tempFile
Remove-Item $tempFile

# Clean and build
Write-Host "Cleaning cache..."
if (Test-Path "node_modules/.vite") { Remove-Item -Recurse -Force "node_modules/.vite" }
if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }

Write-Host "Building frontend ($ENV_NAME)..."
if ($ENV_NAME -eq "production") {
    yarn build --mode production
} else {
    yarn build --mode stage
}

# SPA routes
Write-Host "Creating SPA routes..."
$SPA_ROUTES = @("login", "register", "profile")
foreach ($route in $SPA_ROUTES) {
    New-Item -ItemType Directory -Force -Path "dist/$route" | Out-Null
    Copy-Item "dist/index.html" "dist/$route/index.html"
}

# Clean bucket
Write-Host "Cleaning bucket..."
try {
    $objectsJson = yc storage s3api list-objects --bucket $BUCKET_NAME --format json 2>$null
    $objects = ($objectsJson | ConvertFrom-Json).contents
    foreach ($obj in $objects) {
        if ($obj.key) {
            yc storage s3api delete-object --bucket $BUCKET_NAME --key $obj.key 2>$null
        }
    }
} catch {}

# Upload files
Write-Host "Uploading files..."
Get-ChildItem -Path "dist" -Recurse -File | Where-Object { $_.Extension -ne ".map" } | ForEach-Object {
    $file = $_.FullName
    $key = $_.FullName.Replace((Resolve-Path "dist").Path, "").TrimStart("\", "/").Replace("\", "/")

    switch ($_.Extension) {
        { $_ -in ".js", ".mjs" } { $contentType = "application/javascript"; $cache = "public, max-age=31536000, immutable" }
        ".css"  { $contentType = "text/css"; $cache = "public, max-age=31536000, immutable" }
        ".html" { $contentType = "text/html"; $cache = "no-cache, no-store, must-revalidate" }
        ".json" { $contentType = "application/json"; $cache = "public, max-age=3600" }
        ".png"  { $contentType = "image/png"; $cache = "public, max-age=31536000" }
        ".svg"  { $contentType = "image/svg+xml"; $cache = "public, max-age=31536000" }
        default { $contentType = "application/octet-stream"; $cache = "public, max-age=3600" }
    }

    yc storage s3api put-object `
        --bucket $BUCKET_NAME `
        --key $key `
        --body $file `
        --content-type $contentType `
        --acl public-read `
        --cache-control $cache 2>$null

    Write-Host "  + $key"
}

Write-Host ""
Write-Host "Deploy complete!"
Write-Host "Frontend: $BUCKET_URL"
Write-Host "API: $API_GATEWAY"
