const {onDocumentCreated} = require('firebase-functions/v2/firestore');
const {onCall, HttpsError} = require('firebase-functions/v2/https');
const {defineSecret} = require('firebase-functions/params');
const admin = require('firebase-admin');

// Define secrets (set via: firebase functions:secrets:set SECRET_NAME)
const aiGatewayUrl = defineSecret('AI_GATEWAY_URL');
const neonDbUrl = defineSecret('NEON_DATABASE_URL');
const axios = require('axios');
const { Pool } = require('pg');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const language = require('@google-cloud/language');
const {Storage} = require('@google-cloud/storage');

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();
const bucket = admin.storage().bucket();

// Initialize Google Cloud Natural Language API
const languageClient = new language.LanguageServiceClient();

/**
 * Fetch metadata from a URL
 * Returns title, description, favicon, and OpenGraph image
 */
async function fetchUrlMetadata(url) {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BookmarksBot/1.0)'
      },
      maxRedirects: 5
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Extract metadata
    const metadata = {
      title: null,
      description: null,
      favicon: null,
      image: null,
      siteName: null,
      fetched: true,
      fetchedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Title: Try OG title, then regular title
    metadata.title =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('title').text() ||
      null;

    // Description: Try OG description, meta description
    metadata.description =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      null;

    // Image: Try OG image, twitter image
    const imageUrl =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      null;

    // Make relative URLs absolute
    if (imageUrl) {
      try {
        const urlObj = new URL(url);
        metadata.image = imageUrl.startsWith('http')
          ? imageUrl
          : `${urlObj.protocol}//${urlObj.host}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
      } catch (e) {
        metadata.image = imageUrl;
      }
    }

    // Favicon: Try various favicon locations
    let faviconUrl =
      $('link[rel="icon"]').attr('href') ||
      $('link[rel="shortcut icon"]').attr('href') ||
      $('link[rel="apple-touch-icon"]').attr('href') ||
      '/favicon.ico';

    // Make favicon URL absolute
    try {
      const urlObj = new URL(url);
      metadata.favicon = faviconUrl.startsWith('http')
        ? faviconUrl
        : `${urlObj.protocol}//${urlObj.host}${faviconUrl.startsWith('/') ? '' : '/'}${faviconUrl}`;
    } catch (e) {
      metadata.favicon = faviconUrl;
    }

    // Site name
    metadata.siteName =
      $('meta[property="og:site_name"]').attr('content') ||
      null;

    // Trim long descriptions
    if (metadata.description && metadata.description.length > 300) {
      metadata.description = metadata.description.substring(0, 297) + '...';
    }

    // Trim long titles
    if (metadata.title && metadata.title.length > 200) {
      metadata.title = metadata.title.substring(0, 197) + '...';
    }

    console.log('Metadata fetched successfully:', {
      url,
      title: metadata.title,
      hasImage: !!metadata.image,
      hasFavicon: !!metadata.favicon
    });

    return metadata;

  } catch (error) {
    console.error('Error fetching metadata:', error.message);

    // Return minimal metadata on error
    return {
      fetched: false,
      fetchedAt: admin.firestore.FieldValue.serverTimestamp(),
      error: error.message
    };
  }
}

/**
 * Helper function: Generate embedding for bookmark text
 * Called by trigger after metadata is fetched
 */
async function generateEmbeddingForBookmark(userId, bookmarkId, bookmark, snap) {
  const gatewayBaseUrl = aiGatewayUrl.value();
  const dbUrl = neonDbUrl.value();

  if (!gatewayBaseUrl || !dbUrl) {
    console.log('Skipping embedding - secrets not configured');
    return;
  }

  // Combine text for embedding
  const textForEmbedding = [
    bookmark.title || '',
    bookmark.desc || bookmark.description || '',
    (bookmark.tags || []).join(' ')
  ].filter(Boolean).join(' ').trim();

  if (!textForEmbedding || textForEmbedding.length < 10) {
    console.log('Skipping embedding - not enough text content');
    return;
  }

  console.log('Auto-generating embedding for:', { bookmarkId, textLength: textForEmbedding.length });

  let pool;
  try {
    // Generate embedding via gateway
    const response = await axios.post(`${gatewayBaseUrl}/api/ai/embed`, {
      text: textForEmbedding
    }, {
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' }
    });

    const embedding = response.data?.embedding;
    if (!embedding || !Array.isArray(embedding)) {
      console.log('Invalid embedding response - skipping');
      return;
    }

    // Store embedding in Neon DB (pgvector)
    pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

    const embeddingStr = `[${embedding.join(',')}]`;
    await pool.query(`
      INSERT INTO bookmarks (firebase_uid, firebase_bookmark_id, title, url, description, embedding)
      VALUES ($1, $2, $3, $4, $5, $6::vector)
      ON CONFLICT (firebase_uid, firebase_bookmark_id)
      DO UPDATE SET
        title = EXCLUDED.title,
        url = EXCLUDED.url,
        description = EXCLUDED.description,
        embedding = EXCLUDED.embedding,
        updated_at = NOW()
    `, [userId, bookmarkId, bookmark.title || '', bookmark.url || '', bookmark.desc || bookmark.description || '', embeddingStr]);

    // Update Firestore with embedding status
    await snap.ref.update({
      hasEmbedding: true,
      embeddingGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
      embeddingDimensions: embedding.length
    });

    console.log('Auto-embedding generated successfully:', { bookmarkId, dimensions: embedding.length });
  } catch (error) {
    console.error('Auto-embedding generation failed:', error.message);
    // Don't update error status - embedding is optional enhancement
  } finally {
    if (pool) await pool.end();
  }
}

