const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
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
 * Cloud Function: Fetch bookmark metadata on creation
 * Triggers when a new bookmark is created
 */
exports.fetchBookmarkMetadata = functions.firestore
  .document('users/{userId}/bookmarks/{bookmarkId}')
  .onCreate(async (snap, context) => {
    const bookmark = snap.data();
    const { url } = bookmark;

    // Skip if URL is missing or metadata already fetched
    if (!url || bookmark.fetched) {
      console.log('Skipping metadata fetch - no URL or already fetched');
      return null;
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

      console.log('Metadata updated successfully for bookmark:', context.params.bookmarkId);
      return null;

    } catch (error) {
      console.error('Failed to fetch or update metadata:', error);

      // Mark as fetch attempted even on failure
      await snap.ref.update({
        fetched: false,
        fetchedAt: admin.firestore.FieldValue.serverTimestamp(),
        fetchError: error.message
      });

      return null;
    }
  });

/**
 * Cloud Function: Share collection with user
 * Callable function to add collaborators to a collection
 */
exports.shareCollection = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to share collections'
    );
  }

  const { collectionId, userEmail, permission } = data;
  const currentUserId = context.auth.uid;

  // Validate input
  if (!collectionId || !userEmail || !permission) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required fields: collectionId, userEmail, permission'
    );
  }

  if (!['viewer', 'editor'].includes(permission)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Permission must be "viewer" or "editor"'
    );
  }

  try {
    // Get the collection
    const collectionRef = db.collection('collections').doc(collectionId);
    const collectionDoc = await collectionRef.get();

    if (!collectionDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Collection not found');
    }

    const collection = collectionDoc.data();

    // Verify current user is the owner
    if (collection.ownerId !== currentUserId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only the collection owner can share it'
      );
    }

    // Find user by email
    let targetUser;
    try {
      targetUser = await admin.auth().getUserByEmail(userEmail);
    } catch (error) {
      throw new functions.https.HttpsError(
        'not-found',
        'No user found with that email address'
      );
    }

    // Don't allow sharing with yourself
    if (targetUser.uid === currentUserId) {
      throw new functions.https.HttpsError(
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
      sharedByEmail: context.auth.token.email,
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

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Cloud Function: Remove collaborator from collection
 * Callable function to remove a user's access to a collection
 */
exports.removeCollaborator = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const { collectionId, userId } = data;
  const currentUserId = context.auth.uid;

  if (!collectionId || !userId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing collectionId or userId'
    );
  }

  try {
    const collectionRef = db.collection('collections').doc(collectionId);
    const collectionDoc = await collectionRef.get();

    if (!collectionDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Collection not found');
    }

    const collection = collectionDoc.data();

    // Verify current user is the owner
    if (collection.ownerId !== currentUserId) {
      throw new functions.https.HttpsError(
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

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Cloud Function: Capture screenshot of bookmarked website
 * Triggers after metadata is fetched
 */
exports.captureScreenshot = functions
  .runWith({
    memory: '2GB',
    timeoutSeconds: 60
  })
  .firestore
  .document('users/{userId}/bookmarks/{bookmarkId}')
  .onCreate(async (snap, context) => {
    const bookmark = snap.data();
    const { url } = bookmark;
    const bookmarkId = context.params.bookmarkId;
    const userId = context.params.userId;

    // Skip if URL is missing or screenshot already exists
    if (!url || bookmark.screenshot) {
      console.log('Skipping screenshot - no URL or already captured');
      return null;
    }

    console.log('Capturing screenshot for:', url);

    let browser;
    try {
      // Launch Puppeteer
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      });

      const page = await browser.newPage();

      // Set viewport for consistent screenshots
      await page.setViewport({
        width: 1280,
        height: 800,
        deviceScaleFactor: 1
      });

      // Set timeout and navigate to URL
      await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // Wait a bit for any animations/lazy loading
      await page.waitForTimeout(2000);

      // Capture screenshot
      const screenshot = await page.screenshot({
        type: 'jpeg',
        quality: 80,
        fullPage: false
      });

      await browser.close();

      // Upload to Firebase Storage
      const fileName = `screenshots/${userId}/${bookmarkId}.jpg`;
      const file = bucket.file(fileName);

      await file.save(screenshot, {
        metadata: {
          contentType: 'image/jpeg',
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
      return null;

    } catch (error) {
      console.error('Error capturing screenshot:', error);

      if (browser) {
        await browser.close();
      }

      // Mark as screenshot attempted
      await snap.ref.update({
        screenshotError: error.message,
        screenshotAttemptedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return null;
    }
  });

/**
 * Cloud Function: Auto-tag bookmarks using ML Kit
 * Analyzes title, description, and content to suggest relevant tags
 */
exports.autoTagBookmark = functions
  .runWith({
    memory: '512MB',
    timeoutSeconds: 30
  })
  .firestore
  .document('users/{userId}/bookmarks/{bookmarkId}')
  .onCreate(async (snap, context) => {
    const bookmark = snap.data();
    const { title, description, url } = bookmark;

    // Skip if already auto-tagged or missing content
    if (bookmark.autoTagged || (!title && !description)) {
      console.log('Skipping auto-tagging - already tagged or missing content');
      return null;
    }

    console.log('Auto-tagging bookmark:', title);

    try {
      // Combine title and description for analysis
      const text = `${title || ''} ${description || ''}`.trim();

      if (text.length < 10) {
        console.log('Text too short for meaningful analysis');
        return null;
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

      // Get domain-based tag (e.g., "github.com" -> "GitHub")
      let domainTag = null;
      try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.replace('www.', '');
        domainTag = hostname.split('.')[0];

        // Capitalize first letter
        domainTag = domainTag.charAt(0).toUpperCase() + domainTag.slice(1);
      } catch (e) {
        // Invalid URL, skip domain tag
      }

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
      return null;

    } catch (error) {
      console.error('Error auto-tagging bookmark:', error);

      // Check if it's an error about text being too short
      if (error.message && error.message.includes('does not have enough text')) {
        console.log('Document too short for classification');
        await snap.ref.update({
          autoTagged: true,
          autoTaggedAt: admin.firestore.FieldValue.serverTimestamp(),
          suggestedTags: []
        });
      } else {
        // Mark as auto-tag attempted
        await snap.ref.update({
          autoTagError: error.message,
          autoTagAttemptedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      return null;
    }
  });
