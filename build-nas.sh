#!/bin/bash
# Build FireBook for NAS deployment with Algolia credentials and correct URL

set -e

echo "🔨 Building FireBook for NAS deployment..."
echo ""

# Configuration
NAS_URL="https://firebook.el-jefe.me"
ALGOLIA_APP_ID="8DX5VDLLK6"
ALGOLIA_SEARCH_KEY="99bc143df6b1747e1184e42c9c8fb925"
ALGOLIA_INDEX="bookmarks"
IMAGE_TAG="firebook:nas"

echo "📋 Build Configuration:"
echo "  URL: $NAS_URL"
echo "  Algolia App ID: $ALGOLIA_APP_ID"
echo "  Algolia Index: $ALGOLIA_INDEX"
echo "  Image Tag: $IMAGE_TAG"
echo ""

# Build the Docker image
echo "🐳 Building Docker image..."
docker build \
  --build-arg VITE_APP_URL="$NAS_URL" \
  --build-arg VITE_ALGOLIA_APP_ID="$ALGOLIA_APP_ID" \
  --build-arg VITE_ALGOLIA_SEARCH_API_KEY="$ALGOLIA_SEARCH_KEY" \
  --build-arg VITE_ALGOLIA_INDEX_NAME="$ALGOLIA_INDEX" \
  --target production \
  -t "$IMAGE_TAG" \
  .

echo ""
echo "✅ Build complete!"
echo ""
echo "📦 Image details:"
docker images "$IMAGE_TAG" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
echo ""
echo "🚀 Next steps:"
echo "  1. Transfer this image to your NAS (if building elsewhere)"
echo "  2. Update /ssd/docker/firebook-stack.yml to use '$IMAGE_TAG'"
echo "  3. Run: docker-compose -f firebook-stack.yml up -d"
echo ""
echo "To save the image for transfer:"
echo "  docker save $IMAGE_TAG | gzip > firebook-nas.tar.gz"
echo ""
echo "To load on NAS:"
echo "  gunzip -c firebook-nas.tar.gz | docker load"
