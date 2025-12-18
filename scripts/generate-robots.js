#!/usr/bin/env node
/**
 * Generate robots.txt with dynamic APP_URL from environment variable
 */

import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_URL = process.env.VITE_APP_URL || 'http://localhost:3000';

const robots = `# FireBook - Smart Bookmark Manager
# ${APP_URL}/

# Global robots.txt settings
User-agent: *
Allow: /

# Crawl-delay to be respectful to search engines
Crawl-delay: 1

# Block access to sensitive directories
Disallow: /api/
Disallow: /.firebase/
Disallow: /.git/
Disallow: /node_modules/
Disallow: /dist/
Disallow: /build/

# Allow access to static assets
Allow: /assets/
Allow: /*.css
Allow: /*.js
Allow: /*.png
Allow: /*.jpg
Allow: /*.jpeg
Allow: /*.gif
Allow: /*.svg
Allow: /*.webp
Allow: /*.ico
Allow: /*.woff
Allow: /*.woff2

# Sitemap location
Sitemap: ${APP_URL}/sitemap.xml
`;

const outputPath = resolve(__dirname, '../dist/robots.txt');
writeFileSync(outputPath, robots, 'utf-8');
console.log(`✅ Generated robots.txt for ${APP_URL}`);
