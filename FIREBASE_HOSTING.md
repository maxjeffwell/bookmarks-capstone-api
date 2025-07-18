# Firebase Hosting Deployment Guide

## Overview
This project is optimized for deployment to Firebase Hosting with enhanced performance, security, and offline capabilities.

## Prerequisites
1. Firebase CLI installed (`npm install -g firebase-tools`)
2. Firebase project created and configured
3. Authentication enabled in Firebase Console

## Initial Setup

### 1. Login to Firebase
```bash
npm run firebase:login
```

### 2. Initialize Firebase (if not already done)
```bash
firebase init
```
Select:
- Hosting
- Firestore
- Emulators (optional, for local testing)

### 3. Configure Firebase
The `firebase.json` is already optimized with:
- ✅ Cache headers for optimal performance
- ✅ Security headers for protection
- ✅ Clean URLs enabled
- ✅ Firestore rules integration

## Build & Deploy

### Standard Deployment
```bash
# Build and deploy to production
npm run firebase:deploy

# This runs:
# 1. Optimized build process
# 2. Deploys hosting files
# 3. Updates Firestore rules
```

### Preview Deployment
Test changes before going live:
```bash
npm run firebase:deploy:preview
```
This creates a preview channel that expires in 7 days.

### Local Testing
```bash
# Test with Firebase emulators
npm run firebase:emulators

# Or just hosting
npm run firebase:serve
```

## Build Optimizations

### Enhanced Firebase Build
For maximum optimization:
```bash
npm run build:firebase
```

This includes:
- 🚀 Service Worker for offline support
- 📱 PWA manifest for installability
- 🔒 Security headers configuration
- ⚡ Optimized caching strategies
- 🗜️ Minified assets with source maps

## Performance Features

### Caching Strategy
- **Static Assets** (JS/CSS): Cached for 1 year with immutable flag
- **Images**: Cached for 24 hours
- **HTML**: No cache, always fresh
- **Service Worker**: Offline-first strategy

### Security Headers
Configured in `firebase.json`:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

## Monitoring & Analytics

### View Deployment
After deployment, your app is available at:
```
https://[PROJECT-ID].web.app
https://[PROJECT-ID].firebaseapp.com
```

### Firebase Console
Monitor your deployment:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to Hosting section
4. View deployment history and analytics

## Rollback

If needed, rollback to previous version:
```bash
firebase hosting:rollback
```

## Custom Domain

To add a custom domain:
1. Firebase Console → Hosting → Add custom domain
2. Follow DNS verification steps
3. Update DNS records as instructed

## Environment Variables

For different environments, create `.env` files:
```bash
# .env.production
FIREBASE_PROJECT_ID=your-production-project

# .env.staging  
FIREBASE_PROJECT_ID=your-staging-project
```

## CI/CD Integration

### GitHub Actions
Add to `.github/workflows/firebase-deploy.yml`:
```yaml
name: Deploy to Firebase
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm ci
      - run: npm run build:firebase
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
```

## Troubleshooting

### Build Errors
- Check Node.js version (14+ required)
- Clear cache: `rm -rf node_modules && npm install`
- Verify Firebase configuration

### Deployment Errors
- Ensure you're logged in: `firebase login`
- Check project selection: `firebase use --add`
- Verify billing is enabled for Blaze plan features

### Performance Issues
- Check Network tab for large assets
- Verify Service Worker is registered
- Test with Lighthouse audit

## Best Practices

1. **Always test locally** before deploying
2. **Use preview channels** for staging
3. **Monitor Core Web Vitals** in Firebase Console
4. **Keep firebase.json** version controlled
5. **Regular security rule updates**

## Resources

- [Firebase Hosting Docs](https://firebase.google.com/docs/hosting)
- [Web Performance Best Practices](https://web.dev/firebase)
- [Firebase Hosting Pricing](https://firebase.google.com/pricing)