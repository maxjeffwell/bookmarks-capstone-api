# FireBook - AI-Powered Bookmark Manager

## Project Overview

**FireBook** is an intelligent bookmark management platform that automatically enriches saved links with AI-powered metadata, screenshots, and contextual tags. Built with React and Firebase, the application features real-time synchronization, collaborative collections, and instant search capabilities.

### Origin and Evolution

- **Initial Project**: Created as part of Thinkful's Engineering Immersion program as a capstone project demonstrating web development fundamentals
- **Evolution**: Successfully migrated from jQuery-based frontend to a full-stack AI-enhanced React application
- **Current State**: Production-ready Firebase-powered application with Docker deployment and CI/CD pipelines

### Business Domain

- **Category**: Productivity Tools / Bookmark Management
- **Target Users**:
  - Individual users managing personal web bookmarks
  - Teams collaborating on shared link collections
  - Researchers organizing reference materials
  - Developers saving technical resources

### Value Propositions

- **AI-Powered Automation**: Automatic metadata extraction and intelligent tagging using Google Natural Language API
- **Real-Time Collaboration**: Share collections with granular permissions (viewer/editor roles)
- **Lightning-Fast Search**: Sub-10ms query times with Algolia instant search
- **Visual Reference**: Automatic screenshot generation for bookmarked pages
- **Zero-Friction Organization**: Seamless bookmark saving and categorization

---

## Technology Stack

### Frontend Architecture

#### Core Framework
- **React 19.2.0**: Component-based UI library with modern Hooks
  - `useState`, `useEffect`, `useContext` for state management
  - Functional components exclusively (no class components)
  - React.StrictMode enabled for development checks
  - Context API for global authentication state

#### Build System
- **Vite 7.2.2**: Next-generation frontend build tool
  - Hot Module Replacement (HMR) for instant development feedback
  - Native ES modules support
  - Optimized production bundles (873 KB uncompressed, 256 KB gzipped)
  - Fast cold start and build times

#### Styling Framework
- **Tailwind CSS 3.4.16**: Utility-first CSS framework
  - Custom Firebase brand colors (orange, yellow, amber, blue, navy)
  - PostCSS integration with Autoprefixer
  - Mobile-first responsive design patterns
  - Custom component classes for common patterns

#### Search UI
- **React InstantSearch 7.20.0**: Pre-built Algolia search components
  - Search-as-you-type functionality
  - Faceted filtering and refinements
  - Customizable search widgets

### Backend Infrastructure

#### Firebase Platform
- **Firebase Authentication**:
  - Email/password authentication
  - Google OAuth integration
  - Secure session management

- **Cloud Firestore**: NoSQL document database
  - Real-time listeners for live data updates
  - User-isolated data structure
  - Collections: `users/{userId}/bookmarks/{bookmarkId}`, `collections/{collectionId}`, `notifications/{notificationId}`, `activity/{activityId}`

- **Cloud Functions v2** (Node.js 20 runtime):
  - `fetchMetadata`: Extract webpage metadata (title, description, favicon, Open Graph images)
  - `captureScreenshot`: Generate webpage previews using Puppeteer + Chromium
  - `autoTagBookmark`: AI-powered tag generation with Google Natural Language API
  - `shareCollection`: Collaborative collection sharing logic
  - `removeCollaborator`: Manage collection permissions

- **Firebase Storage**: Screenshot and image storage

- **Firebase Hosting**: CDN-based static hosting with global distribution

- **Firebase Extensions**:
  - Trigger Email (SMTP): Transactional email notifications
  - Algolia Search: Automatic Firestore-to-Algolia index synchronization

### Search and AI Services

- **Algolia 5.44.0**: Hosted search platform
  - Sub-10ms query response times
  - Fuzzy matching and typo tolerance
  - Real-time index synchronization via Firebase extension

- **Google Cloud Natural Language API**: AI content analysis
  - Content classification and entity extraction
  - Contextual tag suggestions for bookmarks

- **Puppeteer-core**: Headless browser automation
  - Serverless-compatible with @sparticuz/chromium
  - Automated screenshot capture for Cloud Functions

### DevOps and Infrastructure

- **Runtime**: Node.js 20+
- **Package Manager**: npm
- **Containerization**: Docker
  - Multi-stage Dockerfile for development and production
  - docker-compose.yml for production orchestration
  - docker-compose.dev.yml for development with hot reload

- **Web Server**: nginx
  - Production static file serving
  - Security headers (CSP, HSTS, X-Frame-Options)
  - Optimized caching configuration

- **CI/CD**: GitHub Actions
  - `ci.yml`: Linting and testing on pull requests
  - `docker-build-push.yml`: Automated Docker image builds to Docker Hub
  - `firebase-hosting-merge.yml`: Production deployment on merge to master
  - `firebase-hosting-pull-request.yml`: Preview deployments for pull requests (7-day expiration)

