# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**FireBook** is a modern bookmark manager built with React 19, Firebase, and Vite. Originally started as a Thinkful capstone project, it has evolved into a full-featured application with AI-powered tagging, screenshot capture, semantic search via embeddings, and real-time sync.

## Commands

### Development
```bash
npm run dev              # Start Vite dev server
npm run build            # Production build + generate SEO files
npm run preview          # Preview production build locally
```

### Testing
```bash
npm run test             # Run Vitest tests
npm run test:watch       # Watch mode
npm run test:ui          # Vitest UI
npm run test:coverage    # Coverage report
```

### Firebase
```bash
npm run firebase:serve   # Build and serve locally with Firebase
npm run firebase:deploy  # Deploy to Firebase Hosting + Firestore
npm run firebase:emulators  # Start local Firebase emulators
```

### Database Migrations
```bash
npm run backfill:userId      # Backfill userId field on bookmarks
npm run backfill:userId:dry  # Dry run (no changes)
npm run backfill:tags        # Backfill AI-generated tags
npm run backfill:tags:dry    # Dry run (no changes)
```

## Architecture

### Tech Stack
- **React 19** - UI framework with modern hooks
- **Vite 7** - Build tool and dev server
- **Firebase** - Auth, Firestore, Cloud Functions, Analytics, Hosting
- **Algolia** - Full-text search integration
- **Tailwind CSS 3** - Utility-first styling

### Application Structure

```
src/
├── main.jsx                    # App entry point, renders to #root
├── App.jsx                     # Root component with AuthProvider
├── index.css                   # Global styles + Tailwind imports
├── context/
│   └── AuthContext.jsx         # Firebase auth state management
├── services/
│   ├── firebase.js             # Firebase SDK initialization
│   └── algolia.js              # Algolia search client
├── pages/
│   ├── MainApp.jsx             # Main layout with navigation
│   ├── AuthPage.jsx            # Login/signup forms
│   ├── BookmarksPage.jsx       # Primary bookmark list + add form
│   ├── CollectionsPage.jsx     # Tag-based collections
│   └── SmartCollectionsPage.jsx # AI-powered semantic collections
├── components/
│   ├── BookmarkCard.jsx        # Individual bookmark display
│   ├── EditBookmarkModal.jsx   # Edit bookmark form modal
│   ├── ImportExportModal.jsx   # JSON import/export
│   └── AlgoliaSearch.jsx       # Search interface
└── hooks/                      # Custom React hooks

scripts/                        # Node.js utility scripts (not part of app)
├── generate-sitemap.js         # SEO: generates sitemap.xml
├── generate-robots.js          # SEO: generates robots.txt
├── backfill-userId.js          # Migration: add userId to bookmarks
└── backfill-autoTag.js         # Migration: generate AI tags
```

### Data Flow

**Authentication Flow:**
1. `AuthContext.jsx` wraps the app and provides `user` state
2. Firebase `onAuthStateChanged` listener updates auth state
3. Components access auth via `useAuth()` hook
4. Unauthenticated users see `AuthPage`, authenticated see `MainApp`

**Bookmark Data Flow:**
1. Bookmarks stored in Firestore under `bookmarks/{bookmarkId}`
2. Real-time listener (`onSnapshot`) syncs changes to React state
3. CRUD operations use Firestore SDK directly
4. Cloud Functions handle async tasks (screenshots, AI tagging, embeddings)

**State Management:**
- React `useState`/`useReducer` for local component state
- `AuthContext` for global auth state
- Firestore real-time listeners for bookmark data (no Redux/Zustand needed)

### Firebase Services

**Firestore Collections:**
- `bookmarks` - User bookmarks with metadata, tags, screenshots
- Each bookmark has: `id`, `userId`, `title`, `url`, `desc`, `rating`, `tags`, `suggestedTags`, `screenshot`, `embedding`, timestamps

**Cloud Functions (triggered on bookmark creation):**
- Metadata fetching (title, description, favicon)
- Screenshot capture
- AI tag generation (Google NLP)
- Embedding generation (for semantic search)

**Authentication:**
- Email/password auth
- Google OAuth provider
- Password reset flow

## Key Features

- **Bookmark Management** - Create, edit, delete, rate (1-5 stars)
- **Tagging** - Manual tags + AI-suggested tags from Google NLP
- **Search** - Algolia full-text search + semantic similarity via embeddings
- **Smart Collections** - AI-powered groupings based on content similarity
- **Import/Export** - JSON format for data portability
- **Screenshots** - Auto-captured via Cloud Functions
- **Real-time Sync** - Firestore listeners for instant updates

## File Conventions

**Components:** PascalCase, `.jsx` extension
```
BookmarkCard.jsx, EditBookmarkModal.jsx
```

**Services/Utils:** camelCase, `.js` extension
```
firebase.js, algolia.js
```

**Pages:** PascalCase with `Page` suffix
```
BookmarksPage.jsx, AuthPage.jsx
```

## Testing

Tests use Vitest with Happy DOM for React component testing:
```bash
npm run test           # Single run
npm run test:watch     # Watch mode
npm run test:coverage  # With coverage report
```

## Deployment

**Firebase Hosting:**
```bash
npm run firebase:deploy  # Builds and deploys to Firebase
```

**Environment:**
- Firebase config is in `src/services/firebase.js`
- Algolia keys configured in `src/services/algolia.js`
- Production URL: Firebase Hosting domain

## Development Notes

**Code Style:**
- Functional components with hooks (no class components)
- Tailwind CSS for styling (avoid custom CSS where possible)
- Async/await for Firebase operations
- Destructuring for props and state

**Security:**
- React auto-escapes JSX content (XSS protection)
- Firestore security rules enforce user ownership
- `rel="noopener noreferrer"` on external links

**Performance:**
- Vite code splitting for optimal bundle size
- Lazy loading for modals and secondary pages
- Firestore pagination for large bookmark collections
