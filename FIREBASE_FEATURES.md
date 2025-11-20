# Firebase Advanced Features Guide

This document explains all the advanced Firebase features implemented in the Bookmarks app.

## 🚀 Implemented Features

### 1. Automatic Metadata Fetching
**Cloud Function:** `fetchBookmarkMetadata`

Automatically extracts rich metadata when you add a bookmark:
- **Title** - From OpenGraph tags or HTML title
- **Description** - From meta tags
- **Favicon** - Site icon
- **Preview Image** - OpenGraph image for visual preview
- **Site Name** - Official website name

**How it works:**
1. User creates a bookmark
2. Cloud Function triggers automatically
3. Fetches and parses the webpage
4. Extracts metadata using Cheerio
5. Updates bookmark with rich information

**User benefit:** No manual data entry needed - just paste a URL!

---

### 2. Screenshot Generation
**Cloud Function:** `captureScreenshot`

Automatically captures a screenshot of every bookmarked website using Puppeteer.

**Features:**
- 1280x800 viewport (desktop size)
- Waits for page to fully load
- Stores in Firebase Storage
- Creates public URLs for viewing
- Optimized JPEG format (quality 80)

**How it works:**
1. Bookmark created with URL
2. Cloud Function spins up headless Chrome
3. Navigates to URL and waits for load
4. Captures screenshot
5. Uploads to Firebase Storage at `screenshots/{userId}/{bookmarkId}.jpg`
6. Updates bookmark with public screenshot URL

**User benefit:** Visual preview of every bookmark!

**Requirements:**
- Requires 2GB memory allocation (configured)
- 60-second timeout
- Firebase Storage bucket must be configured

---

### 3. ML-Powered Auto-Tagging
**Cloud Function:** `autoTagBookmark`

Uses Google Cloud Natural Language API to automatically suggest tags.

**What it analyzes:**
- Bookmark title and description
- Named entities (people, organizations, products)
- Content categories
- Website domain

**Example tags generated:**
- Domain: "GitHub" (from github.com)
- Categories: "Programming", "Software Development"
- Entities: "React", "JavaScript", "Firebase"

**How it works:**
1. New bookmark created
2. Combines title + description
3. Sends to Natural Language API
4. Extracts categories and entities
5. Adds domain-based tag
6. Updates bookmark with 8 suggested tags

**User benefit:** Smart organization without manual tagging!

**Requirements:**
- Google Cloud Natural Language API must be enabled
- 512MB memory allocation
- 30-second timeout

---

### 4. Collaborative Collections
**Cloud Functions:** `shareCollection`, `removeCollaborator`
**Firestore Rules:** Enhanced security for shared access

Create bookmark collections and share them with specific users.

**Features:**
- **Owner permissions** - Full control, can delete collection
- **Editor permissions** - Can add/remove bookmarks
- **Viewer permissions** - Read-only access
- **Notifications** - Get notified when someone shares with you
- **Security** - Firestore rules enforce permissions

**Data model:**
```javascript
{
  id: "collection123",
  name: "Work Resources",
  description: "Useful work links",
  ownerId: "user123",
  ownerEmail: "user@example.com",
  collaborators: {
    "user456": {
      email: "colleague@example.com",
      permission: "editor",
      addedAt: Timestamp,
      addedBy: "user123"
    }
  },
  bookmarks: ["bookmark1", "bookmark2"],
  createdAt: Timestamp
}
```

**How to use:**
```javascript
// Create collection
const collectionRef = await db.collection('collections').add({
  name: 'My Collection',
  description: 'Collection description',
  ownerId: currentUserId,
  ownerEmail: currentUserEmail,
  collaborators: {},
  bookmarks: [],
  createdAt: firebase.firestore.FieldValue.serverTimestamp()
});

// Share with user (callable Cloud Function)
const shareCollection = firebase.functions().httpsCallable('shareCollection');
await shareCollection({
  collectionId: 'collection123',
  userEmail: 'friend@example.com',
  permission: 'editor' // or 'viewer'
});

// Remove collaborator
const removeCollaborator = firebase.functions().httpsCallable('removeCollaborator');
await removeCollaborator({
  collectionId: 'collection123',
  userId: 'user456'
});
```

**User benefit:** Collaborate on bookmark collections with team members!

---

## 📋 Firebase Extensions (To Be Installed)

### Extension 1: Trigger Email
**Install command:**
```bash
firebase ext:install firebase/firestore-send-email
```

**Use cases:**
- Weekly bookmark digest emails
- Share collection via email
- Export bookmarks as HTML attachment
- Notification emails for collection shares

**Configuration needed:**
- SMTP credentials (Gmail, SendGrid, etc.)
- Email templates
- Firestore trigger paths

---

### Extension 2: Algolia Search
**Install command:**
```bash
firebase ext:install algolia/firestore-algolia-search
```

**Features:**
- Instant search-as-you-type
- Fuzzy search (typo tolerance)
- Search bookmark titles, descriptions, tags
- Filter by rating, date, collections
- Faceted search (filter by multiple criteria)

**Configuration needed:**
- Algolia account (free tier available)
- API keys
- Index configuration