### Testing Infrastructure

- **Vitest 4.0.10**: Fast unit testing framework
  - Native Vite integration
  - Test environments: happy-dom, jsdom
  - Test coverage reporting
  - Watch mode for continuous testing

### Legacy Code

- **jQuery 3.3.1**: Preserved in `scripts/` directory
  - Original vanilla JavaScript modules from educational project
  - IIFE (Immediately Invoked Function Expression) pattern
  - Not actively used in React application

---

## Coding Standards

### Architecture Patterns

#### Component Architecture (Mandatory)
- **React Component Pattern**: Use functional components with React Hooks exclusively
  - Location: `src/components/`, `src/pages/`
  - Hooks: `useState`, `useEffect`, `useContext`, `useMemo`, `useCallback`
  - **Good**: Functional components with Hooks
  - **Bad**: Class components (not used in this project)

#### State Management (Mandatory)
- **Context API for Global State**: Use React Context API for authentication state
  - Implementation: `AuthContext.jsx` provides user authentication state
  - Avoid Redux or other state management libraries for simplicity

#### Data Flow (Mandatory)
- **Unidirectional Data Flow**: State changes trigger re-renders, event handlers update state
  - Pattern: `User Action → React UI → Firebase SDK → Cloud Firestore → Firestore Triggers → Cloud Functions`

#### Module Pattern (Legacy - Preserve Existing)
- **IIFE Module Pattern**: Legacy JavaScript files use IIFE for encapsulation
  - Location: `scripts/` directory
  - Preserve existing patterns, do not modify unless necessary

### Security Rules

#### Authentication (Critical)
- **Firebase Authentication Required**: All Firestore operations require authenticated users
  - Firestore security rules enforce user-isolated data access
  - Never bypass authentication in client code

#### Data Access Control (Critical)
- **User Data Isolation**: Users can only access their own bookmarks and collections they own/collaborate on
  - Firestore rules:
    - `match /users/{userId}/bookmarks/{bookmarkId}`: `allow read, write: if isOwner(userId)`
    - `match /collections/{collectionId}`: `allow read: if hasCollectionAccess(resource)`
  - Owner-only operations: Collection deletion, collaborator management
  - Editor permissions: Add/remove bookmarks from collections
  - Viewer permissions: Read-only access

#### Content Security Policy (Mandatory)
- **CSP Headers**: Strict Content Security Policy in HTML meta tags and nginx configuration
  - Prevents XSS attacks
  - Restricts script sources to trusted origins
  - Implemented in `index.html` and `nginx.conf`

#### API Key Management (Critical)
- **Environment Variables for Secrets**: Never commit secrets to repository
  - Use `.env.local` for Algolia API keys
  - Required variables:
    - `VITE_ALGOLIA_APP_ID`
    - `VITE_ALGOLIA_SEARCH_API_KEY`
    - `VITE_ALGOLIA_INDEX_NAME`
  - Firebase credentials in `src/services/firebase.js` (replace with your project credentials)

### Firebase Best Practices

#### Cloud Functions (Mandatory)
- **Serverless Function Architecture**: Business logic runs in Cloud Functions v2 with Node.js 20
  - Use `async/await` for Firestore operations
  - Implement comprehensive error handling and logging
  - Optimize cold start performance (minimize dependencies, lazy load modules)

#### Firestore (Recommended)
- **Real-time Listeners**: Use Firestore real-time listeners (`onSnapshot`) for live data updates
  - Automatically sync changes across all devices
  - Clean up listeners on component unmount

#### Storage (Mandatory)
- **Firebase Storage for Media**: Store screenshots and images in Firebase Storage
  - Reference URLs in Firestore documents
  - Set appropriate security rules for user-isolated access

### Code Quality Standards

#### Linting (Mandatory)
- **ESLint Configuration**: Use ESLint for code consistency and quality checks
  - Run linting before commits
  - Fix linting errors before merge

#### Testing (Recommended)
- **Vitest Unit Tests**: Write unit tests for critical business logic
  - Location: `tests/` directory
  - Test files: `*.test.js`
  - Run tests before deploying

#### Naming Conventions (Mandatory)
- **Component Naming**:
  - PascalCase for React components (`.jsx` files): `BookmarkCard.jsx`, `AuthPage.jsx`
  - camelCase for utilities and services: `firebase.js`, `algolia.js`
  - UPPER_SNAKE_CASE for constants

#### File Organization (Mandatory)
- **Modular File Structure**:
  - `src/components/`: Reusable UI components
  - `src/pages/`: Page-level components
  - `src/context/`: React Context providers
  - `src/services/`: Firebase and Algolia integration
  - `scripts/`: Legacy vanilla JavaScript modules
  - `functions/`: Cloud Functions
  - `tests/`: Test files

### Styling Standards

