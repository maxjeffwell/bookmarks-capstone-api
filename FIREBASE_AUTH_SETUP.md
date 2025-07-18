# Firebase Authentication Setup Guide

## Overview
Your bookmarks app now includes Firebase Authentication, ensuring each user has their own private collection of bookmarks.

## Features Implemented

### 1. Authentication Methods
- **Email/Password**: Traditional sign up and sign in
- **Google Sign-In**: One-click authentication with Google
- **Password Reset**: Email-based password recovery

### 2. User Interface
- Sign in/Sign up form in the main interface
- User email display when logged in
- Sign out button
- Error messages for authentication issues

### 3. Security
- User-specific bookmark collections (`users/{userId}/bookmarks`)
- Secure Firestore rules preventing unauthorized access
- Automatic session persistence

## Setup Instructions

### 1. Enable Authentication in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (marmoset-c2870)
3. Click "Authentication" in the left sidebar
4. Click "Get started"
5. Enable the following providers:
   - **Email/Password**:
     - Click "Email/Password"
     - Toggle "Enable"
     - Click "Save"
   - **Google**:
     - Click "Google"
     - Toggle "Enable"
     - Add your project support email
     - Click "Save"

### 2. Update Firestore Security Rules

1. In Firebase Console, go to "Firestore Database" → "Rules"
2. Replace existing rules with the contents of `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Users can only access their own bookmarks
      match /bookmarks/{bookmarkId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Click "Publish"

### 3. Configure OAuth for Google Sign-In

1. In Firebase Console → Authentication → Settings → Authorized domains
2. Add your production domain (e.g., `yourdomain.com`)
3. For GitHub Pages: `yourusername.github.io` is already authorized

## How It Works

### Data Structure
```
Firestore Database
└── users
    └── {userId}
        └── bookmarks
            └── {bookmarkId}
                ├── title
                ├── url
                ├── desc
                ├── rating
                ├── tags[]
                └── createdAt
```

### Authentication Flow
1. User loads the app → Shows sign in/up form
2. User authenticates → Firebase returns user object
3. App loads user's bookmarks from `users/{userId}/bookmarks`
4. All CRUD operations use the authenticated user's collection

### Security Features
- Each user can only access their own bookmarks
- No cross-user data visibility
- Automatic session management
- Secure password handling by Firebase

## Testing

### Test User Creation
1. Open your app
2. Enter email and password
3. Click "Sign Up"
4. Create some bookmarks
5. Sign out and sign back in
6. Verify bookmarks persist

### Test Security
1. Sign in as User A, create bookmarks
2. Sign out, sign in as User B
3. Verify you can't see User A's bookmarks
4. Check browser console for any permission errors

## Troubleshooting

### "Missing or insufficient permissions"
- Ensure you've published the new security rules
- Verify you're signed in before accessing bookmarks
- Check that Authentication is enabled in Firebase

### "User not authenticated" errors
- Clear browser cache and cookies
- Ensure Firebase Auth is properly initialized
- Check for ad blockers blocking Firebase

### Google Sign-In not working
- Verify Google provider is enabled
- Check authorized domains in Firebase Console
- Ensure popups aren't blocked

## Migration from Public Bookmarks

If you have existing bookmarks in the root `bookmarks` collection:

1. Sign in to your app
2. Manually recreate your bookmarks
3. Or use Firebase Console to move data to `users/{yourUserId}/bookmarks`

## Production Considerations

### Additional Security
- Add email verification requirement
- Implement rate limiting
- Add reCAPTCHA for sign up

### User Experience
- Add "Remember me" checkbox
- Implement social login (Facebook, Twitter)
- Add user profile management

### Monitoring
- Enable Firebase Analytics
- Set up error reporting
- Monitor authentication metrics

## Next Steps

1. **Test thoroughly** with multiple user accounts
2. **Deploy** to your production environment
3. **Monitor** authentication metrics in Firebase Console
4. **Consider** adding user profiles and sharing features