/**
 * Cloud Function: Fetch bookmark metadata on creation
 * Triggers when a new bookmark is created
 * Also auto-generates embedding for semantic search
 */
exports.fetchBookmarkMetadata = onDocumentCreated({
  document: 'users/{userId}/bookmarks/{bookmarkId}',
  secrets: [aiGatewayUrl, neonDbUrl]
}, async (event) => {
  const snap = event.data;
  if (!snap) {
    console.log('No data associated with the event');
    return;
  }

  const bookmark = snap.data();
  const { url } = bookmark;
  const { userId, bookmarkId } = event.params;

  // Skip if URL is missing or metadata already fetched
  if (!url || bookmark.fetched) {
    console.log('Skipping metadata fetch - no URL or already fetched');
    return;
  }

  console.log('Fetching metadata for:', url);

  try {
    const metadata = await fetchUrlMetadata(url);

    // Only update fields that are not already set or are empty
    const updates = {};

    if (metadata.title && (!bookmark.title || bookmark.title.trim() === '')) {
      updates.title = metadata.title;
    }

    if (metadata.description) {
      updates.description = metadata.description;
    }

    if (metadata.image) {
      updates.image = metadata.image;
    }

    if (metadata.favicon) {
      updates.favicon = metadata.favicon;
    }

    if (metadata.siteName) {
      updates.siteName = metadata.siteName;
    }

    updates.fetched = metadata.fetched;
    updates.fetchedAt = metadata.fetchedAt;

    if (metadata.error) {
      updates.fetchError = metadata.error;
    }

    // Update the bookmark document
    await snap.ref.update(updates);

    console.log('Metadata updated successfully for bookmark:', bookmarkId);

    // Auto-generate embedding after metadata is fetched
    const updatedBookmark = { ...bookmark, ...updates };
    await generateEmbeddingForBookmark(userId, bookmarkId, updatedBookmark, snap);

  } catch (error) {
    console.error('Failed to fetch or update metadata:', error);

    // Mark as fetch attempted even on failure
    await snap.ref.update({
      fetched: false,
      fetchedAt: admin.firestore.FieldValue.serverTimestamp(),
      fetchError: error.message
    });

    // Still try to generate embedding with original data
    await generateEmbeddingForBookmark(userId, bookmarkId, bookmark, snap);
  }
});

/**
 * Cloud Function: Share collection with user
 * Callable function to add collaborators to a collection
 */