#### CSS Framework (Mandatory)
- **Tailwind Utility Classes**: Use Tailwind CSS utility classes for styling
  - Avoid custom CSS unless absolutely necessary
  - Use `@apply` directive for repeated patterns

#### Responsive Design (Mandatory)
- **Mobile-First Approach**: Design for mobile devices first, then enhance for larger screens
  - Use Tailwind responsive prefixes: `sm:`, `md:`, `lg:`, `xl:`

#### Theme Consistency (Mandatory)
- **Firebase Brand Colors**:
  - `--firebase-orange: #FF9800`
  - `--firebase-yellow: #FFC107`
  - `--firebase-amber: #FFA000`
  - `--firebase-blue: #2196F3`
  - `--firebase-navy: #1A237E`

### Performance Optimization

#### Build Optimization (Mandatory)
- **Vite Production Builds**: Optimize bundle size with Vite build
  - Target: 873 KB uncompressed, 256 KB gzipped
  - Enable source maps for debugging

#### Search Performance (Mandatory)
- **Algolia Instant Search**: Leverage Algolia for sub-10ms search query times
  - Use appropriate search parameters
  - Implement result caching where appropriate

#### Code Splitting (Recommended)
- **Lazy Loading**: Use dynamic imports for code splitting
  - Split large components into separate chunks
  - Implement route-based code splitting

### Accessibility Standards

#### Semantic HTML (Mandatory)
- **Semantic HTML5 Elements**: Use semantic elements for better accessibility
  - `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`

#### ARIA (Recommended)
- **ARIA Attributes**: Add ARIA labels and roles for screen reader support
  - `aria-label`, `aria-labelledby`, `role` attributes
  - Focus management for modals and dynamic content

#### Keyboard Navigation (Recommended)
- **Keyboard Accessibility**: Ensure all interactive elements are keyboard accessible
  - Tab navigation
  - Enter/Space for buttons
  - Escape for modals

### Git Workflow

#### Branching (Recommended)
- **Feature Branch Workflow**: Create feature branches from master
  - Branch naming: `feature/description`, `fix/bug-description`
  - Submit pull requests for code review

#### Commit Messages (Recommended)
- **Conventional Commits**: Use descriptive commit messages
  - Explain the "why" of changes, not just the "what"
  - Format: `type: description` (e.g., `feat: add bookmark export`, `fix: resolve auth redirect`)

#### CI/CD (Mandatory)
- **Automated Workflows**: GitHub Actions automatically run checks and deploy
  - All pull requests must pass CI checks (linting, testing)
  - Automatic deployment to Firebase on merge to master
  - Preview deployments for pull requests

---

## Project Structure

