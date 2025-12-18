#!/usr/bin/env node
/**
 * Backfill AI tags on existing bookmarks
 *
 * This script runs the same auto-tagging logic as the Cloud Function
 * on bookmarks that haven't been tagged yet.
 *
 * Usage:
 *   node scripts/backfill-autoTag.js           # Run the backfill
 *   node scripts/backfill-autoTag.js --dry-run # Preview changes
 */

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { LanguageServiceClient } from '@google-cloud/language';

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

// Firebase project configuration
const PROJECT_ID = 'marmoset-c2870';

console.log('🤖 Bookmark Auto-Tag Backfill Script');
console.log('====================================');
if (isDryRun) {
  console.log('🔍 DRY RUN MODE - No changes will be made\n');
}

// Initialize Firebase Admin SDK
let app;
try {
  app = initializeApp({
    credential: applicationDefault(),
    projectId: PROJECT_ID,
  });
  console.log('✅ Initialized Firebase Admin SDK');
} catch (error) {
  console.error('❌ Failed to initialize Firebase:', error.message);
  process.exit(1);
}

const db = getFirestore();

// Initialize Google Cloud Natural Language API
let languageClient;
try {
  languageClient = new LanguageServiceClient();
  console.log('✅ Initialized Natural Language API\n');
} catch (error) {
  console.error('❌ Failed to initialize Language API:', error.message);
  process.exit(1);
}

/**
 * Extract domain-based tag from URL
 */
function getDomainTag(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');
    let domainTag = hostname.split('.')[0];
    // Capitalize first letter
    return domainTag.charAt(0).toUpperCase() + domainTag.slice(1);
  } catch (e) {
    return null;
  }
}

/**
 * Analyze text and generate tags using Natural Language API
 */
async function generateTags(title, description, url) {
  const text = `${title || ''} ${description || ''}`.trim();
  const domainTag = getDomainTag(url);

  // Count words
  const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;

  // If text is too short, just use domain tag
  if (wordCount < 20) {
    console.log(`     ⚠️  Text too short (${wordCount} words) - using domain tag only`);
    return {
      suggestedTags: domainTag ? [domainTag] : [],
      method: 'domain-only'
    };
  }

  try {
    const document = {
      content: text,
      type: 'PLAIN_TEXT'
    };

    // Get categories and entities from Natural Language API
    const [classification] = await languageClient.classifyText({ document });
    const [entities] = await languageClient.analyzeEntities({ document });

    // Extract categories
    const categories = classification.categories
      .filter(cat => cat.confidence > 0.5)
      .map(cat => {
        const parts = cat.name.split('/').filter(p => p);
        return parts[parts.length - 1];
      })
      .slice(0, 5);

    // Extract entities
    const entityTags = entities.entities
      .filter(entity => entity.salience > 0.1)
      .filter(entity => ['PERSON', 'ORGANIZATION', 'EVENT', 'WORK_OF_ART', 'CONSUMER_GOOD'].includes(entity.type))
      .map(entity => entity.name)
      .slice(0, 5);

    // Combine and deduplicate
    const allTags = [...new Set([...categories, ...entityTags])];

    // Add domain tag to the front
    const suggestedTags = domainTag
      ? [domainTag, ...allTags]
      : allTags;

    return {
      suggestedTags: suggestedTags.slice(0, 8),
      method: 'nlp'
    };

  } catch (error) {
    // Handle NLP errors - fall back to domain tag
    if (error.message && (
      error.message.includes('too few tokens') ||
      error.message.includes('does not have enough text') ||
      error.message.includes('INVALID_ARGUMENT')
    )) {
      console.log(`     ⚠️  NLP error (text too short) - using domain tag only`);
      return {
        suggestedTags: domainTag ? [domainTag] : [],
        method: 'domain-fallback'
      };
    }

    throw error;
  }
}

async function backfillAutoTags() {
  console.log(`📂 Project: ${PROJECT_ID}`);
  console.log('📋 Scanning for bookmarks without auto-tags...\n');

  let totalBookmarks = 0;
  let bookmarksTagged = 0;
  let bookmarksSkipped = 0;
  let errors = 0;

  try {
    const userRefs = await db.collection('users').listDocuments();
    console.log(`👥 Found ${userRefs.length} user(s)\n`);

    for (const userRef of userRefs) {
      const userId = userRef.id;
      console.log(`\n👤 Processing user: ${userId}`);

      const bookmarksSnapshot = await userRef.collection('bookmarks').get();
      console.log(`   📚 Found ${bookmarksSnapshot.size} bookmark(s)`);
      totalBookmarks += bookmarksSnapshot.size;

      for (const bookmarkDoc of bookmarksSnapshot.docs) {
        const bookmark = bookmarkDoc.data();
        const bookmarkId = bookmarkDoc.id;

        // Skip if already auto-tagged
        if (bookmark.autoTagged) {
          console.log(`   ⏭️  Skipping "${bookmark.title || bookmarkId}" - already tagged`);
          bookmarksSkipped++;
          continue;
        }

        // Skip if no title and no description
        if (!bookmark.title && !bookmark.desc && !bookmark.description) {
          console.log(`   ⏭️  Skipping "${bookmarkId}" - no content to analyze`);
          bookmarksSkipped++;
          continue;
        }

        console.log(`   🏷️  Tagging "${bookmark.title || bookmarkId}"...`);

        try {
          const { suggestedTags, method } = await generateTags(
            bookmark.title,
            bookmark.desc || bookmark.description,
            bookmark.url
          );

          if (!isDryRun) {
            await userRef.collection('bookmarks').doc(bookmarkId).update({
              suggestedTags: suggestedTags,
              autoTagged: true,
              autoTaggedAt: FieldValue.serverTimestamp()
            });
          }

          console.log(`   ✅ Tags (${method}): [${suggestedTags.join(', ')}]`);
          bookmarksTagged++;

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (tagError) {
          console.error(`   ❌ Error tagging: ${tagError.message}`);
          errors++;

          if (!isDryRun) {
            await userRef.collection('bookmarks').doc(bookmarkId).update({
              autoTagError: tagError.message,
              autoTagAttemptedAt: FieldValue.serverTimestamp()
            });
          }
        }
      }
    }

    // Print summary
    console.log('\n====================================');
    console.log('📊 Summary');
    console.log('====================================');
    console.log(`📚 Total bookmarks:     ${totalBookmarks}`);
    console.log(`✅ Bookmarks tagged:    ${bookmarksTagged}`);
    console.log(`⏭️  Bookmarks skipped:   ${bookmarksSkipped}`);
    if (errors > 0) {
      console.log(`❌ Errors:              ${errors}`);
    }

    if (isDryRun) {
      console.log('\n🔍 This was a dry run. Run without --dry-run to apply changes.');
    } else if (bookmarksTagged > 0) {
      console.log('\n🎉 Auto-tagging complete!');
    }

  } catch (error) {
    console.error('\n❌ Error during backfill:', error.message);
    process.exit(1);
  }
}

// Run the backfill
backfillAutoTags()
  .then(() => {
    console.log('\n👋 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });
