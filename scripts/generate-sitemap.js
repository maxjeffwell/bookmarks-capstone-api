#!/usr/bin/env node
/**
 * Generate sitemap.xml with dynamic APP_URL from environment variable
 */

import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_URL = process.env.VITE_APP_URL || 'http://localhost:3000';

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">

  <!-- Homepage -->
  <url>
    <loc>${APP_URL}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <image:image>
      <image:loc>${APP_URL}/assets/og-image.png</image:loc>
      <image:caption>FireBook - Smart Bookmark Manager</image:caption>
      <image:title>FireBook Bookmark Manager Interface</image:title>
    </image:image>
  </url>

  <!-- Additional pages can be added here -->
  <url>
    <loc>${APP_URL}/README.md</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>

  <url>
    <loc>${APP_URL}/FIREBASE_SETUP.md</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>

  <url>
    <loc>${APP_URL}/FIREBASE_AUTH_SETUP.md</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>

  <url>
    <loc>${APP_URL}/ADBLOCKER_HELP.md</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>

</urlset>`;

const outputPath = resolve(__dirname, '../dist/sitemap.xml');
writeFileSync(outputPath, sitemap, 'utf-8');
console.log(`✅ Generated sitemap.xml for ${APP_URL}`);