```
bookmarks-capstone-api/
├── src/                          # React application source
│   ├── main.jsx                 # React entry point
│   ├── App.jsx                  # Root component with AuthProvider
│   ├── index.css                # Global styles (Tailwind imports)
│   ├── components/              # Reusable UI components
│   │   ├── AlgoliaSearch.jsx   # Algolia instant search component
│   │   ├── BookmarkCard.jsx    # Individual bookmark display
│   │   ├── EditBookmarkModal.jsx # Edit bookmark modal dialog
│   │   └── ImportExportModal.jsx # Import/export JSON functionality
│   ├── pages/                   # Page-level components
│   │   ├── MainApp.jsx         # Main application container
│   │   ├── AuthPage.jsx        # Authentication (sign in/up)
│   │   ├── BookmarksPage.jsx   # Bookmark management interface
│   │   └── CollectionsPage.jsx # Collections management
│   ├── context/                 # React Context providers
│   │   └── AuthContext.jsx     # Global authentication state
│   └── services/                # External service integrations
│       ├── firebase.js         # Firebase SDK configuration
│       └── algolia.js          # Algolia search client setup
│
├── scripts/                      # Legacy vanilla JavaScript modules (jQuery-based)
│   ├── index.js                 # Application initialization
│   ├── store.js                 # Client-side state management (legacy)
│   ├── api.js                   # External API integration (legacy)
│   ├── bookmarks.js             # Main UI component (legacy)
│   ├── jSonExtension.js         # jQuery utility extensions
│   ├── firebase-api.js          # Firebase API wrapper
│   ├── firebase-config.js       # Firebase configuration
│   ├── auth.js                  # Authentication logic
│   ├── analytics.js             # Analytics tracking
│   └── security.js              # Security utilities
│
├── functions/                    # Firebase Cloud Functions
│   ├── index.js                 # Cloud Functions definitions
│   │   ├── fetchMetadata       # Extract webpage metadata
│   │   ├── captureScreenshot   # Generate Puppeteer screenshots
│   │   ├── autoTagBookmark     # AI-powered tagging (Google NLP)
│   │   ├── shareCollection     # Collection sharing logic
│   │   └── removeCollaborator  # Collaborator management
│   ├── package.json             # Functions dependencies
│   └── package-lock.json
│
├── tests/                        # Vitest unit tests
│   ├── setup.js                 # Test configuration
│   ├── api.test.js              # API integration tests
│   ├── store.test.js            # Store logic tests
│   └── README.md                # Testing documentation
│
├── styles/                       # CSS stylesheets
│   ├── main.css                 # Core application styles
│   ├── grid.css                 # CSS Grid layout system
│   ├── auth.css                 # Authentication page styles
│   ├── chrome-theme.css         # Chrome extension theme
│   ├── enhanced-firebase.css    # Enhanced Firebase theme
│   ├── firebase-theme.css       # Firebase brand styling
│   └── modern.css               # Modern UI styles
│
├── dist/                         # Vite production build output
│   ├── index.html               # Minified HTML
│   └── assets/                  # Optimized JS, CSS bundles
│       ├── index-cT8p4MJK.js   # Main JavaScript bundle
│       ├── index-cT8p4MJK.js.map # Source map
│       └── index-CIAyJUlp.css  # Compiled CSS
│
├── build/                        # Alternative build directory
│   └── index.html
│
├── extensions/                   # Firebase extension configurations
│   ├── firestore-algolia-search.env  # Algolia sync extension config
│   ├── firestore-send-email.env      # Email extension config
│   └── firestore-send-email-4rca.env
│
├── screenshots/                  # Application screenshots for documentation
│   ├── auth.png
│   ├── bookmarks-grid.png
│   ├── search.png
│   └── collections.png
│
├── .github/                      # GitHub Actions CI/CD workflows
│   └── workflows/
│       ├── ci.yml               # Linting and testing
│       ├── docker-build-push.yml # Docker image builds
│       ├── firebase-hosting-merge.yml # Production deployment
│       └── firebase-hosting-pull-request.yml # Preview deployments
│
├── .artiforge/                   # Artiforge documentation
│   └── report.md                # Code analysis report
│
├── Configuration Files:
│   ├── index.html               # Main HTML entry point
│   ├── package.json             # Node.js dependencies and scripts
│   ├── package-lock.json        # Locked dependency versions
│   ├── vite.config.js           # Vite build configuration
│   ├── vitest.config.js         # Vitest testing configuration
│   ├── tailwind.config.js       # Tailwind CSS customization
│   ├── postcss.config.js        # PostCSS configuration
│   ├── firebase.json            # Firebase project configuration
│   ├── firestore.rules          # Firestore security rules
│   ├── storage.rules            # Firebase Storage security rules
│   ├── Dockerfile               # Multi-stage Docker build
│   ├── docker-compose.yml       # Production container orchestration
│   ├── docker-compose.dev.yml   # Development container setup
│   ├── nginx.conf               # Production nginx configuration
│   ├── _config.yml              # GitHub Pages configuration
│   └── build-firebase.js        # Firebase build script
│
├── Documentation:
│   ├── README.md                # Project overview and setup
│   ├── CLAUDE.md                # Claude Code AI instructions
│   ├── AGENTS.md                # AI agent documentation (this file)
│   ├── BUILD.md                 # Build process documentation
│   ├── DOCKER.md                # Docker deployment guide
│   ├── SETUP.md                 # Setup instructions
│   ├── FIREBASE_SETUP.md        # Firebase configuration guide
│   ├── FIREBASE_AUTH_SETUP.md   # Firebase Authentication setup
│   ├── FIREBASE_FEATURES.md     # Firebase features documentation
│   ├── FIREBASE_HOSTING.md      # Firebase Hosting configuration
│   ├── DEPLOYMENT_SUMMARY.md    # Deployment documentation
│   ├── CICD.md                  # CI/CD pipeline documentation
│   ├── ADBLOCKER_HELP.md        # Ad blocker troubleshooting
│   └── LICENSE                  # GNU GPLv3 License
│
└── Additional Files:
    ├── sitemap.xml              # SEO sitemap
    ├── robots.txt               # SEO robots file
    ├── browserconfig.xml        # Windows tile configuration
    ├── serve.py                 # Python development server
    ├── build.js                 # Build script
    ├── build.config.js          # Build configuration
    ├── debug.html               # Debugging page
    ├── test-firebase.html       # Firebase testing page
    └── test-forgot-password.html # Password reset testing
```

---

## External Resources

### Framework Documentation

#### React Official Documentation
- **URL**: https://react.dev
- **Description**: React 19 API reference, Hooks guide, best practices
- **Relevance**: Primary frontend framework

#### Vite Documentation
- **URL**: https://vite.dev
- **Description**: Vite configuration, plugins, build optimization
- **Relevance**: Development server and production builds

#### Tailwind CSS Documentation
- **URL**: https://tailwindcss.com/docs
- **Description**: Utility classes, customization, responsive design
- **Relevance**: UI styling system

### Firebase Services

#### Firebase Documentation
- **URL**: https://firebase.google.com/docs
- **Description**: Comprehensive Firebase platform documentation
- **Relevance**: Backend infrastructure

