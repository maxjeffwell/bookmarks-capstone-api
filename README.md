<div align="center">

<img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>
<img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"/>
<img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase"/>
<img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS"/>
<img src="https://img.shields.io/badge/Algolia-5468FF?style=for-the-badge&logo=algolia&logoColor=white" alt="Algolia"/>
<img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"/>

</div>

# <div align="center">🔥 **FireBook** 🔥</div>

<div align="center">

### An intelligent bookmark management platform that automatically enriches saved links with AI-powered metadata, screenshots, and contextual tags. Built with React and Firebase, featuring real-time synchronization, collaborative collections, and instant search.

[![🚀 Live App](https://img.shields.io/badge/🚀_Live_App-FF5722?style=for-the-badge&logoColor=white)](https://marmoset-c2870.firebaseapp.com)
[![🐳 Docker Hub](https://img.shields.io/badge/🐳_Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://hub.docker.com/r/maxjeffwell/firebook)

### Build Status

![CI](https://github.com/maxjeffwell/bookmarks-capstone-api/workflows/CI/badge.svg)
![Docker Build & Push](https://github.com/maxjeffwell/bookmarks-capstone-api/workflows/Docker%20Build%20%26%20Push/badge.svg)
![Deploy to Firebase Hosting on merge](https://github.com/maxjeffwell/bookmarks-capstone-api/workflows/Deploy%20to%20Firebase%20Hosting%20on%20merge/badge.svg)

</div>

## 🌟 Key Features

### 🤖 AI-Powered Automation
* **📸 Automatic Screenshots** - Puppeteer-based Cloud Function captures webpage previews
* **🏷️ Smart Tagging** - Google Natural Language API generates contextual tags from page content
* **📊 Metadata Extraction** - Automatically fetches titles, descriptions, favicons, and Open Graph images
* **✨ One-Click Tag Application** - Apply AI suggestions instantly to organize bookmarks

### 🔍 Advanced Search & Organization
* **⚡ Algolia Instant Search** - Lightning-fast search-as-you-type with fuzzy matching
* **📚 Collections** - Organize bookmarks into shareable collections
* **👥 Collaborative Sharing** - Share collections with viewer or editor permissions
* **🎯 Smart Filtering** - Filter by rating, tags, or any metadata field

### 📱 Modern User Experience
* **✏️ In-App Editing** - Edit bookmark details without leaving the app
* **📦 Import/Export** - Bulk import and export bookmarks as JSON
* **🌓 Grid/Gallery Views** - Multiple display modes for browsing
* **📱 Responsive Design** - Mobile-first UI with Tailwind CSS
* **⚡ Real-time Sync** - Changes sync instantly across all devices
* **🔒 Secure Authentication** - Email/password and Google OAuth sign-in

## 🛠️ Technology Stack

### <span style="color: #61DAFB">⚛️ Frontend</span>
* **React 19** with Hooks (useState, useEffect, useContext)
* **Vite** - Fast HMR and optimized production builds
* **Tailwind CSS v3** - Utility-first styling with custom Firebase theme
* **React Context API** - Global authentication state management
* **React InstantSearch** - Algolia search UI components

### <span style="color: #FFCA28">🔥 Firebase Backend</span>
* **🔐 Firebase Authentication** - Email/password + Google OAuth
* **🗄️ Cloud Firestore** - NoSQL database with real-time listeners
* **⚡ Cloud Functions (v2)** - Serverless backend automation:
  * `fetchMetadata` - Extract webpage metadata (title, description, favicon, OG images)
  * `captureScreenshot` - Generate webpage previews with Puppeteer + Chromium
  * `autoTagBookmark` - AI-powered tag generation with Google Natural Language API
  * `shareCollection` - Collaborative collection sharing
  * `removeCollaborator` - Manage collection permissions
* **🌐 Firebase Hosting** - CDN-based static hosting with custom nginx config
* **💾 Firebase Storage** - Screenshot and image storage
* **📧 Extensions**:
  * Trigger Email (SMTP) - Transactional emails
  * Algolia Search - Real-time search index synchronization

### <span style="color: #5468FF">🔍 Search & AI</span>
* **Algolia** - Instant search with 10ms query times
* **Google Cloud Natural Language API** - Content classification and entity extraction
* **Puppeteer-core + @sparticuz/chromium** - Serverless-compatible screenshot generation

### <span style="color: #2496ED">🐳 DevOps & Infrastructure</span>
* **Docker** - Multi-stage builds (development + production)
* **nginx** - Production static file serving with security headers
* **GitHub Actions** - CI/CD workflows for automated testing and deployment
* **Firestore Security Rules** - User-isolated data access control

## 🏗️ Architecture

### Data Flow
```
User Action → React UI → Firebase SDK → Cloud Firestore
                ↓
         Firestore Triggers
                ↓
         Cloud Functions (Node.js 20)
                ↓
    ┌───────────┴───────────┐
    ↓                       ↓
Puppeteer Screenshot    Google NLP API
    ↓                       ↓
Firebase Storage      AI Tag Generation
```

### Firestore Data Structure
```
/users/{userId}/bookmarks/{bookmarkId}
  - title: string
  - url: string
  - desc: string
  - rating: number (1-5)
  - tags: string[]
  - suggestedTags: string[]
  - screenshot: string (Storage URL)
  - image: string (OG image URL)
  - favicon: string
  - siteName: string
  - fetched: boolean
  - autoTagged: boolean
  - createdAt: timestamp

/collections/{collectionId}
  - name: string
  - description: string
  - ownerId: string
  - ownerEmail: string
  - bookmarks: string[]
  - collaborators: {
      [userId]: {
        email: string
        permission: 'viewer' | 'editor'
        addedAt: timestamp
      }
    }
```

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm or yarn
- Firebase CLI (`npm install -g firebase-tools`)
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

## ☸️ Kubernetes Deployment

FireBook also runs on a self-hosted **K3s cluster** managed via ArgoCD GitOps:

- **Live:** [firebook.el-jefe.me](https://firebook.el-jefe.me)
- **Ingress:** Traefik with automatic TLS via cert-manager + Let's Encrypt
- **CI/CD:** GitHub Actions → Docker Hub → ArgoCD auto-sync
- **Helm:** Deployed via shared `portfolio-common` library chart

## 🐳 Docker Deployment

### Production (nginx + static files)

```bash
# Build and run production container
docker-compose up -d

# Access at http://localhost:8080
```

### Development (Vite HMR)

```bash
# Run dev server in container
docker-compose -f docker-compose.dev.yml up

# Access at http://localhost:3000
```

See [DOCKER.md](DOCKER.md) for detailed Docker documentation.

## 📸 Screenshots

### Authentication
<img src="screenshots/auth.png" alt="Google OAuth Sign-in" width="800"/>

### Bookmark Management with AI Features
<img src="screenshots/bookmarks-grid.png" alt="Bookmarks Grid View with AI Tags" width="800"/>

### Algolia Instant Search
<img src="screenshots/search.png" alt="Real-time Search" width="800"/>

### Collections & Sharing
<img src="screenshots/collections.png" alt="Collaborative Collections" width="800"/>

## 🎯 User Stories

> **As a user, I can:**

* **🔐 Authentication**
  * Sign up/sign in with email and password
  * Sign in with Google OAuth
  * Stay signed in across browser sessions

* **📌 Bookmark Management**
  * Add bookmarks with title, URL, description, rating, and tags
  * View all bookmarks with automatic metadata (title, favicon, screenshot)
  * Edit bookmark details in a modal
  * Delete bookmarks with confirmation
  * Filter bookmarks by rating (1-5 stars)
  * Apply AI-suggested tags with one click

* **🔍 Search & Discovery**
  * Search bookmarks instantly as I type
  * Find bookmarks by title, description, URL, or tags
  * See search results in milliseconds with Algolia

* **📚 Organization**
  * Create collections to organize bookmarks by theme
  * Share collections with other users (viewer or editor access)
  * Remove collaborators from my collections
  * View collections shared with me

* **📦 Data Portability**
  * Export all bookmarks as JSON
  * Import bookmarks from JSON files
  * Preserve all metadata during import/export

* **⚡ Real-time Experience**
  * See bookmark updates across devices instantly
  * Receive automatic metadata and screenshots
  * Get AI-generated tag suggestions within seconds

## 🧪 Testing

```bash
# Run linting
npm run lint

# Run tests (when implemented)
npm test

# Type checking (when TypeScript migration complete)
npm run type-check
```

## 📋 Firebase Setup

### Required Firebase Services
1. **Authentication** - Enable Email/Password and Google providers
2. **Firestore** - Deploy security rules from `firestore.rules`
3. **Storage** - Enable for screenshot storage
4. **Cloud Functions** - Deploy 5 functions:
   - `fetchMetadata`
   - `captureScreenshot`
   - `autoTagBookmark`
   - `shareCollection`
   - `removeCollaborator`
5. **Extensions**:
   - Install "Trigger Email" for SMTP notifications
   - Install "Algolia Search" and configure with your Algolia credentials

### Security Rules

Firestore rules ensure users can only access their own bookmarks and collections they own or collaborate on. See `firestore.rules` for implementation.

## 🔧 Configuration Files

* **`vite.config.js`** - Vite build configuration
* **`tailwind.config.js`** - Tailwind CSS customization with Firebase theme colors
* **`firebase.json`** - Firebase project configuration
* **`firestore.rules`** - Firestore security rules
* **`Dockerfile`** - Multi-stage Docker build
* **`nginx.conf`** - Production nginx configuration with CSP headers
* **`docker-compose.yml`** - Production container orchestration
* **`docker-compose.dev.yml`** - Development container setup

## 🎨 Design System

### Firebase Brand Colors
```css
--firebase-orange: #FF9800
--firebase-yellow: #FFC107
--firebase-amber: #FFA000
--firebase-blue: #2196F3
--firebase-navy: #1A237E
```

### Custom Tailwind Components
* `.btn-firebase` - Primary action button with gradient hover
* `.card` - Elevated card with hover shadow
* `.input-field` - Styled form input with Firebase orange focus ring

## 🚧 Roadmap

### ✅ Completed
- [x] React migration from jQuery
- [x] Vite build system
- [x] Firebase Authentication with Google OAuth
- [x] Cloud Functions for metadata extraction
- [x] Puppeteer screenshot generation
- [x] Google Natural Language API tagging
- [x] Algolia instant search
- [x] Collections with collaborative sharing
- [x] In-app bookmark editing
- [x] Import/Export JSON
- [x] Docker containerization
- [x] CI/CD with GitHub Actions

### 🎯 Planned Features
- [ ] TypeScript migration for type safety
- [ ] Browser extension for quick bookmark capture
- [ ] Bookmark folders and nested organization
- [ ] Tag management UI (rename, merge, delete tags)
- [ ] Bookmark notes and annotations
- [ ] Link checking and dead link detection
- [ ] Duplicate bookmark detection
- [ ] Advanced filters (date range, domain, etc.)
- [ ] Keyboard shortcuts
- [ ] Dark mode toggle
- [ ] Accessibility improvements (WCAG 2.1 AA)

## 📚 Documentation

* [Docker Setup](DOCKER.md) - Detailed Docker deployment guide
* [Firebase Functions](functions/README.md) - Cloud Functions documentation
* [Contributing Guidelines](CONTRIBUTING.md) - How to contribute

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the **GNU GPLv3 License**. See `LICENSE` for more information.

---

<div align="center">

## 👤 Author

**🔥 Jeff Maxwell 🔥**

[![Email](https://img.shields.io/badge/📧_Email-jeff@el--jefe.me-FF5722?style=for-the-badge)](mailto:jeff@el-jefe.me)
[![GitHub](https://img.shields.io/badge/🐙_GitHub-maxjeffwell-FFCA28?style=for-the-badge&logo=github&logoColor=black)](https://github.com/maxjeffwell)
[![Portfolio](https://img.shields.io/badge/🌐_Portfolio-el--jefe.me-FF5722?style=for-the-badge)](https://www.el-jefe.me)

---

### 🏆 Project Evolution

Originally created as part of Thinkful's Engineering Immersion program as a jQuery-based frontend application, FireBook has evolved into a full-stack, AI-enhanced platform demonstrating:

* **Modern React Development** - Hooks, Context API, component architecture
* **Serverless Architecture** - Firebase Cloud Functions, Firestore, Storage
* **AI Integration** - Google Cloud Natural Language API for intelligent tagging
* **Real-time Systems** - Firestore listeners, instant search with Algolia
* **Cloud Automation** - Headless browser automation with Puppeteer
* **DevOps Practices** - Docker containerization, CI/CD pipelines, automated deployments

<br>

**🔥 Built with Firebase + React + AI 🔥**

</div>
