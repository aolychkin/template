# Install required development tools (PowerShell / Windows)
# Uses winget as primary package manager

$ErrorActionPreference = "Continue"

Write-Host "========================================"
Write-Host "  Project Tools Installer (Windows)"
Write-Host "========================================"
Write-Host ""

$Missing = 0
$Installed = 0

function Check-Tool {
    param(
        [string]$Name,
        [string]$Command,
        [string]$VersionFlag = "--version"
    )

    try {
        $output = & $Command $VersionFlag 2>&1 | Select-Object -First 1
        Write-Host "[OK] $Name : $output"
        $script:Installed++
        return $true
    } catch {
        Write-Host "[MISSING] $Name - installing..."
        $script:Missing++
        return $false
    }
}

function Has-Winget {
    try { winget --version 2>$null; return $true } catch { return $false }
}

Write-Host "--- Checking and installing tools ---"
Write-Host ""

$useWinget = Has-Winget
if (-not $useWinget) {
    Write-Host "ERROR: winget not found."
    Write-Host "Install App Installer from Microsoft Store first:"
    Write-Host "  https://apps.microsoft.com/detail/9nblggh4nns1"
    exit 1
}

# Node.js
if (-not (Check-Tool "Node.js" "node")) {
    winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
}

# Yarn (via corepack)
if (-not (Check-Tool "Yarn" "yarn")) {
    corepack enable
    corepack prepare yarn@stable --activate
}

# Go
if (-not (Check-Tool "Go" "go" "version")) {
    winget install GoLang.Go --accept-source-agreements --accept-package-agreements
}

# Task (go-task)
if (-not (Check-Tool "Task" "task")) {
    winget install Task.Task --accept-source-agreements --accept-package-agreements
}

# Docker
if (-not (Check-Tool "Docker" "docker")) {
    winget install Docker.DockerDesktop --accept-source-agreements --accept-package-agreements
    Write-Host "NOTE: Open Docker Desktop app to complete setup"
}

# protoc
if (-not (Check-Tool "protoc" "protoc")) {
    Write-Host "protoc: auto-install not available on Windows"
    Write-Host "Download from: https://github.com/protocolbuffers/protobuf/releases"
    Write-Host "Extract protoc.exe and add to PATH"
}

# buf
if (-not (Check-Tool "buf" "buf")) {
    Write-Host "buf: auto-install not available on Windows"
    Write-Host "Download from: https://buf.build/docs/installation"
}

Write-Host ""
Write-Host "========================================"
Write-Host "  Done! $Installed already installed, $Missing were installed"
Write-Host "========================================"
Write-Host ""

if ($Missing -gt 0) {
    Write-Host "Some tools were just installed."
    Write-Host "Restart PowerShell and re-run to verify."
} else {
    Write-Host "All tools are installed! Ready for initial-setup."
}
