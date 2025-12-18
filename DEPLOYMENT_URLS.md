# FireBook Deployment URL Configuration

## Overview

FireBook now uses environment-based URL configuration instead of hardcoded URLs. This allows you to build different images for different environments (Firebase, Kubernetes, NAS) without modifying the source code.

## How It Works

The `VITE_APP_URL` environment variable is read at **build time** and used to:
- Replace URL placeholders in `index.html` meta tags and structured data
- Generate environment-specific `sitemap.xml`
- Generate environment-specific `robots.txt`

## Configuration by Environment

### 1. Local Development

For local development, the URL is set in `.env.local`:

```bash
# .env.local
VITE_APP_URL=http://localhost:3000
```

Then run:
```bash
npm run dev
```

### 2. Firebase Deployment

Firebase uses `https://marmoset-c2870.web.app/` as the URL.

**Add GitHub Secret:**
```bash
gh secret set VITE_APP_URL_FIREBASE --body "https://marmoset-c2870.web.app"
```

The GitHub workflows are already configured to use this secret.

### 3. Kubernetes Deployment

Kubernetes uses `https://firebook-k8s.el-jefe.me/` as the URL.

**Add GitHub Secret:**
```bash
gh secret set VITE_APP_URL --body "https://firebook-k8s.el-jefe.me"
```

The Docker build workflow will use this to build images for Kubernetes.

### 4. NAS Deployment

For your NAS, you can build locally or use a custom URL.

**Option A: Build Locally on NAS**

```bash
# On your NAS
cd /path/to/bookmarks-capstone-api

# Build with your NAS URL
docker build \
  --build-arg VITE_APP_URL=https://your-nas-url.local \
  --build-arg VITE_ALGOLIA_APP_ID=8DX5VDLLK6 \
  --build-arg VITE_ALGOLIA_SEARCH_API_KEY=99bc143df6b1747e1184e42c9c8fb925 \
  --build-arg VITE_ALGOLIA_INDEX_NAME=bookmarks \
  --target production \
  -t firebook:nas \
  .

# Run the container
docker run -d \
  --name firebook \
  -p 80:80 \
  --restart unless-stopped \
  firebook:nas
```

**Option B: Use Docker Compose**

Create `docker-compose.nas.yml`:

```yaml
version: '3.8'

services:
  firebook:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
      args:
        VITE_APP_URL: "https://your-nas-url.local"
        VITE_ALGOLIA_APP_ID: "8DX5VDLLK6"
        VITE_ALGOLIA_SEARCH_API_KEY: "99bc143df6b1747e1184e42c9c8fb925"
        VITE_ALGOLIA_INDEX_NAME: "bookmarks"
    ports:
      - "80:80"
    restart: unless-stopped
```

Then:
```bash
docker-compose -f docker-compose.nas.yml up -d --build
```

## Setting Up GitHub Secrets

You need to configure these secrets in your GitHub repository:

### Required for All Environments

```bash
cd /path/to/bookmarks-capstone-api

# Algolia configuration (already set)
gh secret set VITE_ALGOLIA_APP_ID --body "8DX5VDLLK6"
gh secret set VITE_ALGOLIA_SEARCH_API_KEY --body "99bc143df6b1747e1184e42c9c8fb925"
gh secret set VITE_ALGOLIA_INDEX_NAME --body "bookmarks"
```

### For Docker/Kubernetes Deployment

```bash
gh secret set VITE_APP_URL --body "https://firebook-k8s.el-jefe.me"
```

### For Firebase Deployment

```bash
gh secret set VITE_APP_URL_FIREBASE --body "https://marmoset-c2870.web.app"
```

## Verifying the Configuration

After building, verify that the URLs were properly injected:

```bash
# Check index.html
grep -o "https://.*el-jefe.me\|localhost:3000" dist/index.html | head -5

# Check sitemap.xml
head -15 dist/sitemap.xml

# Check robots.txt
head -10 dist/robots.txt
```

You should see your configured URL in all three files.

## Updating Existing Deployments

### Firebase

Firebase deployments will automatically use the new configuration on the next push to `main` or `master`.

### Kubernetes

After the next Docker image build:

```bash
# On your K8s cluster
kubectl rollout restart deployment/firebook -n default
kubectl rollout status deployment/firebook -n default
```

### NAS

Rebuild and restart the container:

```bash
# Pull latest code
cd /path/to/bookmarks-capstone-api
git pull

# Rebuild with your URL
docker-compose -f docker-compose.nas.yml up -d --build
```

## Troubleshooting

### URLs Still Hardcoded in Build

**Issue**: After building, you still see `marmoset-c2870.web.app` in the output.

**Solution**: Ensure `VITE_APP_URL` is set as an environment variable BEFORE running the build:

```bash
export VITE_APP_URL=https://your-url.com
npm run build
```

Or pass it directly:
```bash
VITE_APP_URL=https://your-url.com npm run build
```

### Docker Build Not Using Correct URL

**Issue**: Docker image has wrong URL.

**Solution**: Verify build args are passed correctly:

```bash
docker build \
  --build-arg VITE_APP_URL=https://your-url.com \
  --progress=plain \
  . 2>&1 | grep VITE_APP_URL
```

### Template Variables Not Replaced

**Issue**: You see `<%- appUrl %>` in the built files.

**Solution**: Ensure `vite-plugin-html` is installed:

```bash
npm install
# Verify it's in package.json devDependencies
grep vite-plugin-html package.json
```

## Files Modified

The following files were updated to support dynamic URLs:

- `index.html` - All meta tags and structured data now use `<%- appUrl %>`
- `vite.config.js` - Configured `vite-plugin-html` to inject the URL
- `package.json` - Added `generate:seo` script to build process
- `Dockerfile` - Added `VITE_APP_URL` build argument
- `.github/workflows/docker-build-push.yml` - Uses `VITE_APP_URL` secret
- `.github/workflows/firebase-hosting-merge.yml` - Uses `VITE_APP_URL_FIREBASE` secret
- `.github/workflows/firebase-hosting-pull-request.yml` - Uses `VITE_APP_URL_FIREBASE` secret
- `scripts/generate-sitemap.js` - New script for dynamic sitemap generation
- `scripts/generate-robots.js` - New script for dynamic robots.txt generation

## Next Steps

1. **Set GitHub Secrets** (see above)
2. **Trigger a new build** (push to GitHub or run workflow manually)
3. **Update your deployments** to use the new image

After these steps, each environment will have the correct URL automatically configured!

---

**Last Updated**: 2025-12-16
**Version**: 1.1.0