exports.shareCollection = onCall(async (request) => {
  // Verify authentication
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'User must be authenticated to share collections'
    );
  }

  const { collectionId, userEmail, permission } = request.data;
  const currentUserId = request.auth.uid;

  // Validate input
  if (!collectionId || !userEmail || !permission) {
    throw new HttpsError(
      'invalid-argument',
      'Missing required fields: collectionId, userEmail, permission'
    );
  }

  if (!['viewer', 'editor'].includes(permission)) {
    throw new HttpsError(
      'invalid-argument',
      'Permission must be "viewer" or "editor"'
    );
  }

  try {
    // Get the collection
    const collectionRef = db.collection('collections').doc(collectionId);
    const collectionDoc = await collectionRef.get();

    if (!collectionDoc.exists) {
      throw new HttpsError('not-found', 'Collection not found');
    }

    const collection = collectionDoc.data();

    // Verify current user is the owner
    if (collection.ownerId !== currentUserId) {
      throw new HttpsError(
        'permission-denied',
        'Only the collection owner can share it'
      );
    }

    // Find user by email
    let targetUser;
    try {
      targetUser = await admin.auth().getUserByEmail(userEmail);
    } catch (error) {
      throw new HttpsError(
        'not-found',
        'No user found with that email address'
      );
    }

    // Don't allow sharing with yourself
    if (targetUser.uid === currentUserId) {
      throw new HttpsError(
        'invalid-argument',
        'Cannot share collection with yourself'
      );
    }

    // Update collection with new collaborator
    const collaborators = collection.collaborators || {};
    collaborators[targetUser.uid] = {
      email: userEmail,
      permission,
      addedAt: admin.firestore.FieldValue.serverTimestamp(),
      addedBy: currentUserId
    };

    await collectionRef.update({ collaborators });

    // Create a notification for the target user (optional)
    await db.collection('notifications').add({
      userId: targetUser.uid,
      type: 'collection_shared',
      collectionId,
      collectionName: collection.name,
      sharedBy: currentUserId,
      sharedByEmail: request.auth.token.email,
      permission,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false
    });

    console.log(`Collection ${collectionId} shared with ${userEmail} as ${permission}`);

    return {
      success: true,
      message: `Collection shared with ${userEmail}`,
      userId: targetUser.uid
    };

  } catch (error) {
    console.error('Error sharing collection:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', error.message);
  }
});

/**
 * Cloud Function: Remove collaborator from collection
 * Callable function to remove a user's access to a collection
 */
exports.removeCollaborator = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const { collectionId, userId } = request.data;
  const currentUserId = request.auth.uid;

  if (!collectionId || !userId) {
    throw new HttpsError(
      'invalid-argument',
      'Missing collectionId or userId'
    );
  }

  try {
    const collectionRef = db.collection('collections').doc(collectionId);
    const collectionDoc = await collectionRef.get();

    if (!collectionDoc.exists) {
      throw new HttpsError('not-found', 'Collection not found');
    }

    const collection = collectionDoc.data();

    // Verify current user is the owner
    if (collection.ownerId !== currentUserId) {
      throw new HttpsError(
        'permission-denied',
        'Only the collection owner can remove collaborators'
      );
    }

    // Remove collaborator
    const collaborators = collection.collaborators || {};
    delete collaborators[userId];

    await collectionRef.update({ collaborators });

    console.log(`Removed user ${userId} from collection ${collectionId}`);

    return { success: true, message: 'Collaborator removed' };

  } catch (error) {
    console.error('Error removing collaborator:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', error.message);
  }
});

/**
 * Helper function to delay execution (replaces deprecated page.waitForTimeout)
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Configure page to bypass bot detection
 * @param {import('puppeteer-core').Page} page - Puppeteer page instance
 */
async function configurePageForStealth(page) {
  // Set realistic user agent
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );

  // Disable webdriver detection
  await page.evaluateOnNewDocument(() => {
    // Remove webdriver property
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });

    // Mock plugins array
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });

    // Mock languages
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
    });
  });

  // Set extra HTTP headers
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  });
}

/**
 * Attempt to navigate to URL with fallback strategies
 * @param {import('puppeteer-core').Page} page - Puppeteer page instance
 * @param {string} url - URL to navigate to
 * @returns {Promise<boolean>} - Whether navigation succeeded
 */
async function navigateWithFallback(page, url) {
  const strategies = [
    { waitUntil: 'networkidle2', timeout: 20000 },
    { waitUntil: 'domcontentloaded', timeout: 15000 },
    { waitUntil: 'load', timeout: 10000 },
  ];

  for (const strategy of strategies) {
    try {
      await page.goto(url, strategy);
      console.log(`Navigation succeeded with strategy: ${strategy.waitUntil}`);
      return true;
    } catch (navError) {
      console.log(`Navigation with ${strategy.waitUntil} failed: ${navError.message}`);
      // Continue to next strategy
    }
  }

  return false;
}

/**
 * Cloud Function: Capture screenshot of bookmarked website
 * Triggers when a new bookmark is created
 *
 * Features:
 * - Bot detection bypass (user agent, webdriver masking)
 * - Multiple navigation strategies with fallback
 * - Graceful error handling with specific error categories
 */
