#!/bin/bash

# Install required development tools
# Supports macOS (brew) and Linux (apt/snap)

set -e

echo "========================================"
echo "  Project Tools Installer"
echo "========================================"
echo ""

# Detect OS
OS="unknown"
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
    echo "Detected: macOS"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    echo "Detected: Linux"
else
    echo "Unsupported OS: $OSTYPE"
    echo "Use install-tools.ps1 for Windows"
    exit 1
fi

echo ""

MISSING=0
INSTALLED=0

check_tool() {
    local name=$1
    local cmd=$2
    local version_flag=${3:---version}

    if command -v "$cmd" &>/dev/null; then
        local ver=$($cmd $version_flag 2>&1 | head -1)
        echo "[OK] $name: $ver"
        INSTALLED=$((INSTALLED + 1))
        return 0
    else
        echo "[MISSING] $name — installing..."
        MISSING=$((MISSING + 1))
        return 1
    fi
}

echo "--- Checking and installing tools ---"
echo ""

# macOS: Homebrew first
if [[ "$OS" == "macos" ]]; then
    if ! check_tool "Homebrew" "brew"; then
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
fi

# Node.js
if ! check_tool "Node.js" "node"; then
    if [[ "$OS" == "macos" ]]; then
        brew install node@20
    else
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
fi

# Yarn (via corepack)
if ! check_tool "Yarn" "yarn"; then
    corepack enable
    corepack prepare yarn@stable --activate
fi

# Go
if ! check_tool "Go" "go" "version"; then
    if [[ "$OS" == "macos" ]]; then
        brew install go
    else
        GO_TARGET_VERSION="1.22.5"
        sudo snap install go --classic 2>/dev/null || {
            wget -q "https://go.dev/dl/go${GO_TARGET_VERSION}.linux-amd64.tar.gz"
            sudo rm -rf /usr/local/go
            sudo tar -C /usr/local -xzf "go${GO_TARGET_VERSION}.linux-amd64.tar.gz"
            rm "go${GO_TARGET_VERSION}.linux-amd64.tar.gz"
            export PATH=$PATH:/usr/local/go/bin
            echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
        }
    fi
fi

# Task (go-task)
if ! check_tool "Task" "task"; then
    if [[ "$OS" == "macos" ]]; then
        brew install go-task
    else
        sudo snap install task --classic 2>/dev/null || {
            sh -c "$(curl --location https://taskfile.dev/install.sh)" -- -d -b /usr/local/bin
        }
    fi
fi

# Docker
if ! check_tool "Docker" "docker"; then
    if [[ "$OS" == "macos" ]]; then
        brew install --cask docker
        echo "NOTE: Open Docker Desktop app to complete setup"
    else
        sudo apt-get update
        sudo apt-get install -y docker.io docker-compose-v2
        sudo usermod -aG docker $USER
        echo "NOTE: Log out and back in for Docker group to take effect"
    fi
fi

# protoc
if ! check_tool "protoc" "protoc"; then
    if [[ "$OS" == "macos" ]]; then
        brew install protobuf
    else
        sudo apt-get install -y protobuf-compiler
    fi
fi

# buf
if ! check_tool "buf" "buf"; then
    if [[ "$OS" == "macos" ]]; then
        brew install bufbuild/buf/buf
    else
        BUF_VERSION="1.28.1"
        curl -sSL "https://github.com/bufbuild/buf/releases/download/v${BUF_VERSION}/buf-$(uname -s)-$(uname -m)" -o /tmp/buf
        sudo mv /tmp/buf /usr/local/bin/buf
        sudo chmod +x /usr/local/bin/buf
    fi
fi

# jq
if ! check_tool "jq" "jq"; then
    if [[ "$OS" == "macos" ]]; then
        brew install jq
    else
        sudo apt-get install -y jq
    fi
fi

# Go protobuf plugins (needed for proto generation)
echo ""
echo "--- Checking Go protobuf plugins ---"
echo ""

if ! command -v protoc-gen-go &>/dev/null; then
    echo "[MISSING] protoc-gen-go — installing..."
    go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
    MISSING=$((MISSING + 1))
else
    echo "[OK] protoc-gen-go"
    INSTALLED=$((INSTALLED + 1))
fi

if ! command -v protoc-gen-go-grpc &>/dev/null; then
    echo "[MISSING] protoc-gen-go-grpc — installing..."
    go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
    MISSING=$((MISSING + 1))
else
    echo "[OK] protoc-gen-go-grpc"
    INSTALLED=$((INSTALLED + 1))
fi

# protoc-gen-grpc-web (needed for frontend proto generation)
if ! command -v protoc-gen-grpc-web &>/dev/null; then
    echo "[MISSING] protoc-gen-grpc-web — installing..."
    if [[ "$OS" == "macos" ]]; then
        brew install protoc-gen-grpc-web
    else
        GRPC_WEB_VERSION="2.0.2"
        curl -sSL "https://github.com/nicholasgasior/grpc-web/releases/download/${GRPC_WEB_VERSION}/protoc-gen-grpc-web-${GRPC_WEB_VERSION}-linux-x86_64" -o /tmp/protoc-gen-grpc-web 2>/dev/null || {
            echo "[WARN] Could not auto-install protoc-gen-grpc-web"
            echo "       Install manually: https://github.com/grpc/grpc-web/releases"
        }
        if [ -f /tmp/protoc-gen-grpc-web ]; then
            sudo mv /tmp/protoc-gen-grpc-web /usr/local/bin/protoc-gen-grpc-web
            sudo chmod +x /usr/local/bin/protoc-gen-grpc-web
        fi
    fi
    MISSING=$((MISSING + 1))
else
    echo "[OK] protoc-gen-grpc-web"
    INSTALLED=$((INSTALLED + 1))
fi

echo ""
echo "--- Checking minimum versions ---"
echo ""

VERSION_OK=true

# Check Node.js >= 20
if command -v node &>/dev/null; then
    NODE_MAJOR=$(node --version | sed 's/v//' | cut -d. -f1)
    if [ "$NODE_MAJOR" -lt 20 ]; then
        echo "[WARN] Node.js version $(node --version) is below minimum (v20+)"
        VERSION_OK=false
    else
        echo "[OK] Node.js $(node --version) >= v20"
    fi
fi

# Check Go >= 1.22
if command -v go &>/dev/null; then
    GO_VERSION=$(go version | sed -E 's/.*go([0-9]+\.[0-9]+).*/\1/')
    GO_MAJOR=$(echo "$GO_VERSION" | cut -d. -f1)
    GO_MINOR=$(echo "$GO_VERSION" | cut -d. -f2)
    if [ "$GO_MAJOR" -lt 1 ] || ([ "$GO_MAJOR" -eq 1 ] && [ "$GO_MINOR" -lt 22 ]); then
        echo "[WARN] Go version $GO_VERSION is below minimum (1.22+)"
        VERSION_OK=false
    else
        echo "[OK] Go $GO_VERSION >= 1.22"
    fi
fi

echo ""
echo "========================================"
echo "  Done! $INSTALLED already installed, $MISSING were installed"
echo "========================================"
echo ""

if [ "$VERSION_OK" = false ]; then
    echo "⚠️  Some tools have versions below minimum requirements."
    echo "   Please update them before proceeding."
else
    echo "✅ All version requirements met."
fi
echo ""
echo "Next step: run initial-setup spec"
