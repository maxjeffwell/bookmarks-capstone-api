# Docker Deployment Guide for FireBook

This guide explains how to deploy the FireBook application using Docker, alongside the existing Firebase Hosting deployment.

## Overview

FireBook can be deployed in two ways:
1. **Firebase Hosting** (existing deployment) - CDN-based static hosting with Firebase backend services
2. **Docker** (new option) - Self-hosted containerized deployment

Both deployments use the same Firebase backend services (Authentication & Firestore), so your data and authentication remain consistent across all environments.

## Architecture

### Docker Setup
- **Static Site Container**: Built application served with nginx
- **Backend Services**: Firebase Authentication & Cloud Firestore (cloud-based)
- **Configuration**: nginx configured to match Firebase Hosting settings

### Why Docker?
- Self-hosting capability alongside Firebase
- Local development without Firebase emulators
- Cloud deployment flexibility (AWS, GCP, Azure, etc.)
- Backup deployment option if Firebase is unreachable
- Corporate/enterprise deployment behind firewalls

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Firebase project already configured (existing setup)

## Quick Start

### 1. Build and Run

```bash
cd /home/maxjeffwell/GitHub_Projects/bookmarks-capstone-api

# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

### 2. Access the Application

Open your browser to: **http://localhost:8080**

The application will use your existing Firebase project for authentication and data storage.

## Configuration

### Environment Variables

Create a `.env` file (optional):

```env
NODE_ENV=production
APP_PORT=8080
```

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `APP_PORT` | Application port | `8080` |

### Firebase Configuration

The Docker deployment uses the same Firebase configuration embedded in your application code:
- **Project ID**: `marmoset-c2870`
- **Authentication**: Firebase Auth (Email/Password, Google OAuth)
- **Database**: Cloud Firestore
- **No additional configuration needed**

## Building Images

### Build Production Image

```bash
docker build -t firebook:latest .
```

### Build Development Image

```bash
docker build --target development -t firebook:dev .
```

### Multi-stage Builds

The Dockerfile includes separate stages:
- **build**: Compiles and minifies the static assets
- **production**: Optimized nginx runtime image
- **development**: Development with Python HTTP server

## Running Containers

### Using Docker Compose (Recommended)

```bash
# Start service
docker-compose up -d

# View logs
docker-compose logs -f firebook

# Rebuild and restart
docker-compose up -d --build

# Stop service
docker-compose down
```

### Using Docker CLI

```bash
# Build image
docker build -t firebook:latest .

# Run container
docker run -d \
  --name firebook-app \
  -p 8080:80 \
  firebook:latest

# View logs
docker logs -f firebook-app

# Stop container
docker stop firebook-app
docker rm firebook-app
```

## Deployment Scenarios

### Local Development

Use Docker for local testing without Firebase emulators:

```bash
docker-compose up -d
```

Access at: http://localhost:8080

### Production Self-Hosting

1. Build the production image:
```bash
docker-compose build
```

2. Deploy to your server:
```bash
docker-compose up -d
```

3. Configure reverse proxy (nginx, Caddy, Traefik) for HTTPS

### Cloud Deployment

**Push to Docker Hub:**
```bash
docker tag firebook:latest username/firebook:latest
docker push username/firebook:latest
```

**Deploy to container platforms:**
- AWS Elastic Container Service (ECS)
- Google Cloud Run
- Azure Container Instances
- DigitalOcean App Platform
- Linode Kubernetes Engine (LKE)

## nginx Configuration

The included `nginx.conf` replicates Firebase Hosting behavior:

### Caching Strategy
- **JS/CSS**: 1 year cache (immutable)
- **Images**: 1 day cache
- **HTML**: No cache

### Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

### Clean URLs
- Removes trailing slashes
- Supports extensionless URLs (e.g., `/about` → `/about.html`)

### File Restrictions
- Blocks access to hidden files (`.` prefixed)
- Blocks test and debug files
- Matches Firebase ignore patterns

## Firebase Integration

### Authentication Flow

1. User authenticates via Firebase Auth SDK in browser
2. Firebase returns authentication token
3. Token stored in browser localStorage
4. All Firestore requests use this token
5. Works identically whether hosted on Firebase or Docker

### Data Storage

- **Firestore Database**: Cloud-hosted (not containerized)
- **User Data**: Isolated per user at `/users/{userId}/bookmarks/`
- **Security Rules**: Enforced by Firebase (not nginx)
- **Real-time Sync**: Works across all deployments

### No Backend Changes Needed

Firebase SDK connects directly from browser to Firebase services:
- No backend proxy required
- No API endpoints to configure
- No database connection strings
- Firebase handles all authentication and authorization

## Monitoring and Maintenance

### View Logs

```bash
# Container logs
docker logs -f firebook-app

# nginx access logs
docker exec firebook-app tail -f /var/log/nginx/access.log

# nginx error logs
docker exec firebook-app tail -f /var/log/nginx/error.log
```

### Health Checks

```bash
# Check container health
docker ps

# Inspect health status
docker inspect --format='{{.State.Health.Status}}' firebook-app

# Manual health check
curl -f http://localhost:8080 || echo "Health check failed"
```

### Resource Usage

```bash
# Monitor resources
docker stats firebook-app

# View container details
docker inspect firebook-app
```

## Troubleshooting

### Build Failures

**Issue**: npm install fails
```bash
# Clear Docker cache
docker builder prune -a