##### Sub-Resources:
- **Firebase Authentication**: https://firebase.google.com/docs/auth
  - User authentication setup and SDK reference

- **Cloud Firestore**: https://firebase.google.com/docs/firestore
  - NoSQL database queries, security rules, best practices

- **Cloud Functions**: https://firebase.google.com/docs/functions
  - Serverless function deployment and triggers

- **Firebase Storage**: https://firebase.google.com/docs/storage
  - File storage and retrieval

- **Firebase Hosting**: https://firebase.google.com/docs/hosting
  - Static hosting and CDN configuration

- **Firestore Security Rules**: https://firebase.google.com/docs/firestore/security/get-started
  - Data access control and authorization patterns

### Search and AI Services

#### Algolia Documentation
- **URL**: https://www.algolia.com/doc/
- **Description**: Instant search implementation, API reference
- **Relevance**: Search functionality

##### Sub-Resources:
- **React InstantSearch**: https://www.algolia.com/doc/api-reference/widgets/react/
  - React search UI components

- **Algolia Firebase Extension**: https://firebase.google.com/products/extensions/algolia-firestore-algolia-search
  - Automatic Firestore to Algolia synchronization

#### Google Cloud Natural Language API
- **URL**: https://cloud.google.com/natural-language/docs
- **Description**: Content classification, entity extraction, sentiment analysis
- **Relevance**: AI-powered bookmark tagging

#### Puppeteer Documentation
- **URL**: https://pptr.dev
- **Description**: Headless Chrome automation, screenshot generation
- **Relevance**: Bookmark screenshot capture

##### Sub-Resources:
- **@sparticuz/chromium**: https://github.com/Sparticuz/chromium
  - Serverless-compatible Chromium for AWS Lambda/Cloud Functions

### Testing Framework

#### Vitest Documentation
- **URL**: https://vitest.dev
- **Description**: Unit testing with Vite integration
- **Relevance**: Test infrastructure

### NPM Libraries

#### Core Dependencies
- **algoliasearch** (5.44.0): https://www.npmjs.com/package/algoliasearch
  - Algolia JavaScript client for search queries

- **firebase** (12.6.0): https://www.npmjs.com/package/firebase
  - Firebase JavaScript SDK for frontend integration

- **firebase-admin** (13.4.0): https://www.npmjs.com/package/firebase-admin
  - Firebase Admin SDK for Cloud Functions

- **react** (19.2.0): https://www.npmjs.com/package/react
  - React library for UI components

- **react-dom** (19.2.0): https://www.npmjs.com/package/react-dom
  - React DOM renderer for browser

- **react-instantsearch** (7.20.0): https://www.npmjs.com/package/react-instantsearch
  - React components for Algolia search UI

- **tailwindcss** (3.4.16): https://www.npmjs.com/package/tailwindcss
  - Utility-first CSS framework

- **vite** (7.2.2): https://www.npmjs.com/package/vite
  - Frontend build tool with HMR

- **vitest** (4.0.10): https://www.npmjs.com/package/vitest
  - Vite-native testing framework

- **@vitejs/plugin-react** (5.1.1): https://www.npmjs.com/package/@vitejs/plugin-react
  - Official Vite React plugin with Fast Refresh

### DevOps Tools

#### Docker
- **URL**: https://docs.docker.com
- **Description**: Container platform for application deployment
- **Usage**: Multi-stage builds for development and production environments

#### nginx
- **URL**: https://nginx.org/en/docs/
- **Description**: High-performance web server
- **Usage**: Production static file serving with security headers (CSP, HSTS)

#### GitHub Actions
- **URL**: https://docs.github.com/en/actions
- **Description**: CI/CD automation platform
- **Usage**: Automated linting, testing, Docker builds, Firebase deployments

#### Firebase CLI
- **URL**: https://firebase.google.com/docs/cli
- **Description**: Command-line tools for Firebase
- **Usage**: Local development with emulators, deployment, configuration management

#### ESLint
- **URL**: https://eslint.org/docs/latest/
- **Description**: JavaScript/React linting tool
- **Usage**: Code quality enforcement and consistency checks

#### PostCSS
- **URL**: https://postcss.org
- **Description**: CSS transformation tool
- **Usage**: Autoprefixer for browser compatibility

### REST APIs

#### Firebase REST API
- **URL**: https://firebase.google.com/docs/reference/rest/auth
- **Description**: RESTful API for Firebase services
- **Usage**: Alternative to SDK for server-side operations

#### Algolia Search API
- **URL**: https://www.algolia.com/doc/rest-api/search/
- **Description**: RESTful search API
- **Usage**: Direct search queries and index management

#### Google Cloud Natural Language API
- **URL**: https://cloud.google.com/natural-language/docs/reference/rest
- **Description**: REST API for text analysis
- **Usage**: Content classification and entity extraction for bookmark tagging

### Cloud Platforms