**User benefit:** Find any bookmark instantly with powerful search!

---

## 🔧 Required Setup Steps

### 1. Enable Google Cloud APIs

Before deploying, enable these APIs in Google Cloud Console:

```bash
# Enable Natural Language API (for auto-tagging)
gcloud services enable language.googleapis.com

# Enable Storage API (for screenshots)
gcloud services enable storage.googleapis.com

# Enable Cloud Functions API
gcloud services enable cloudfunctions.googleapis.com
```

Or enable via Firebase Console:
1. Go to https://console.cloud.google.com
2. Select your project: `marmoset-c2870`
3. Navigate to APIs & Services > Library
4. Search and enable:
   - **Cloud Natural Language API**
   - **Cloud Storage API**
   - **Cloud Functions API**

---

### 2. Firebase Storage Setup

Configure Firebase Storage bucket:

1. Go to Firebase Console > Storage
2. Get Started (if not already enabled)
3. Set up security rules:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Screenshots are publicly readable
    match /screenshots/{userId}/{bookmarkId} {
      allow read: if true;
      allow write: if false; // Only Cloud Functions can write
    }

    // Deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

---

### 3. Deploy Everything

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Cloud Functions
firebase deploy --only functions

# Deploy Storage rules
firebase deploy --only storage

# Or deploy everything at once
firebase deploy
```

---

### 4. Install Firebase Extensions

```bash
# Install email extension
firebase ext:install firebase/firestore-send-email

# Install Algolia search extension
firebase ext:install algolia/firestore-algolia-search
```

Follow the interactive prompts to configure each extension.

---

## 💰 Cost Considerations

### Cloud Functions
- **Free tier:** 2M invocations/month
- **Metadata fetching:** ~0.001s execution time (very cheap)
- **Screenshot generation:** ~10-15s execution time (expensive due to Puppeteer)
- **Auto-tagging:** ~0.5s execution time + Natural Language API costs

**Recommendation:** Consider disabling screenshot generation for high-volume use cases.

### Natural Language API
- **Free tier:** 5,000 text records/month
- **Cost:** $1.00 per 1,000 text records after free tier
- **Your usage:** ~1 request per bookmark = ~$1 per 1,000 bookmarks

### Firebase Storage
- **Free tier:** 1GB storage, 10GB/day bandwidth
- **Screenshots:** ~50-200KB each
- **1,000 bookmarks = ~50-200MB**

### Algolia (if installed)
- **Free tier:** 10,000 records, 100,000 operations/month
- **Paid plans:** Start at $1/month

**Estimate for 100 bookmarks/month:**
- Cloud Functions: Free
- Natural Language API: Free
- Storage: Free
- **Total: $0**

**Estimate for 10,000 bookmarks/month:**
- Cloud Functions: ~$5-10 (mostly screenshots)
- Natural Language API: ~$10
- Storage: ~$2
- **Total: ~$17-22/month**

---

## 🧪 Testing Your Functions

### Test Metadata Fetching
```bash
# Add a new bookmark via UI
# Check Firestore to see fetched metadata
# Or check Cloud Functions logs:
firebase functions:log --only fetchBookmarkMetadata
```

### Test Screenshot Generation
```bash
# Add a bookmark
# Wait 30-60 seconds
# Check Firebase Storage for screenshot
firebase functions:log --only captureScreenshot
```

### Test Auto-Tagging
```bash
# Add a bookmark with good description
# Check suggestedTags field in Firestore
firebase functions:log --only autoTagBookmark
```

### Test Collaborative Collections
```javascript
// In browser console:
const shareCollection = firebase.functions().httpsCallable('shareCollection');
shareCollection({
  collectionId: 'your-collection-id',
  userEmail: 'test@example.com',
  permission: 'editor'
}).then(result => console.log(result));
```

---

## 🐛 Troubleshooting

### Function fails with "Permission denied"
- Enable the required Google Cloud APIs
- Check that your service account has correct permissions

### Screenshots fail
- Puppeteer requires 2GB memory (configured)
- Some sites block headless browsers
- Check Cloud Functions logs for specific errors

### Auto-tagging returns empty tags
- Natural Language API requires minimum text length (>50 characters works best)
- Some content doesn't have clear categories
- Check API quota limits

### Collection sharing fails
- User email must exist in Firebase Auth
- Check Firestore security rules
- Verify Cloud Function logs

---

## 🚀 Next Steps

1. ✅ Deploy functions: `firebase deploy --only functions`
2. ✅ Deploy rules: `firebase deploy --only firestore:rules,storage`
3. ⏳ Enable Google Cloud APIs
4. ⏳ Test each feature
5. ⏳ Install Firebase Extensions
6. ⏳ Build UI for collections in frontend
7. ⏳ Add UI for viewing suggested tags
8. ⏳ Add UI for screenshot previews

---

## 📚 Further Reading

- [Firebase Cloud Functions Docs](https://firebase.google.com/docs/functions)
- [Google Natural Language API](https://cloud.google.com/natural-language/docs)
- [Puppeteer Documentation](https://pptr.dev/)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Extensions](https://firebase.google.com/products/extensions)
