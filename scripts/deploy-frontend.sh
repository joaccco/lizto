#!/usr/bin/env bash
set -e

# ==============================================================================
# LIZTO FRONTEND STAGING DEPLOYMENT SCRIPT (< 2 MIN)
# Usage: ./scripts/deploy-frontend.sh
# ==============================================================================

echo "========================================================"
echo " [DEPLOY] Starting Frontend Staging Deployment..."
echo "========================================================"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${WEB_DIR}"

START_TIME=$(date +%s)

echo ">> 1. Verifying environment..."
if [ -f .env.staging ]; then
    cp .env.staging .env.production
fi

echo ">> 2. Installing dependencies & building bundle..."
npm ci --prefer-offline
npm run build

echo ">> 3. Building standalone Docker image..."
docker build -t lizto-web:staging .

echo ">> 4. Health checking build..."
if [ ! -d ".next" ]; then
    echo "❌ Error: .next build directory not generated!"
    exit 1
fi

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "========================================================"
echo "✅ [DEPLOY] Frontend Staging built successfully in ${DURATION}s!"
echo "   Container image: lizto-web:staging"
echo "   Endpoint: https://staging.lizto.app (or localhost:3000)"
echo "========================================================"