#### Firebase Platform
- **URL**: https://firebase.google.com
- **Description**: Google's app development platform (Backend-as-a-Service)
- **Services Used**:
  - Authentication (email/password, Google OAuth)
  - Cloud Firestore (NoSQL database)
  - Cloud Functions (serverless compute)
  - Firebase Storage (file storage)
  - Firebase Hosting (static hosting)
  - Firebase Extensions (Algolia sync, SMTP email)

#### Google Cloud Platform
- **URL**: https://cloud.google.com
- **Description**: Google's cloud computing services
- **Services Used**:
  - Natural Language API for AI tagging
  - Cloud Functions runtime environment

#### Algolia
- **URL**: https://www.algolia.com
- **Description**: Hosted search platform
- **Usage**: Instant search with typo tolerance and faceted filtering

#### Docker Hub
- **URL**: https://hub.docker.com
- **Description**: Container image registry
- **Usage**: Hosting production Docker images (maxjeffwell/firebook)

#### GitHub
- **URL**: https://github.com
- **Description**: Version control and CI/CD platform
- **Usage**: Source code hosting, issue tracking, pull requests, GitHub Actions workflows
- **Repository**: https://github.com/maxjeffwell/bookmarks-capstone-api

### Community Resources

- **Firebase Community Slack**: https://firebase.community
  - Community support for Firebase developers

- **Algolia Discourse Community**: https://discourse.algolia.com
  - Community forum for Algolia developers

- **React Community Discord**: https://react.dev/community
  - Official React community channels

- **Stack Overflow - Firebase**: https://stackoverflow.com/questions/tagged/firebase
  - Q&A for Firebase development

- **Stack Overflow - React**: https://stackoverflow.com/questions/tagged/reactjs
  - Q&A for React development

### Learning Resources

- **Firebase Codelab**: https://firebase.google.com/codelabs
  - Hands-on Firebase tutorials

- **React Tutorial**: https://react.dev/learn
  - Official React learning path

- **Tailwind CSS IntelliSense**: https://tailwindcss.com/docs/editor-setup
  - IDE plugins for Tailwind development

- **Thinkful Engineering Immersion**: https://www.thinkful.com/bootcamp/web-development/
  - Original educational program context

---

## Additional Context

### Key Features

#### AI Automation
- **Automatic Screenshot Capture**: Puppeteer Cloud Function captures webpage previews automatically
- **Smart Tagging**: Google Natural Language API generates contextual tags from page content
- **Metadata Extraction**: Automatically fetches titles, descriptions, favicons, and Open Graph images
- **One-Click Tag Application**: Apply AI-suggested tags instantly to organize bookmarks

#### Search and Organization
- **Algolia Instant Search**: Lightning-fast search-as-you-type with fuzzy matching and typo tolerance
- **Collections**: Organize bookmarks into shareable collections
- **Collaborative Sharing**: Share collections with viewer or editor permissions
- **Rating System**: 1-5 star rating for bookmark prioritization
- **Smart Filtering**: Filter by rating, tags, or any metadata field

#### User Experience
- **In-App Editing**: Edit bookmark details without leaving the app or refreshing the page
- **Import/Export**: Bulk import and export bookmarks as JSON for data portability
- **Real-time Sync**: Changes sync instantly across all devices via Firestore listeners
- **Responsive Design**: Mobile-first UI with Tailwind CSS
- **Multiple Views**: Grid/gallery views for browsing bookmarks

#### Security and Authentication
- **Firebase Authentication**: Email/password and Google OAuth sign-in
- **User Data Isolation**: Firestore security rules enforce user-isolated data access
- **Content Security Policy**: CSP headers for XSS protection
- **Secure API Keys**: Environment-based secret management

### Data Models

#### Bookmark Model
- `id` (string): Unique bookmark identifier (Firestore document ID)
- `title` (string): Bookmark title (extracted or user-provided)
- `url` (string, required): Bookmark URL
- `desc` (string): Description or notes
- `rating` (number): Rating from 1-5 stars
- `tags` (string[]): User-applied tags
- `suggestedTags` (string[]): AI-generated tag suggestions
- `screenshot` (string): Firebase Storage URL for screenshot
- `image` (string): Open Graph image URL
- `favicon` (string): Favicon URL
- `siteName` (string): Website name
- `fetched` (boolean): Metadata fetching status
- `autoTagged` (boolean): AI tagging status
- `createdAt` (timestamp): Creation timestamp

#### Collection Model
- `id` (string): Unique collection identifier
- `name` (string, required): Collection name
- `description` (string): Collection description
- `ownerId` (string, required): Owner's Firebase Auth UID
- `ownerEmail` (string): Owner's email address
- `bookmarks` (string[]): Array of bookmark IDs in collection
- `collaborators` (map): Map of userId to collaborator object with email, permission ('viewer' | 'editor'), and addedAt timestamp
- `createdAt` (timestamp): Creation timestamp

