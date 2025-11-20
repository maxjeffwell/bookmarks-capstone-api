# Firebase Setup Instructions

## Prerequisites
1. Create a Firebase account at https://firebase.google.com
2. Create a new Firebase project

## Setup Steps

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Enter a project name (e.g., "bookmarks-app")
4. Disable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Firestore Database
1. In your Firebase project, click "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in production mode" (we'll update security rules later)
4. Select your preferred location
5. Click "Enable"

### 3. Get Your Firebase Configuration
1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Click "Web" icon (</>)
4. Register your app with a nickname
5. Copy the configuration object

### 4. Update Configuration in Code
1. Open `scripts/firebase-config.js`
2. Replace the placeholder values with your actual Firebase configuration:

```javascript
const config = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### 5. Set Up Firestore Security Rules
1. In Firebase Console, go to Firestore Database → Rules
2. Replace with these rules for public read/write (development only):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /bookmarks/{document=**} {
      allow read, write: if true;
    }
  }
}
```

For production, use authenticated access:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /bookmarks/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 6. Deploy and Test
1. Open `index.html` in your browser
2. Check browser console for "Firebase initialized successfully"
3. Try adding, viewing, and deleting bookmarks
4. Check Firestore Database in Firebase Console to see your data

## Troubleshooting

### Common Issues:
1. **"Firebase not initialized"** - Check that your config values are correct
2. **"Permission denied"** - Update Firestore security rules
3. **Network errors** - Check Content Security Policy in index.html
4. **Data not persisting** - Verify Firestore is enabled in Firebase Console

### Debug Tips:
- Open browser developer console for error messages
- Check Network tab for failed requests
- Verify Firebase configuration in firebase-config.js
- Test authentication flow with different user accounts

## Next Steps

1. **Authentication**: ✅ Firebase Auth implemented for user-specific bookmarks
2. **Real-time Updates**: ✅ Firestore listeners enabled for live sync across devices
3. **Offline Support**: Already enabled with `enablePersistence()`
4. **Performance**: Add indexes for complex queries
5. **Security**: Implement proper security rules for production