# Rebuild without cache
docker-compose build --no-cache
```

**Issue**: Build script fails
```bash
# Check build logs
docker-compose build

# Verify build.js is executable
chmod +x build.js
```

### Runtime Issues

**Issue**: Port already in use
```bash
# Change port in .env or docker-compose.yml
APP_PORT=8081

# Or stop conflicting service
sudo lsof -ti:8080 | xargs kill -9
```

**Issue**: Cannot connect to Firebase
- **Check**: Firebase project configuration in `scripts/firebase-config.js`
- **Verify**: Browser console for Firebase errors
- **Confirm**: Firebase project is active in console

**Issue**: Authentication not working
- **Check**: Firebase Auth is enabled for your project
- **Verify**: Authorized domains include your Docker host
- **Add**: http://localhost:8080 to authorized domains in Firebase Console

### Adding Authorized Domains

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `marmoset-c2870`
3. Navigate to: **Authentication** → **Settings** → **Authorized domains**
4. Add your Docker deployment domain:
   - `localhost` (for local testing)
   - Your server's domain (for production)

## Performance Optimization

### nginx Optimizations

The configuration includes:
- Gzip compression for all text assets
- Long-term caching for static assets
- TCP optimizations (tcp_nopush, tcp_nodelay)
- Connection pooling
- Worker process auto-scaling

### Multi-platform Builds

Build for multiple architectures:

```bash
# Setup buildx
docker buildx create --use

# Build for multiple platforms
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t firebook:latest \
  --push .
```

### Image Size Optimization

Current optimizations:
- Alpine Linux base (minimal size)
- Multi-stage builds (only production files)
- No development dependencies in final image
- Minified and bundled assets

## Security

### Container Security

✅ **Implemented:**
- Non-root user (nodejs:1001)
- Read-only root filesystem possible
- Security headers configured
- Minimal base image (Alpine)
- No sensitive data in image

### Firebase Security

✅ **Maintained:**
- Firestore security rules enforced
- Authentication required for data access
- User data isolation
- HTTPS enforced by Firebase
- Rate limiting by Firebase

### SSL/TLS for Self-Hosting

For production deployment, use a reverse proxy with SSL:

**nginx reverse proxy:**
```nginx
server {
    listen 443 ssl http2;
    server_name bookmarks.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Caddy (automatic HTTPS):**
```
bookmarks.yourdomain.com {
    reverse_proxy localhost:8080
}
```

## Comparison: Docker vs Firebase Hosting

| Feature | Firebase Hosting | Docker Self-Hosting |
|---------|------------------|---------------------|
| **Setup** | `firebase deploy` | `docker-compose up` |
| **SSL** | Automatic | Manual (reverse proxy) |
| **CDN** | Global | Single location |
| **Scaling** | Automatic | Manual |
| **Cost** | Free tier + usage | Infrastructure cost |
| **Backend** | Firebase (cloud) | Firebase (cloud) |
| **Data** | Firestore (cloud) | Firestore (cloud) |
| **Auth** | Firebase Auth | Firebase Auth |
| **Control** | Limited | Full control |
| **Downtime** | Firebase SLA | Your responsibility |

## Coexistence with Firebase

The Docker setup coexists perfectly with Firebase:

1. **Backend Services**: Both use the same Firebase project
2. **Authentication**: Same Firebase Auth instance
3. **Database**: Same Firestore database
4. **No Conflicts**: Different hosting, same backend

You can:
- Keep Firebase as primary deployment
- Use Docker as backup/alternative
- Deploy Docker to private networks
- Switch between deployments anytime
- Test changes locally before Firebase deployment

## Testing Before Firebase Deployment

Use Docker to test changes locally:

```bash
# Make changes to your code
nano index.html

# Test with Docker
docker-compose up -d --build

# Access at http://localhost:8080

# If satisfied, deploy to Firebase
npm run firebase:deploy
```

## Backup Strategy

Docker provides a deployment backup:

1. **Primary**: Firebase Hosting (public, CDN, automatic SSL)
2. **Backup**: Docker (self-hosted, full control)
3. **Development**: Docker (test before Firebase deploy)

## CI/CD Integration

Add Docker builds to your CI/CD pipeline:

### GitHub Actions Example

```yaml
name: Docker Build

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Docker image
        run: docker build -t firebook:latest .
      - name: Test image
        run: |
          docker run -d -p 8080:80 firebook:latest
          sleep 5
          curl -f http://localhost:8080 || exit 1
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [nginx Documentation](https://nginx.org/en/docs/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Main README](README.md)

## Support

For issues specific to:
- **Docker setup**: Check this guide and Docker logs
- **Application**: See main [README.md](README.md)
- **Firebase**: Check Firebase Console and documentation

---

**Note**: Docker files (Dockerfile, docker-compose.yml, nginx.conf) are gitignored to avoid conflicts with Firebase deployment. Keep these files locally for your Docker deployments. Firebase deployment is unaffected by their presence or absence.

## Quick Reference

```bash
# Build
docker-compose build

# Start
docker-compose up -d

# Logs
docker-compose logs -f

# Stop
docker-compose down

# Rebuild
docker-compose up -d --build

# Health check
curl http://localhost:8080
```

---

🔥 **FireBook** - Made with Firebase, Dockerized for flexibility 🔥
