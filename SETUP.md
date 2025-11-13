# Quick Setup Guide for FireBook CI/CD

This guide will help you set up the CI/CD pipelines for FireBook in just a few steps.

## Prerequisites

- GitHub repository: `maxjeffwell/bookmarks-capstone-api`
- Docker Hub account: `maxjeffwell`
- Firebase project already configured: `marmoset-c2870`

## Step 1: Configure Docker Hub Access

### Create Docker Hub Access Token

1. Log in to [Docker Hub](https://hub.docker.com/)
2. Go to **Account Settings** → **Security**
3. Click **New Access Token**
4. Configure:
   - **Description**: `GitHub Actions FireBook`
   - **Access permissions**: `Read, Write, Delete`
5. Click **Generate**
6. **IMPORTANT:** Copy the token immediately (shown only once!)

### Add Secrets to GitHub

1. Go to your GitHub repository: https://github.com/maxjeffwell/bookmarks-capstone-api
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

Add these two secrets:

**Secret 1: DOCKERHUB_USERNAME**
- Name: `DOCKERHUB_USERNAME`
- Value: `maxjeffwell`

**Secret 2: DOCKERHUB_TOKEN**
- Name: `DOCKERHUB_TOKEN`
- Value: [paste the token you copied from Docker Hub]

## Step 2: Verify Firebase Secret

Your Firebase secret should already exist from when you set up Firebase Hosting with GitHub Actions.

Check if it exists:
1. Go to: **Settings** → **Secrets and variables** → **Actions**
2. Look for: `FIREBASE_SERVICE_ACCOUNT_MARMOSET_C2870`

If it doesn't exist, run:
```bash
cd /home/maxjeffwell/GitHub_Projects/bookmarks-capstone-api
firebase init hosting:github
```

## Step 3: Push Workflows to GitHub

```bash
cd /home/maxjeffwell/GitHub_Projects/bookmarks-capstone-api

# Check git status
git status

# Add workflow files
git add .github/workflows/ci.yml
git add .github/workflows/docker-build-push.yml

# Add documentation
git add CICD.md SETUP.md

# Add README changes (build badges)
git add README.md

# Commit
git commit -m "Add CI/CD workflows for Docker builds and automated testing"

# Push to GitHub
git push origin main
```

## Step 4: Verify Workflows

After pushing:

1. Go to **Actions** tab on GitHub
2. You should see workflows running:
   - ✅ **CI** - Testing and building
   - ✅ **Docker Build & Push** - Building and pushing to Docker Hub
   - ✅ **Deploy to Firebase Hosting on merge** - Deploying to Firebase

3. Click on each workflow to see execution details

## Step 5: Check Docker Hub

After the Docker workflow completes:

1. Go to: https://hub.docker.com/r/maxjeffwell/firebook
2. You should see:
   - `latest` tag
   - `main` tag
   - Build information

## What Happens Next?

### On Every Push to Any Branch

- **CI workflow** runs:
  - Tests the build
  - Verifies output files
  - Builds Docker image (doesn't push)
  - Tests the Docker container

### On Push to Main Branch

- **CI workflow** runs (tests)
- **Docker Build & Push** runs:
  - Builds for multiple platforms (amd64, arm64)
  - Pushes to Docker Hub
  - Scans for security vulnerabilities
- **Firebase Deploy** runs:
  - Deploys to Firebase Hosting
  - Updates live site

### On Creating Version Tags

```bash
# Create a release
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# Docker Build & Push creates multiple tags:
# - maxjeffwell/firebook:v1.0.0
# - maxjeffwell/firebook:v1.0
# - maxjeffwell/firebook:v1
# - maxjeffwell/firebook:latest
```

## Using the Published Docker Images

After workflows complete, you can pull and run your Docker images:

```bash
# Pull latest image
docker pull maxjeffwell/firebook:latest

# Run locally
docker run -d -p 8080:80 maxjeffwell/firebook:latest

# Access at: http://localhost:8080
```

## Viewing Build Status

Your README now has build status badges that show workflow status:

- ![CI](https://github.com/maxjeffwell/bookmarks-capstone-api/workflows/CI/badge.svg)
- ![Docker Build & Push](https://github.com/maxjeffwell/bookmarks-capstone-api/workflows/Docker%20Build%20%26%20Push/badge.svg)
- ![Firebase Deploy](https://github.com/maxjeffwell/bookmarks-capstone-api/workflows/Deploy%20to%20Firebase%20Hosting%20on%20merge/badge.svg)

## Troubleshooting

### Workflow Failed: Docker Build & Push

**Error: "Error: Cannot perform an interactive login from a non TTY device"**

This means Docker Hub credentials are missing or incorrect.

**Fix:**
1. Verify secrets exist in GitHub: `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN`
2. Regenerate Docker Hub token if needed
3. Update the GitHub secret

### Workflow Failed: CI

**Error: Build failed**

**Fix:**
1. Test locally first:
   ```bash
   cd /home/maxjeffwell/GitHub_Projects/bookmarks-capstone-api
   npm install
   npm run build
   ```
2. Check GitHub Actions logs for specific error
3. Ensure all required files are committed

### No Docker Images on Docker Hub

**Check:**
1. Workflow completed successfully (green checkmark)
2. You're looking at the correct Docker Hub repo: https://hub.docker.com/r/maxjeffwell/firebook
3. Workflow ran on main/master branch (Docker push only happens on these branches)

## Security Notes

### Secrets Safety

✅ **Safe:**
- Secrets are encrypted in GitHub
- Only visible to workflow runners
- Not exposed in logs
- Can be rotated anytime

⚠️ **Never:**
- Commit secrets to git
- Share secrets publicly
- Use personal passwords (use tokens)

### Docker Hub Token

- Use access tokens, NOT your Docker Hub password
- Limit token scope to only what's needed
- Rotate tokens periodically
- Delete tokens you no longer use

## Next Steps

After setup:

1. **Test the pipeline:**
   ```bash
   # Make a small change
   echo "<!-- Test CI/CD -->" >> README.md
   git add README.md
   git commit -m "Test CI/CD pipeline"
   git push origin main
   ```

2. **Watch workflows run:**
   - Go to Actions tab
   - See workflows execute
   - Verify all pass

3. **Check deployments:**
   - Docker Hub: https://hub.docker.com/r/maxjeffwell/firebook
   - Firebase: https://marmoset-c2870.firebaseapp.com

4. **Create first release:**
   ```bash
   git tag -a v1.0.0 -m "First release with CI/CD"
   git push origin v1.0.0
   ```

## Documentation

For detailed information:

- **CI/CD Details**: See [CICD.md](CICD.md)
- **Docker Usage**: See [DOCKER.md](DOCKER.md)
- **Application Info**: See [README.md](README.md)

## Summary Checklist

- [ ] Created Docker Hub access token
- [ ] Added `DOCKERHUB_USERNAME` secret to GitHub
- [ ] Added `DOCKERHUB_TOKEN` secret to GitHub
- [ ] Verified `FIREBASE_SERVICE_ACCOUNT_MARMOSET_C2870` exists
- [ ] Pushed workflow files to GitHub
- [ ] Verified workflows run successfully
- [ ] Checked Docker Hub for published images
- [ ] Tested pulling and running Docker image locally

---

🔥 **You're all set!** Your FireBook application now has automated CI/CD pipelines. 🔥

Every push to main will:
1. Test and build your code
2. Create Docker images
3. Deploy to Firebase Hosting

Happy coding! 🚀