#### User Model
- `uid` (string): Firebase Authentication UID
- `email` (string): User email address
- `displayName` (string): User display name
- `photoURL` (string): Profile photo URL (from OAuth)

### Use Cases

#### Personal Bookmark Collection
1. User signs in with email/password or Google OAuth
2. User adds bookmark with URL, title, description, and rating
3. Cloud Function automatically fetches metadata and favicon
4. Cloud Function captures screenshot and stores in Firebase Storage
5. Cloud Function analyzes page content and suggests tags using Google NLP
6. User reviews and applies suggested tags with one click
7. Bookmark appears in real-time across all user's devices
8. User searches bookmarks with Algolia instant search

#### Team Collaboration on Shared Collections
1. Owner creates a collection (e.g., "Design Resources")
2. Owner shares collection with collaborators via email
3. Cloud Function sends email notification to collaborators
4. Collaborators receive viewer or editor permissions
5. Editors can add/remove bookmarks from collection
6. Viewers can browse but not modify collection
7. All changes sync in real-time via Firestore listeners
8. Owner can remove collaborators or delete collection

#### Import/Export Bookmark Data
1. User exports all bookmarks as JSON file for backup
2. User backs up JSON file locally or to cloud storage
3. User imports bookmarks from JSON file (e.g., from another service)
4. Application preserves all metadata during import/export

### Deployment

#### Production Environment
- **Hosting**: Firebase Hosting with global CDN distribution
- **URL**: https://marmoset-c2870.firebaseapp.com
- **CI/CD**: GitHub Actions automatic deployment on merge to master
- **Preview Environments**: Firebase Hosting preview channels for pull requests (7-day expiration)

#### Docker Deployment
- **Production Image**: maxjeffwell/firebook (Docker Hub)
- **Configuration**: nginx with optimized static file serving
- **Registry**: Docker Hub

### Performance Characteristics

- **Search Query Time**: Sub-10ms with Algolia instant search
- **Bundle Size**: 873 KB uncompressed, 256 KB gzipped (Vite optimized)
- **Real-time Sync**: Instant propagation via Firestore listeners
- **Screenshot Generation**: 2-5 seconds (Cloud Function with Puppeteer)
- **AI Tagging**: 3-10 seconds (Google Natural Language API)
- **Cold Start Time**: Cloud Functions v2 with optimized runtime

### Educational Context

**Original Curriculum**: Thinkful Engineering Immersion - Web Development Fundamentals

**Skills Demonstrated**:
- Modern React development with Hooks and Context API
- Serverless architecture with Firebase Cloud Functions
- AI integration with Google Cloud Natural Language API
- Real-time systems with Firestore listeners
- Cloud automation with headless browser (Puppeteer)
- DevOps practices: Docker, CI/CD, automated deployments
- Security implementation: Authentication, authorization, CSP
- Performance optimization: Code splitting, lazy loading, CDN

**Evolution Narrative**: Began as a jQuery-based frontend application consuming a RESTful API. Evolved into a full-stack serverless platform with React migration for modern component architecture, Firebase backend replacing traditional REST API, AI-powered automation with Google Cloud services, real-time collaboration features, and production-grade DevOps infrastructure.

### Current Technical Debt

- TypeScript migration pending for improved type safety
- Legacy jQuery code in `scripts/` directory (functional but not actively used)
- Test coverage incomplete (`tests/` directory has basic structure)
- Accessibility audit needed for WCAG 2.1 AA compliance

### Future Roadmap

- TypeScript migration for type safety
- Browser extension for quick bookmark capture
- Nested folders and hierarchical organization
- Tag management UI (rename, merge, delete tags)
- Bookmark annotations and highlights
- Link checking and dead link detection
- Duplicate bookmark detection
- Advanced filters (date range, domain, etc.)
- Keyboard shortcuts for power users
- Dark mode toggle
- WCAG 2.1 AA accessibility compliance

### Implementation Patterns

- React Context API for authentication state (avoiding Redux complexity)
- Firebase security rules as declarative authorization layer
- Cloud Functions as microservices for specific automation tasks
- Algolia extension for zero-maintenance search index synchronization
- Multi-stage Docker builds separating development and production concerns

### Performance Considerations

- Firestore query optimization with proper indexing
- Cloud Functions cold start mitigation strategies
- Image optimization and lazy loading for bookmark screenshots
- Algolia query result caching at client level

---

## Testing Instructions

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (continuous testing)
npm run test:watch

# Run tests with UI
npm run test:ui

