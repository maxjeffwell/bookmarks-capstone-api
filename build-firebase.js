#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const BUILD_DIR = 'dist';

// Generate content hash for cache busting
async function getFileHash(filePath) {
  const content = await fs.readFile(filePath);
  return crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
}

// Update HTML with hashed asset filenames
async function updateHTMLReferences(htmlFile, assetMap) {
  let html = await fs.readFile(htmlFile, 'utf8');
  
  // Replace script and style references with hashed versions
  for (const [original, hashed] of Object.entries(assetMap)) {
    const regex = new RegExp(`(src|href)=["']([^"']*${original})["']`, 'g');
    html = html.replace(regex, `$1="${hashed}"`);
  }
  
  await fs.writeFile(htmlFile, html);
}

// Create service worker for offline support
async function createServiceWorker() {
  const swContent = `
// Service Worker for Bookmarks App
const CACHE_NAME = 'bookmarks-v${Date.now()}';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/styles/modern.css',
  '/styles/grid.css',
  '/styles/auth.css',
  '/scripts/index.js',
  '/scripts/api.js',
  '/scripts/auth.js',
  '/scripts/bookmarks.js',
  '/scripts/firebase-config.js',
  '/scripts/firebase-api.js',
  '/scripts/store.js',
  '/scripts/security.js',
  '/scripts/jSonExtension.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      );
    })
  );
});
`;

  await fs.writeFile(path.join(BUILD_DIR, 'sw.js'), swContent);
  console.log('  ✓ Service Worker created');
}

// Add service worker registration to HTML
async function addServiceWorkerRegistration() {
  const htmlPath = path.join(BUILD_DIR, 'index.html');
  let html = await fs.readFile(htmlPath, 'utf8');
  
  // Add service worker registration before closing body tag
  const swRegistration = `
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(reg => console.log('Service Worker registered'))
          .catch(err => console.log('Service Worker registration failed'));
      });
    }
  </script>
  `;
  
  html = html.replace('</body>', `${swRegistration}</body>`);
  await fs.writeFile(htmlPath, html);
}

// Optimize images (placeholder - would need image optimization library)
async function optimizeImages() {
  console.log('🖼️  Image optimization skipped (no images in project)');
  // In a real project, you'd use imagemin or similar
}

// Create a manifest.json for PWA support
async function createManifest() {
  const manifest = {
    "name": "Bookmarks Manager",
    "short_name": "Bookmarks",
    "description": "Manage your web bookmarks with ease",
    "start_url": "/",
    "display": "standalone",
    "theme_color": "#007bff",
    "background_color": "#ffffff",
    "icons": [
      {
        "src": "/icon-192.png",
        "sizes": "192x192",
        "type": "image/png"
      },
      {
        "src": "/icon-512.png",
        "sizes": "512x512",
        "type": "image/png"
      }
    ]
  };
  
  await fs.writeFile(
    path.join(BUILD_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  
  // Add manifest link to HTML
  const htmlPath = path.join(BUILD_DIR, 'index.html');
  let html = await fs.readFile(htmlPath, 'utf8');
  html = html.replace(
    '</head>',
    '  <link rel="manifest" href="/manifest.json">\n</head>'
  );
  await fs.writeFile(htmlPath, html);
  
  console.log('  ✓ PWA manifest created');
}

// Main Firebase optimization
async function optimizeForFirebase() {
  console.log('🔥 Optimizing for Firebase Hosting...\n');
  
  try {
    // Run standard build first
    await execAsync('node build.js');
    
    console.log('\n🚀 Firebase-specific optimizations...');
    
    // Create service worker
    await createServiceWorker();
    
    // Add service worker registration
    await addServiceWorkerRegistration();
    
    // Create PWA manifest
    await createManifest();
    
    // Optimize images
    await optimizeImages();
    
    // Create deployment checklist
    const checklist = `
# Firebase Deployment Checklist

✅ Build optimized for production
✅ Service Worker created for offline support
✅ PWA manifest added
✅ Security headers configured in firebase.json
✅ Cache headers optimized for performance

## Deploy to Firebase:
\`\`\`bash
npm run firebase:deploy
\`\`\`

## Test locally:
\`\`\`bash
npm run firebase:serve
\`\`\`

## Preview deployment:
\`\`\`bash
npm run firebase:deploy:preview
\`\`\`
`;
    
    await fs.writeFile(
      path.join(BUILD_DIR, 'FIREBASE_DEPLOY.md'),
      checklist
    );
    
    console.log('\n✅ Firebase optimization complete!');
    console.log('📦 Run "npm run firebase:deploy" to deploy');
    
  } catch (error) {
    console.error('\n❌ Optimization failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  optimizeForFirebase();
}

module.exports = { optimizeForFirebase };