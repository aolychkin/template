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
        sudo snap install go --classic 2>/dev/null || {
            wget -q https://go.dev/dl/go1.22.5.linux-amd64.tar.gz
            sudo rm -rf /usr/local/go
            sudo tar -C /usr/local -xzf go1.22.5.linux-amd64.tar.gz
            rm go1.22.5.linux-amd64.tar.gz
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

echo ""
echo "========================================"
echo "  Done! $INSTALLED already installed, $MISSING were installed"
echo "========================================"
echo ""
echo "Next step: run initial-setup spec"
