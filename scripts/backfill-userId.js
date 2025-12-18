#!/usr/bin/env node
/**
 * Backfill userId field on existing bookmarks
 *
 * This script adds the userId field to all bookmarks that don't have it.
 * This is required for Algolia search filtering to work correctly.
 *
 * Usage:
 *   Option 1 - With service account key file:
 *     GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json node scripts/backfill-userId.js
 *
 *   Option 2 - With Firebase CLI authentication:
 *     npx firebase login
 *     node scripts/backfill-userId.js
 *
 *   Option 3 - Dry run (preview changes without writing):
 *     node scripts/backfill-userId.js --dry-run
 */

import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

// Firebase project configuration
const PROJECT_ID = 'marmoset-c2870';

console.log('🔥 Bookmark userId Backfill Script');
console.log('===================================');
if (isDryRun) {
  console.log('🔍 DRY RUN MODE - No changes will be made\n');
}

// Initialize Firebase Admin SDK
let app;
try {
  // Try to use Application Default Credentials first
  // This works with: gcloud auth application-default login
  // Or when running on GCP (Cloud Functions, Cloud Run, etc.)
  app = initializeApp({
    credential: applicationDefault(),
    projectId: PROJECT_ID,
  });
  console.log('✅ Initialized with Application Default Credentials');
} catch (error) {
  // Fall back to checking for service account key file
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      app = initializeApp({
        credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
        projectId: PROJECT_ID,
      });
      console.log('✅ Initialized with service account key file');
    } catch (certError) {
      console.error('❌ Failed to initialize with service account key:', certError.message);
      process.exit(1);
    }
  } else {
    console.error('❌ Failed to initialize Firebase Admin SDK');
    console.error('\nTo authenticate, try one of these methods:');
    console.error('  1. Run: gcloud auth application-default login');
    console.error('  2. Set GOOGLE_APPLICATION_CREDENTIALS environment variable');
    console.error('  3. Download a service account key from Firebase Console');
    process.exit(1);
  }
}

const db = getFirestore();

async function backfillUserIds() {
  console.log(`\n📂 Project: ${PROJECT_ID}`);
  console.log('📋 Scanning for bookmarks without userId field...\n');

  let totalUsers = 0;
  let totalBookmarks = 0;
  let bookmarksUpdated = 0;
  let bookmarksSkipped = 0;
  let errors = 0;

  try {
    // Get all user document references (they may exist as containers without fields)
    const userRefs = await db.collection('users').listDocuments();
    totalUsers = userRefs.length;
    console.log(`👥 Found ${totalUsers} user(s)\n`);

    if (totalUsers === 0) {
      console.log('ℹ️  No users found. Nothing to backfill.');
      return;
    }

    // Process each user
    for (const userRef of userRefs) {
      const userId = userRef.id;
      console.log(`\n👤 Processing user: ${userId}`);

      // Get all bookmarks for this user
      const bookmarksRef = db.collection(`users/${userId}/bookmarks`);
      const bookmarksSnapshot = await bookmarksRef.get();

      console.log(`   📚 Found ${bookmarksSnapshot.size} bookmark(s)`);
      totalBookmarks += bookmarksSnapshot.size;

      // Process each bookmark
      for (const bookmarkDoc of bookmarksSnapshot.docs) {
        const bookmarkData = bookmarkDoc.data();
        const bookmarkId = bookmarkDoc.id;

        // Check if userId already exists
        if (bookmarkData.userId) {
          console.log(`   ⏭️  Skipping "${bookmarkData.title || bookmarkId}" - already has userId`);
          bookmarksSkipped++;
          continue;
        }

        // Update the bookmark with userId
        console.log(`   📝 Updating "${bookmarkData.title || bookmarkId}"...`);

        if (!isDryRun) {
          try {
            await bookmarksRef.doc(bookmarkId).update({
              userId: userId
            });
            console.log(`   ✅ Added userId to "${bookmarkData.title || bookmarkId}"`);
            bookmarksUpdated++;
          } catch (updateError) {
            console.error(`   ❌ Failed to update "${bookmarkData.title || bookmarkId}":`, updateError.message);
            errors++;
          }
        } else {
          console.log(`   🔍 Would add userId: ${userId}`);
          bookmarksUpdated++;
        }
      }
    }

    // Print summary
    console.log('\n===================================');
    console.log('📊 Summary');
    console.log('===================================');
    console.log(`👥 Users processed:     ${totalUsers}`);
    console.log(`📚 Total bookmarks:     ${totalBookmarks}`);
    console.log(`✅ Bookmarks updated:   ${bookmarksUpdated}`);
    console.log(`⏭️  Bookmarks skipped:   ${bookmarksSkipped}`);
    if (errors > 0) {
      console.log(`❌ Errors:              ${errors}`);
    }

    if (isDryRun) {
      console.log('\n🔍 This was a dry run. Run without --dry-run to apply changes.');
    } else if (bookmarksUpdated > 0) {
      console.log('\n🎉 Backfill complete!');
      console.log('\n📌 Next steps:');
      console.log('   1. Go to Firebase Console → Extensions → Search with Algolia');
      console.log('   2. Trigger a full re-index to sync changes to Algolia');
    } else {
      console.log('\n✨ All bookmarks already have userId. No updates needed.');
    }

  } catch (error) {
    console.error('\n❌ Error during backfill:', error.message);
    if (error.code === 'permission-denied') {
      console.error('\n🔒 Permission denied. Make sure you have the correct permissions.');
      console.error('   - Firestore Database Admin role is required');
    }
    process.exit(1);
  }
}

// Run the backfill
backfillUserIds()
  .then(() => {
    console.log('\n👋 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });
