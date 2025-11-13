<div align="center">

<img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase"/>
<img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript"/>
<img src="https://img.shields.io/badge/jQuery-0769AD?style=for-the-badge&logo=jquery&logoColor=white" alt="jQuery"/>
<img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"/>

</div>

# <div align="center">🔥 **FireBook** 🔥</div>

<div align="center">

### A full-stack bookmarks application originally created as part of Thinkful's Engineering Immersion program. Initially built as a frontend-only app with a REST API, it has been enhanced with Firebase integration for authentication, real-time data synchronization, and secure user-isolated bookmark storage.

[![🚀 Live App](https://img.shields.io/badge/🚀_Live_App-FF5722?style=for-the-badge&logoColor=white)](https://marmoset-c2870.firebaseapp.com)

### Build Status

![CI](https://github.com/maxjeffwell/bookmarks-capstone-api/workflows/CI/badge.svg)
![Docker Build & Push](https://github.com/maxjeffwell/bookmarks-capstone-api/workflows/Docker%20Build%20%26%20Push/badge.svg)
![Deploy to Firebase Hosting on merge](https://github.com/maxjeffwell/bookmarks-capstone-api/workflows/Deploy%20to%20Firebase%20Hosting%20on%20merge/badge.svg)

</div>

## 🛠️ Technology Stack

### <span style="color: #FF5722">🔥 Frontend</span>
* **jQuery** for AJAX and DOM manipulation
* **Vanilla JavaScript (ES6+)** with modular architecture
* **Semantic HTML5** with accessibility features
* **CSS Grid** for responsive design
* **Material Design-inspired** UI theme
* **React-ful design pattern** (state-driven UI rendering)

### <span style="color: #FFCA28">🔥 Backend (Firebase)</span>
* **🔐 Firebase Authentication** - Email/password and Google OAuth
* **🗄️ Cloud Firestore** - NoSQL database with real-time synchronization
* **🌐 Firebase Hosting** - CDN-based static hosting with security headers
* **⚡ Firebase Emulators** - Local development environment

## ✨ Features

* **🔐 User Authentication** - Secure sign-up/sign-in with email or Google account
* **📁 Personal Bookmark Collections** - Each user has their own private bookmark library
* **⚡ Real-time Synchronization** - Changes sync instantly across devices
* **📱 Offline Support** - Works offline with Firestore persistence
* **🔄 Dual-mode Architecture** - Supports both Firebase and REST API backends
* **📱 Responsive Design** - Mobile-first approach with CSS Grid
* **♿ Accessibility** - ARIA labels, keyboard navigation, screen reader support

## 👥 User Stories

<div style="background: linear-gradient(135deg, #FFCA28 0%, #FF5722 100%); padding: 20px; border-radius: 10px; color: black; font-weight: bold;">

> **As a user:**

</div>

* **🆕** I can create an account or sign in with email/password or Google
* **📌** I can add bookmarks to my personal bookmark collection
  * **📝** Bookmarks contain:
    * **📘** Title
    * **🔗** URL link
    * **📄** Description
    * **⭐** Rating (1-5 stars)
* **📋** I can see a list of my bookmarks when I sign in
* **📊** All bookmarks in the list default to a "condensed" view showing only title and rating
* **👆** I can click on a bookmark to display the "detailed" view
* **🔍** Detailed view expands to additionally display description and a "Visit Site" link
* **🗑️** I can remove bookmarks from my collection
* **⚠️** I receive appropriate feedback when I cannot submit a bookmark
* **🔎** I can filter bookmarks by minimum rating
* **⚡** My bookmarks sync across all my devices in real-time
* **📱** I can access my bookmarks even when offline

## 🏗️ Architecture

### <span style="color: #FFCA28">🔥 Firebase Integration</span>
The application uses Firebase services for a complete backend solution:

* **🔐 Authentication Flow**: Users sign in via Firebase Auth, which provides a unique user ID for data isolation
* **🗄️ Data Storage**: Bookmarks are stored in Firestore at `/users/{userId}/bookmarks/{bookmarkId}`
* **🛡️ Security**: Firestore security rules ensure users can only read/write their own data
* **⚡ Real-time Updates**: Optional real-time listeners for instant synchronization
* **📱 Offline Persistence**: Firestore caching enables offline functionality

### <span style="color: #FF5722">⚙️ Build Process</span>
* **📦 Webpack-based** build system with Firebase-specific optimizations
* **🌍 Environment-based** configuration (development/production)
* **⚡ Service worker** generation for PWA capabilities
* **🗜️ Automatic** minification and bundling

### <span style="color: #FFCA28">💻 Development Setup</span>

<div style="background: #1A1A1A; padding: 15px; border-radius: 8px; border-left: 4px solid #FFCA28;">

```bash
# Install dependencies
npm install

# Run local development with Firebase emulators
npm run dev:firebase

# Build for production
npm run build

# Deploy to Firebase
npm run deploy
```

</div>

## 📸 Application Screenshots

<div align="center">

### <span style="color: #FFCA28">🔥 User Interface Gallery</span>

</div>

| Feature | Light Mode | Dark Mode |
|---------|------------|-----------|
| **🔐 Authentication** | ![Sign In Form - Light](screenshots/Screen%20Shot%202025-08-16%20at%2006.27.52.png) | ![Authenticated User - Dark](screenshots/Screen%20Shot%202025-08-16%20at%2006.28.44.png) |
| **📝 Add Bookmark** | ![Add Bookmark Form - Light](screenshots/Screen%20Shot%202025-08-16%20at%2006.27.22.png) | ![Add Bookmark Form - Dark](screenshots/Screen%20Shot%202025-08-16%20at%2006.28.59.png) |
| **📋 Bookmark List** | ![Bookmark List - Light](screenshots/Screen%20Shot%202025-08-16%20at%2006.28.30.png) | |
| **✏️ Edit & Manage** | ![Bookmark Actions - Light](screenshots/Screen%20Shot%202025-08-16%20at%2006.29.41.png) | ![Edit Form - Dark](screenshots/Screen%20Shot%202025-08-16%20at%2006.29.55.png) |
| **🔍 Bulk Operations** | ![Bulk Selection - Light](screenshots/Screen%20Shot%202025-08-16%20at%2006.29.12.png) | |

### <span style="color: #FF5722">📱 Key UI Features Demonstrated</span>

* **🔐 Firebase Authentication** - Email/password sign-in with Google OAuth option
* **📝 Bookmark Creation** - Complete form with title, URL, rating, description, and tags
* **⭐ Star Rating System** - Interactive 5-star rating with visual feedback
* **🌙 Theme Toggle** - Seamless light/dark mode switching for enhanced UX
* **🎯 Bulk Selection** - Multi-select functionality with batch operations (delete, export)
* **✏️ Edit Functionality** - In-place editing with Visit Site, Edit, and Delete actions
* **📱 Responsive Design** - Mobile-optimized interface with touch-friendly controls
* **🔍 Search & Filter** - Real-time bookmark filtering and search capabilities

### <span style="color: #FFCA28">🎨 Design System</span>

* **🔥 Firebase Brand Colors** - Orange (#FF5722) and Yellow (#FFCA28) gradient theme
* **📐 Clean Layout** - Card-based design with consistent spacing and typography
* **♿ Accessibility** - High contrast ratios and semantic HTML structure
* **⚡ Interactive Elements** - Hover states, smooth transitions, and visual feedback

## 🚀 Next Steps

### <span style="color: #FF5722">🎯 Planned Features</span>
* **🔍 Advanced Search** - Full-text search across titles, descriptions, and URLs
* **👥 Social Features** - Share bookmark collections or individual bookmarks with other users
* **🧩 Browser Extension** - Quick bookmark creation from any webpage
* **📱 Progressive Web App** - Enhanced offline capabilities and installable app experience

### <span style="color: #FFCA28">⚡ Technical Improvements</span>
* **📝 TypeScript Migration** - Add type safety to improve code maintainability
* **⚛️ React/Vue Conversion** - Modernize the frontend with a component-based framework
* **🔗 GraphQL API** - Replace REST endpoints with more flexible GraphQL queries
* **🧪 Testing Suite** - Implement unit and integration tests with Jest/Cypress
* **🔄 CI/CD Pipeline** - Automate testing and deployment with GitHub Actions

### <span style="color: #FF5722">🏗️ Infrastructure Enhancements</span>
* **☁️ Cloud Functions** - Server-side processing for bookmark metadata extraction
* **🖼️ Image Caching** - Store and serve website thumbnails/favicons
* **💾 Backup System** - Automated data backups and user data export
* **🌐 Multi-region Deployment** - Improve global performance with edge functions

---

<div align="center">

## 👤 Author

<div style="background: linear-gradient(135deg, #FFCA28 0%, #FF5722 100%); padding: 20px; border-radius: 15px; margin: 20px 0;">

**🔥 Jeff Maxwell 🔥**

[![Email](https://img.shields.io/badge/📧_Email-jeff@el--jefe.me-FF5722?style=for-the-badge)](mailto:jeff@el-jefe.me)
[![GitHub](https://img.shields.io/badge/🐙_GitHub-maxjeffwell-FFCA28?style=for-the-badge&logo=github&logoColor=black)](https://github.com/maxjeffwell)
[![Portfolio](https://img.shields.io/badge/🌐_Portfolio-el--jefe.me-FF5722?style=for-the-badge)](https://www.el-jefe.me)

</div>

---

<div style="background: #1A1A1A; padding: 15px; border-radius: 8px; color: #FFCA28;">

**📄 License**

Distributed under the **GNU GPLv3 License**.  
See `LICENSE` for more information.

</div>

<br>

<div style="color: #FF5722; font-size: 24px; font-weight: bold;">
🔥 Made with Firebase 🔥
</div>

</div>

