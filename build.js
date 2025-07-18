#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const BUILD_DIR = 'dist';
const SCRIPTS_DIR = 'scripts';
const STYLES_DIR = 'styles';

// Files to copy without modification
const STATIC_FILES = [
  'README.md',
  'LICENSE',
  '_config.yml',
  'FIREBASE_SETUP.md',
  'FIREBASE_AUTH_SETUP.md',
  'ADBLOCKER_HELP.md',
  'firestore.rules'
];

async function clean() {
  console.log('🧹 Cleaning build directory...');
  try {
    await execAsync(`npx rimraf ${BUILD_DIR}`);
  } catch (error) {
    // Directory might not exist, that's okay
  }
  await execAsync(`npx mkdirp ${BUILD_DIR}`);
  await execAsync(`npx mkdirp ${BUILD_DIR}/${SCRIPTS_DIR}`);
  await execAsync(`npx mkdirp ${BUILD_DIR}/${STYLES_DIR}`);
}

async function minifyJavaScript() {
  console.log('📦 Minifying JavaScript files...');
  const files = await fs.readdir(SCRIPTS_DIR);
  
  // Generate hash for cache busting
  const hash = Date.now().toString(36);
  
  for (const file of files) {
    if (file.endsWith('.js')) {
      const inputPath = path.join(SCRIPTS_DIR, file);
      const outputPath = path.join(BUILD_DIR, SCRIPTS_DIR, file);
      
      try {
        // Minify with source maps for better debugging
        await execAsync(`npx terser ${inputPath} -o ${outputPath} -c -m --source-map "url='${file}.map'"`);
        console.log(`  ✓ ${file}`);
      } catch (error) {
        console.error(`  ✗ Error minifying ${file}:`, error.message);
        // Copy unminified file as fallback
        await fs.copyFile(inputPath, outputPath);
      }
    }
  }
  
  return hash;
}

async function minifyCSS() {
  console.log('🎨 Minifying CSS files...');
  const files = await fs.readdir(STYLES_DIR);
  
  for (const file of files) {
    if (file.endsWith('.css')) {
      const inputPath = path.join(STYLES_DIR, file);
      const outputPath = path.join(BUILD_DIR, STYLES_DIR, file);
      
      try {
        await execAsync(`npx cleancss -o ${outputPath} ${inputPath}`);
        console.log(`  ✓ ${file}`);
      } catch (error) {
        console.error(`  ✗ Error minifying ${file}:`, error.message);
        // Copy unminified file as fallback
        await fs.copyFile(inputPath, outputPath);
      }
    }
  }
}

async function processHTML() {
  console.log('📄 Processing HTML files...');
  
  // Process main index.html
  try {
    let html = await fs.readFile('index.html', 'utf8');
    
    // Update Firebase config reminder
    if (html.includes('YOUR_API_KEY')) {
      console.log('  ⚠️  Remember to update Firebase configuration in firebase-config.js');
    }
    
    // Add cache busting version to script tags
    const version = Date.now();
    html = html.replace(/src="scripts\//g, `src="scripts/`);
    html = html.replace(/\.js"/g, `.js?v=${version}"`);
    
    // Write the processed HTML
    await fs.writeFile(path.join(BUILD_DIR, 'index.html'), html);
    console.log('  ✓ index.html (with cache busting)');
    
  } catch (error) {
    console.error('  ✗ Error processing index.html:', error.message);
  }
  
  // Copy other HTML files
  const htmlFiles = ['debug.html', 'test-firebase.html'];
  for (const file of htmlFiles) {
    try {
      await fs.copyFile(file, path.join(BUILD_DIR, file));
      console.log(`  ✓ ${file}`);
    } catch (error) {
      // Files might not exist, that's okay
    }
  }
}

async function copyStaticFiles() {
  console.log('📋 Copying static files...');
  
  for (const file of STATIC_FILES) {
    try {
      await fs.copyFile(file, path.join(BUILD_DIR, file));
      console.log(`  ✓ ${file}`);
    } catch (error) {
      console.log(`  ⚠️  ${file} not found, skipping`);
    }
  }
}

async function createDeploymentInfo() {
  console.log('📝 Creating deployment info...');
  
  const deployInfo = {
    buildDate: new Date().toISOString(),
    version: require('./package.json').version,
    environment: 'production'
  };
  
  await fs.writeFile(
    path.join(BUILD_DIR, 'build-info.json'),
    JSON.stringify(deployInfo, null, 2)
  );
  
  // Create a deployment README
  const deployReadme = `# Deployment Instructions

## GitHub Pages Deployment

1. Push the contents of the \`dist\` folder to your \`gh-pages\` branch:
   \`\`\`bash
   git subtree push --prefix dist origin gh-pages
   \`\`\`

2. Or use npm script:
   \`\`\`bash
   npm run deploy
   \`\`\`

## Manual Deployment

1. Upload the contents of the \`dist\` folder to your web server
2. Ensure your server is configured to serve static files
3. Update Firebase configuration if needed

## Firebase Configuration

Remember to:
1. Update \`scripts/firebase-config.js\` with your Firebase project credentials
2. Enable Authentication providers in Firebase Console
3. Deploy Firestore security rules

Build Date: ${deployInfo.buildDate}
Version: ${deployInfo.version}
`;
  
  await fs.writeFile(
    path.join(BUILD_DIR, 'DEPLOYMENT.md'),
    deployReadme
  );
}

async function build() {
  console.log('🚀 Starting build process...\n');
  
  try {
    await clean();
    await minifyJavaScript();
    await minifyCSS();
    await copyStaticFiles();
    await processHTML();
    await createDeploymentInfo();
    
    console.log('\n✅ Build complete! Output in:', BUILD_DIR);
    console.log('\n📦 To deploy to GitHub Pages, run: npm run deploy');
    
  } catch (error) {
    console.error('\n❌ Build failed:', error);
    process.exit(1);
  }
}

// Run the build
build();