# Generate test coverage report
npm run test:coverage
```

### Test Structure

- **Test Files**: Located in `tests/` directory
- **Test Configuration**: `tests/setup.js` for Vitest configuration
- **Test Environments**: happy-dom or jsdom for DOM simulation

### Writing Tests

- Write unit tests for critical business logic
- Test files should end with `.test.js` or `.spec.js`
- Use Vitest's `describe`, `it`, `expect` syntax
- Mock Firebase services and Algolia client in tests

---

## Build and Development

### Prerequisites

- Node.js 20+ installed
- npm package manager
- Firebase CLI: `npm install -g firebase-tools`
- Docker (optional, for containerized deployment)

### Local Development

```bash
# Clone repository
git clone https://github.com/maxjeffwell/bookmarks-capstone-api.git
cd bookmarks-capstone-api

# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local
# Add your Algolia Search API key to .env.local

# Start development server
npm run dev
# Vite dev server runs at http://localhost:3000
```

### Environment Variables

Create `.env.local` with:

```env
VITE_ALGOLIA_APP_ID=your-app-id
VITE_ALGOLIA_SEARCH_API_KEY=your-search-only-api-key
VITE_ALGOLIA_INDEX_NAME=bookmarks
```

Firebase configuration is in `src/services/firebase.js` (replace with your project credentials).

### Build for Production

```bash
# Build optimized bundle
npm run build
# Output: dist/ directory (873 KB, 256 KB gzipped)

# Preview production build
npm run preview
```

### Firebase Deployment

```bash
# Login to Firebase
firebase login

# Deploy hosting + functions
firebase deploy

# Deploy specific services
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
```

### Docker Deployment

#### Production (nginx + static files)

```bash
# Build and run production container
docker-compose up -d

# Access at http://localhost:8080
```

#### Development (Vite HMR)

```bash
# Run dev server in container
docker-compose -f docker-compose.dev.yml up

# Access at http://localhost:3000
```

### Available NPM Scripts

- `npm run dev`: Start Vite development server
- `npm run build`: Build optimized production bundle
- `npm run preview`: Preview production build locally
- `npm test`: Run Vitest tests once
- `npm run test:watch`: Run tests in watch mode
- `npm run test:ui`: Run tests with UI
- `npm run test:coverage`: Generate test coverage report
- `npm run firebase:login`: Login to Firebase CLI
- `npm run firebase:init`: Initialize Firebase project
- `npm run firebase:serve`: Build and serve locally with Firebase
- `npm run firebase:deploy`: Build and deploy to Firebase hosting and Firestore
- `npm run firebase:deploy:preview`: Deploy preview channel (7-day expiration)
- `npm run firebase:emulators`: Start Firebase emulators for local development

---

## Notes for AI Agents

### Project Philosophy

This project demonstrates a complete evolution from an educational jQuery-based application to a production-ready, AI-enhanced serverless platform. When working on this codebase:

1. **Preserve Legacy Code**: The `scripts/` directory contains legacy jQuery code from the original educational project. Do not modify or remove unless specifically requested.

2. **Firebase-First Approach**: All backend operations should leverage Firebase services (Authentication, Firestore, Cloud Functions, Storage, Hosting).

3. **Security First**: Always consider Firestore security rules when implementing new features. User data must be isolated and protected.

4. **Performance Matters**: Keep bundle size optimized, leverage Algolia for search, and use Firestore real-time listeners appropriately.

5. **AI Integration**: The project showcases practical AI integration. When adding features, consider how AI/ML services can enhance user experience.

6. **Mobile-First Design**: All UI changes should be responsive and mobile-friendly.

7. **Type Safety Goal**: While the project is currently JavaScript, there's a future roadmap item for TypeScript migration. Write code that would be easy to type later.

8. **Testing Coverage**: Improve test coverage incrementally. Write tests for new features and critical business logic.

9. **Documentation**: Keep documentation up-to-date. If you change functionality, update relevant documentation files.

10. **Accessibility**: Consider accessibility in all UI changes. Use semantic HTML, ARIA attributes, and keyboard navigation.

### Common Tasks

- **Adding a New Component**: Create in `src/components/` or `src/pages/`, use functional components with Hooks
- **Modifying Firestore Structure**: Update security rules in `firestore.rules` and data models in this documentation
- **Adding a Cloud Function**: Create in `functions/index.js`, use async/await, implement error handling
- **Styling Changes**: Use Tailwind utility classes, stick to Firebase brand colors
- **Search Functionality**: Leverage Algolia SDK and React InstantSearch components
- **Authentication**: Use Firebase Authentication SDK and AuthContext for state

### Troubleshooting

- **Firestore Permission Denied**: Check security rules in `firestore.rules` and ensure user is authenticated
- **Algolia Search Not Working**: Verify environment variables in `.env.local` and check Algolia Firebase extension configuration
- **Cloud Function Errors**: Check Firebase Console logs for detailed error messages
- **Build Failures**: Clear `node_modules` and reinstall dependencies, check Node.js version (20+)
- **Docker Issues**: Ensure Docker daemon is running, check port conflicts (3000, 8080)

---

**Generated with FireBook AI Documentation System**
**Last Updated**: 2025-12-08
**Version**: 1.0.0