exports.captureScreenshot = onDocumentCreated({
  document: 'users/{userId}/bookmarks/{bookmarkId}',
  memory: '2GiB',
  timeoutSeconds: 60
}, async (event) => {
  const snap = event.data;
  if (!snap) {
    console.log('No data associated with the event');
    return;
  }

  const bookmark = snap.data();
  const { url } = bookmark;
  const bookmarkId = event.params.bookmarkId;
  const userId = event.params.userId;

  // Skip if URL is missing or screenshot already exists
  if (!url || bookmark.screenshot) {
    console.log('Skipping screenshot - no URL or already captured');
    return;
  }

  // Validate URL format
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      console.log('Invalid URL protocol:', parsedUrl.protocol);
      await snap.ref.update({
        screenshotError: 'Invalid URL protocol - must be http or https',
        screenshotAttemptedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return;
    }
  } catch (urlError) {
    console.log('Invalid URL format:', url);
    await snap.ref.update({
      screenshotError: 'Invalid URL format',
      screenshotAttemptedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return;
  }

  console.log('Capturing screenshot for:', url);

  let browser;
  try {
    // Get Chrome executable path with explicit error handling
    let execPath;
    try {
      execPath = await chromium.executablePath();
      console.log('Chrome executable path:', execPath);

      if (!execPath) {
        throw new Error('chromium.executablePath() returned falsy value');
      }
    } catch (pathError) {
      console.error('Failed to get Chrome executable path:', pathError);
      await snap.ref.update({
        screenshotError: `Chrome executable not found: ${pathError.message}`,
        screenshotErrorCategory: 'chrome_not_found',
        screenshotAttemptedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return;
    }

    // Launch Puppeteer with Chromium for Cloud Functions
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1280,800',
      ],
      defaultViewport: null, // We'll set this manually
      executablePath: execPath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    // Configure stealth mode to bypass bot detection
    await configurePageForStealth(page);

    // Set viewport for consistent screenshots
    await page.setViewport({
      width: 1280,
      height: 800,
      deviceScaleFactor: 1
    });

    // Set reasonable timeouts
    page.setDefaultNavigationTimeout(25000);
    page.setDefaultTimeout(25000);

    // Navigate with fallback strategies
    const navigationSuccess = await navigateWithFallback(page, url);

    if (!navigationSuccess) {
      throw new Error('All navigation strategies failed');
    }

    // Wait for page to stabilize (animations, lazy loading)
    // Using setTimeout-based delay instead of deprecated waitForTimeout
    await delay(2000);

    // Try to dismiss common overlays (cookie banners, popups)
    try {
      await page.evaluate(() => {
        // Common cookie banner selectors
        const overlaySelectors = [
          '[class*="cookie"] button',
          '[class*="consent"] button',
          '[id*="cookie"] button',
          '[class*="popup"] [class*="close"]',
          '[class*="modal"] [class*="close"]',
          'button[aria-label*="close"]',
          'button[aria-label*="Close"]',
          'button[aria-label*="dismiss"]',
          'button[aria-label*="Accept"]',
        ];

        for (const selector of overlaySelectors) {
          const buttons = document.querySelectorAll(selector);
          buttons.forEach(btn => {
            if (btn.offsetParent !== null) { // Check if visible
              btn.click();
            }
          });
        }
      });
      // Brief wait after dismissing overlays
      await delay(500);
    } catch (overlayError) {
      // Ignore overlay dismissal errors - not critical
      console.log('Could not dismiss overlays (non-critical):', overlayError.message);
    }

    // Capture screenshot
    const screenshot = await page.screenshot({
      type: 'jpeg',
      quality: 80,
      fullPage: false
    });

    await browser.close();
    browser = null;

    // Upload to Firebase Storage
    const fileName = `screenshots/${userId}/${bookmarkId}.jpg`;
    const file = bucket.file(fileName);

    await file.save(screenshot, {
      metadata: {
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000', // Cache for 1 year
        metadata: {
          bookmarkId,
          userId,
          url,
          capturedAt: new Date().toISOString()
        }
      }
    });

    // Make file publicly readable
    await file.makePublic();

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    // Update bookmark with screenshot URL
    await snap.ref.update({
      screenshot: publicUrl,
      screenshotCapturedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('Screenshot captured and uploaded:', publicUrl);

  } catch (error) {
    console.error('Error capturing screenshot:', error);

    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError.message);
      }
    }

    // Categorize error for better debugging
    let errorCategory = 'unknown';
    const errorMessage = error.message || 'Unknown error';

    if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
      errorCategory = 'timeout';
    } else if (errorMessage.includes('net::ERR_')) {
      errorCategory = 'network';
    } else if (errorMessage.includes('navigation')) {
      errorCategory = 'navigation';
    } else if (errorMessage.includes('Protocol error')) {
      errorCategory = 'browser_crash';
    }

    // Mark as screenshot attempted with categorized error
    await snap.ref.update({
      screenshotError: errorMessage.substring(0, 500), // Limit error message length
      screenshotErrorCategory: errorCategory,
      screenshotAttemptedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
});

/**
 * Cloud Function: Auto-tag bookmarks using ML Kit
 * Analyzes title, description, and content to suggest relevant tags
 */
exports.autoTagBookmark = onDocumentCreated({
  document: 'users/{userId}/bookmarks/{bookmarkId}',
  memory: '512MiB',
  timeoutSeconds: 30
}, async (event) => {
  const snap = event.data;
  if (!snap) {
    console.log('No data associated with the event');
    return;
  }

  const bookmark = snap.data();
  const { title, description, url } = bookmark;

  // Skip if already auto-tagged or missing content
  if (bookmark.autoTagged || (!title && !description)) {
    console.log('Skipping auto-tagging - already tagged or missing content');
    return;
  }

  console.log('Auto-tagging bookmark:', title);

  try {
    // Combine title and description for analysis
    const text = `${title || ''} ${description || ''}`.trim();

    // Get domain-based tag first (always works)
    let domainTag = null;
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace('www.', '');
      domainTag = hostname.split('.')[0];
      // Capitalize first letter
      domainTag = domainTag.charAt(0).toUpperCase() + domainTag.slice(1);
    } catch (e) {
      console.log('Invalid URL for domain tag');
    }

    // Count words - Natural Language API needs at least 20 tokens
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;

    if (wordCount < 20) {
      console.log(`Text too short for NLP analysis (${wordCount} words). Using domain tag only.`);
      // Just use domain tag if available
      await snap.ref.update({
        suggestedTags: domainTag ? [domainTag] : [],
        autoTagged: true,
        autoTaggedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return;
    }

      // Analyze text with Natural Language API
      const document = {
        content: text,
        type: 'PLAIN_TEXT'
      };

      // Get both categories and entities
      const [classification] = await languageClient.classifyText({ document });
      const [entities] = await languageClient.analyzeEntities({ document });

      // Extract categories
      const categories = classification.categories
        .filter(cat => cat.confidence > 0.5)
        .map(cat => {
          // Clean up category names (e.g., "/Computers & Electronics/Programming" -> "Programming")
          const parts = cat.name.split('/').filter(p => p);
          return parts[parts.length - 1];
        })
        .slice(0, 5);

      // Extract entities (named things mentioned in text)
      const entityTags = entities.entities
        .filter(entity => entity.salience > 0.1) // Only significant entities
        .filter(entity => ['PERSON', 'ORGANIZATION', 'EVENT', 'WORK_OF_ART', 'CONSUMER_GOOD'].includes(entity.type))
        .map(entity => entity.name)
        .slice(0, 5);

      // Combine and deduplicate tags
      const allTags = [...new Set([...categories, ...entityTags])];

      // Add domain tag to the front if available
      const suggestedTags = domainTag
        ? [domainTag, ...allTags]
        : allTags;

      // Update bookmark with suggested tags
      await snap.ref.update({
        suggestedTags: suggestedTags.slice(0, 8), // Limit to 8 tags
        autoTagged: true,
        autoTaggedAt: admin.firestore.FieldValue.serverTimestamp()
      });

    console.log('Auto-tags generated:', suggestedTags);

  } catch (error) {
    console.error('Error auto-tagging bookmark:', error);

    // Check if it's an error about insufficient text
    if (error.message && (
      error.message.includes('too few tokens') ||
      error.message.includes('does not have enough text') ||
      error.message.includes('INVALID_ARGUMENT')
    )) {
      console.log('Document too short for NLP classification. Using domain tag only.');

      // Get domain tag as fallback
      let domainTag = null;
      try {
        const urlObj = new URL(bookmark.url);
        const hostname = urlObj.hostname.replace('www.', '');
        domainTag = hostname.split('.')[0];
        domainTag = domainTag.charAt(0).toUpperCase() + domainTag.slice(1);
      } catch (e) {
        console.log('Could not extract domain tag');
      }

      await snap.ref.update({
        autoTagged: true,
        autoTaggedAt: admin.firestore.FieldValue.serverTimestamp(),
        suggestedTags: domainTag ? [domainTag] : []
      });
    } else {
      // Mark as auto-tag attempted with error
      await snap.ref.update({
        autoTagError: error.message,
        autoTagAttemptedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  }
});

/**
 * Cloud Function: Enhance bookmark with AI-powered description and tags
 * Callable function that proxies to shared-ai-gateway
 *
 * Requires:
 * - AI_GATEWAY_URL secret to be set (firebase functions:secrets:set AI_GATEWAY_URL)
 * - User to be authenticated
 *
 * Returns: { success: true, tags: string[], description: string | null }
 */
exports.enhanceBookmarkWithAI = onCall({
  secrets: [aiGatewayUrl],
  memory: '256MiB',
  timeoutSeconds: 30
}, async (request) => {
  // Verify authentication
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'User must be authenticated to enhance bookmarks'
    );
  }

  const { bookmarkId } = request.data;
  const userId = request.auth.uid;

  // Validate input
  if (!bookmarkId) {
    throw new HttpsError(
      'invalid-argument',
      'Missing required field: bookmarkId'
    );
  }

  // Get the bookmark document
  const bookmarkRef = db.collection('users').doc(userId)
    .collection('bookmarks').doc(bookmarkId);
  const bookmarkDoc = await bookmarkRef.get();

  if (!bookmarkDoc.exists) {
    throw new HttpsError('not-found', 'Bookmark not found');
  }

  const bookmark = bookmarkDoc.data();
  const { title, desc, url } = bookmark;

  console.log('Enhancing bookmark with AI:', { bookmarkId, title });

  try {
    const gatewayBaseUrl = aiGatewayUrl.value();

    if (!gatewayBaseUrl) {
      throw new Error('AI_GATEWAY_URL secret is not configured');
    }

    // Make parallel requests to gateway for tags and description
    const [tagsResponse, descResponse] = await Promise.all([
      axios.post(`${gatewayBaseUrl}/api/ai/tags`, {
        title: title || '',
        url: url || '',
        description: desc || '',
        useAI: true
      }, {
        timeout: 25000,
        headers: { 'Content-Type': 'application/json' }
      }),

      axios.post(`${gatewayBaseUrl}/api/ai/describe`, {
        title: title || '',
        url: url || '',
        existingDescription: desc || ''
      }, {
        timeout: 25000,
        headers: { 'Content-Type': 'application/json' }
      })
    ]);

    // Prepare updates
    const updates = {
      aiEnhanced: true,
      aiEnhancedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Extract tags from response
    if (tagsResponse.data?.tags && Array.isArray(tagsResponse.data.tags)) {
      updates.aiEnhancedTags = tagsResponse.data.tags.slice(0, 8);
    }

    // Extract description from response
    if (descResponse.data?.description) {
      updates.aiDescription = descResponse.data.description;
    }

    // Update bookmark document
    await bookmarkRef.update(updates);

    console.log('Bookmark enhanced successfully:', {
      bookmarkId,
      tagsCount: updates.aiEnhancedTags?.length || 0,
      hasDescription: !!updates.aiDescription
    });

    return {
      success: true,
      tags: updates.aiEnhancedTags || [],
      description: updates.aiDescription || null
    };

  } catch (error) {
    console.error('Error enhancing bookmark with AI:', error.message);

    // Store error in Firestore for UI display
    await bookmarkRef.update({
      aiEnhanceError: error.message,
      aiEnhanceAttemptedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Return appropriate error to client
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new HttpsError('unavailable', 'AI gateway is temporarily unavailable');
    }

    if (error.response?.status === 400) {
      throw new HttpsError('invalid-argument', error.response.data?.error || 'Invalid request');
    }

    throw new HttpsError('internal', 'Failed to enhance bookmark with AI');
  }
});

/**
 * Helper: Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * Cloud Function: Generate embedding for a bookmark
 * Callable function that proxies to shared-ai-gateway /api/ai/embed
 * Stores embedding in Neon DB (pgvector) for efficient similarity search
 *
 * Returns: { success: true, dimensions: number }
 */
exports.generateBookmarkEmbedding = onCall({
  secrets: [aiGatewayUrl, neonDbUrl],
  memory: '256MiB',
  timeoutSeconds: 30
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { bookmarkId } = request.data;
  const userId = request.auth.uid;

  if (!bookmarkId) {
    throw new HttpsError('invalid-argument', 'Missing bookmarkId');
  }

  // Bookmarks are in user subcollection
  const bookmarkRef = db.collection('users').doc(userId).collection('bookmarks').doc(bookmarkId);
  const bookmarkDoc = await bookmarkRef.get();

  if (!bookmarkDoc.exists) {
    throw new HttpsError('not-found', 'Bookmark not found');
  }

  const bookmark = bookmarkDoc.data();

  // Combine text for embedding
  const textForEmbedding = [
    bookmark.title || '',
    bookmark.desc || bookmark.description || bookmark.aiDescription || '',
    (bookmark.aiEnhancedTags || bookmark.tags || []).join(' ')
  ].filter(Boolean).join(' ').trim();

  if (!textForEmbedding) {
    throw new HttpsError('invalid-argument', 'Bookmark has no text content to embed');
  }

  console.log('Generating embedding for bookmark:', { bookmarkId, textLength: textForEmbedding.length });

  let pool;
  try {
    const gatewayBaseUrl = aiGatewayUrl.value();
    const dbUrl = neonDbUrl.value();

    if (!gatewayBaseUrl) {
      throw new Error('AI_GATEWAY_URL secret is not configured');
    }
    if (!dbUrl) {
      throw new Error('NEON_DATABASE_URL secret is not configured');
    }

    // Generate embedding via gateway
    const response = await axios.post(`${gatewayBaseUrl}/api/ai/embed`, {
      text: textForEmbedding
    }, {
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' }
    });

    const embedding = response.data?.embedding;
    if (!embedding || !Array.isArray(embedding)) {
      throw new Error('Invalid embedding response from gateway');
    }

    // Store embedding in Neon DB (pgvector)
    pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

    // Upsert bookmark with embedding
    const embeddingStr = `[${embedding.join(',')}]`;
    await pool.query(`
      INSERT INTO bookmarks (firebase_uid, firebase_bookmark_id, title, url, description, embedding)
      VALUES ($1, $2, $3, $4, $5, $6::vector)
      ON CONFLICT (firebase_uid, firebase_bookmark_id)
      DO UPDATE SET
        title = EXCLUDED.title,
        url = EXCLUDED.url,
        description = EXCLUDED.description,
        embedding = EXCLUDED.embedding,
        updated_at = NOW()
    `, [userId, bookmarkId, bookmark.title || '', bookmark.url || '', bookmark.desc || bookmark.description || '', embeddingStr]);

    // Update Firestore with embedding status (not the actual embedding)
    await bookmarkRef.update({
      hasEmbedding: true,
      embeddingGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
      embeddingDimensions: embedding.length
    });

    console.log('Embedding generated and stored in Neon:', { bookmarkId, dimensions: embedding.length });

    return {
      success: true,
      dimensions: embedding.length
    };

  } catch (error) {
    console.error('Error generating embedding:', error.message);

    await bookmarkRef.update({
      embeddingError: error.message,
      embeddingAttemptedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new HttpsError('unavailable', 'AI gateway is temporarily unavailable');
    }
    throw new HttpsError('internal', 'Failed to generate embedding');
  } finally {
    if (pool) await pool.end();
  }
});

/**
 * Cloud Function: Find similar bookmarks
 * Uses pgvector in Neon DB for efficient similarity search
 *
 * Returns: { success: true, similar: [{ id, title, similarity }] }
 */
exports.findSimilarBookmarks = onCall({
  secrets: [neonDbUrl],
  memory: '256MiB',
  timeoutSeconds: 30
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { bookmarkId, limit = 10, threshold = 0.5 } = request.data;
  const userId = request.auth.uid;

  if (!bookmarkId) {
    throw new HttpsError('invalid-argument', 'Missing bookmarkId');
  }

  // Bookmarks are in user subcollection
  const sourceRef = db.collection('users').doc(userId).collection('bookmarks').doc(bookmarkId);
  const sourceDoc = await sourceRef.get();

  if (!sourceDoc.exists) {
    throw new HttpsError('not-found', 'Bookmark not found');
  }

  const sourceBookmark = sourceDoc.data();

  if (!sourceBookmark.hasEmbedding) {
    throw new HttpsError('failed-precondition', 'Bookmark has no embedding. Generate one first.');
  }

  let pool;
  try {
    const dbUrl = neonDbUrl.value();
    if (!dbUrl) {
      throw new Error('NEON_DATABASE_URL secret is not configured');
    }

    pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

    // Use pgvector's cosine distance operator for efficient similarity search
    // <=> returns cosine distance (1 - similarity), so we convert back to similarity
    const result = await pool.query(`
      WITH source AS (
        SELECT embedding FROM bookmarks
        WHERE firebase_uid = $1 AND firebase_bookmark_id = $2
      )
      SELECT
        b.firebase_bookmark_id as id,
        b.title,
        b.url,
        1 - (b.embedding <=> source.embedding) as similarity
      FROM bookmarks b, source
      WHERE b.firebase_uid = $1
        AND b.firebase_bookmark_id != $2
        AND b.embedding IS NOT NULL
        AND 1 - (b.embedding <=> source.embedding) >= $3
      ORDER BY b.embedding <=> source.embedding
      LIMIT $4
    `, [userId, bookmarkId, threshold, limit]);

    const similar = result.rows.map(row => ({
      id: row.id,
      title: row.title || 'Untitled',
      url: row.url,
      similarity: Math.round(row.similarity * 100) / 100
    }));

    console.log('Found similar bookmarks:', { sourceId: bookmarkId, count: similar.length });

    return {
      success: true,
      similar
    };

  } catch (error) {
    console.error('Error finding similar bookmarks:', error.message);
    throw new HttpsError('internal', 'Failed to find similar bookmarks');
  } finally {
    if (pool) await pool.end();
  }
});

/**
 * Cloud Function: Suggest smart collections based on embedding clusters
 * Fetches embeddings from Neon DB and uses greedy clustering
 *
 * Returns: { success: true, collections: [{ name, bookmarks: [...] }] }
 */
exports.suggestSmartCollections = onCall({
  secrets: [neonDbUrl],
  memory: '512MiB',
  timeoutSeconds: 60
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { minClusterSize = 3, similarityThreshold = 0.6 } = request.data;
  const userId = request.auth.uid;

  let pool;
  try {
    const dbUrl = neonDbUrl.value();
    if (!dbUrl) {
      throw new Error('NEON_DATABASE_URL secret is not configured');
    }

    pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

    // Get all bookmarks with embeddings from Neon
    const result = await pool.query(`
      SELECT firebase_bookmark_id as id, title, url, embedding::text
      FROM bookmarks
      WHERE firebase_uid = $1 AND embedding IS NOT NULL
    `, [userId]);

    if (result.rows.length === 0) {
      return { success: true, collections: [], message: 'No bookmarks with embeddings found' };
    }

    // Parse embeddings from text format back to arrays
    const bookmarks = result.rows.map(row => ({
      id: row.id,
      title: row.title || 'Untitled',
      url: row.url,
      embedding: JSON.parse(row.embedding)
    }));

    console.log('Clustering bookmarks:', { count: bookmarks.length });

    if (bookmarks.length < minClusterSize) {
      return {
        success: true,
        collections: [],
        message: `Need at least ${minClusterSize} bookmarks with embeddings`
      };
    }

    // Fetch tags from Firestore for collection naming
    // Bookmarks are in user subcollection
    const tagsMap = {};
    const bookmarkRefs = bookmarks.map(b => db.collection('users').doc(userId).collection('bookmarks').doc(b.id));
    const bookmarkDocs = await db.getAll(...bookmarkRefs);
    bookmarkDocs.forEach(doc => {
      if (doc.exists) {
        const data = doc.data();
        // Convert tags to array if it's a string
        let tags = data.aiEnhancedTags || data.tags || [];
        if (typeof tags === 'string') {
          tags = tags.split(',').map(t => t.trim()).filter(Boolean);
        }
        tagsMap[doc.id] = tags;
      }
    });

    // Simple greedy clustering
    const clusters = [];
    const assigned = new Set();

    for (let i = 0; i < bookmarks.length; i++) {
      if (assigned.has(bookmarks[i].id)) continue;

      const cluster = [bookmarks[i]];
      assigned.add(bookmarks[i].id);

      // Find similar bookmarks
      for (let j = i + 1; j < bookmarks.length; j++) {
        if (assigned.has(bookmarks[j].id)) continue;

        const similarity = cosineSimilarity(bookmarks[i].embedding, bookmarks[j].embedding);
        if (similarity >= similarityThreshold) {
          cluster.push(bookmarks[j]);
          assigned.add(bookmarks[j].id);
        }
      }

      if (cluster.length >= minClusterSize) {
        // Generate collection name from common tags
        const tagCounts = {};
        cluster.forEach(b => {
          (tagsMap[b.id] || []).forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        });

        const sortedTags = Object.entries(tagCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 2)
          .map(([tag]) => tag);

        const collectionName = sortedTags.length > 0
          ? sortedTags.join(' & ')
          : `Collection ${clusters.length + 1}`;

        clusters.push({
          name: collectionName,
          bookmarkCount: cluster.length,
          bookmarks: cluster.map(b => ({
            id: b.id,
            title: b.title,
            url: b.url
          }))
        });
      }
    }

    console.log('Smart collections suggested:', { count: clusters.length });

    return {
      success: true,
      collections: clusters
    };

  } catch (error) {
    console.error('Error suggesting smart collections:', error.message);
    throw new HttpsError('internal', 'Failed to suggest smart collections');
  } finally {
    if (pool) await pool.end();
  }
});
