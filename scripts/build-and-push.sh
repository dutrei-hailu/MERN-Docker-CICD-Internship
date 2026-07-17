#!/usr/bin/env bash
# Day 2 — Build, tag, and push MERN images to Docker Hub
# Usage: ./scripts/build-and-push.sh <dockerhub-username> [version]
# Example: ./scripts/build-and-push.sh myuser 1.0.0

set -euo pipefail

DOCKERHUB_USER="${1:?Docker Hub username required}"
VERSION="${2:-1.0.0}"
GIT_SHA="$(git rev-parse --short HEAD 2>/dev/null || echo 'local')"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Building backend image..."
docker build \
  -t "${DOCKERHUB_USER}/mern-backend:${VERSION}" \
  -t "${DOCKERHUB_USER}/mern-backend:latest" \
  -t "${DOCKERHUB_USER}/mern-backend:sha-${GIT_SHA}" \
  "${ROOT_DIR}/mern/backend"

echo "==> Building frontend production image..."
docker build \
  -f "${ROOT_DIR}/mern/frontend/Dockerfile.prod" \
  --build-arg VITE_API_URL= \
  -t "${DOCKERHUB_USER}/mern-frontend:${VERSION}" \
  -t "${DOCKERHUB_USER}/mern-frontend:latest" \
  -t "${DOCKERHUB_USER}/mern-frontend:sha-${GIT_SHA}" \
  "${ROOT_DIR}/mern/frontend"

echo "==> Pushing backend tags..."
docker push "${DOCKERHUB_USER}/mern-backend:${VERSION}"
docker push "${DOCKERHUB_USER}/mern-backend:latest"
docker push "${DOCKERHUB_USER}/mern-backend:sha-${GIT_SHA}"

echo "==> Pushing frontend tags..."
docker push "${DOCKERHUB_USER}/mern-frontend:${VERSION}"
docker push "${DOCKERHUB_USER}/mern-frontend:latest"
docker push "${DOCKERHUB_USER}/mern-frontend:sha-${GIT_SHA}"

echo ""
echo "Done. Images pushed:"
echo "  ${DOCKERHUB_USER}/mern-backend:${VERSION}"
echo "  ${DOCKERHUB_USER}/mern-backend:latest"
echo "  ${DOCKERHUB_USER}/mern-backend:sha-${GIT_SHA}"
echo "  ${DOCKERHUB_USER}/mern-frontend:${VERSION}"
echo "  ${DOCKERHUB_USER}/mern-frontend:latest"
echo "  ${DOCKERHUB_USER}/mern-frontend:sha-${GIT_SHA}"
