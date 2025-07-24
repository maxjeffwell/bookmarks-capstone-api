# FireBook

> A full-stack bookmarks application originally created as part of Thinkful's Engineering Immersion program. Initially built as a frontend-only app with a REST API, it has been enhanced with Firebase integration for authentication, real-time data synchronization, and secure user-isolated bookmark storage.

## [Live App](https://marmoset-c2870.firebaseapp.com)

## Screenshots

[![create a bookmark](https://i.gyazo.com/3ddb4f574a8cea412bb190ecd5ebfcdd.png)](https://gyazo.com/3ddb4f574a8cea412bb190ecd5ebfcdd)

[![create a bookmark with input text](https://i.gyazo.com/d84d9d0e3c66c6a01f3005a9b2f98381.png)](https://gyazo.com/d84d9d0e3c66c6a01f3005a9b2f98381)

[![bookmark item expanded view](https://i.gyazo.com/4a30da6a5ba458ce8f3a30ee641b32a6.png)](https://gyazo.com/4a30da6a5ba458ce8f3a30ee641b32a6)

## Technology Stack

### Frontend
* jQuery for AJAX and DOM manipulation
* Vanilla JavaScript (ES6+) with modular architecture
* Semantic HTML5 with accessibility features
* CSS Grid for responsive design
* Material Design-inspired UI theme
* React-ful design pattern (state-driven UI rendering)

### Backend (Firebase)
* **Firebase Authentication** - Email/password and Google OAuth
* **Cloud Firestore** - NoSQL database with real-time synchronization
* **Firebase Hosting** - CDN-based static hosting with security headers
* **Firebase Emulators** - Local development environment

## Features

* **User Authentication** - Secure sign-up/sign-in with email or Google account
* **Personal Bookmark Collections** - Each user has their own private bookmark library
* **Real-time Synchronization** - Changes sync instantly across devices
* **Offline Support** - Works offline with Firestore persistence
* **Dual-mode Architecture** - Supports both Firebase and REST API backends
* **Responsive Design** - Mobile-first approach with CSS Grid
* **Accessibility** - ARIA labels, keyboard navigation, screen reader support

## User Stories

> As a user:

* I can create an account or sign in with email/password or Google
* I can add bookmarks to my personal bookmark collection
  * Bookmarks contain:
    * Title
    * URL link
    * Description
    * Rating (1-5 stars)
* I can see a list of my bookmarks when I sign in
* All bookmarks in the list default to a "condensed" view showing only title and rating
* I can click on a bookmark to display the "detailed" view
* Detailed view expands to additionally display description and a "Visit Site" link
* I can remove bookmarks from my collection
* I receive appropriate feedback when I cannot submit a bookmark
* I can filter bookmarks by minimum rating
* My bookmarks sync across all my devices in real-time
* I can access my bookmarks even when offline

## Architecture

### Firebase Integration
The application uses Firebase services for a complete backend solution:

* **Authentication Flow**: Users sign in via Firebase Auth, which provides a unique user ID for data isolation
* **Data Storage**: Bookmarks are stored in Firestore at `/users/{userId}/bookmarks/{bookmarkId}`
* **Security**: Firestore security rules ensure users can only read/write their own data
* **Real-time Updates**: Optional real-time listeners for instant synchronization
* **Offline Persistence**: Firestore caching enables offline functionality

### Build Process
* Webpack-based build system with Firebase-specific optimizations
* Environment-based configuration (development/production)
* Service worker generation for PWA capabilities
* Automatic minification and bundling

### Development Setup
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

## Next Steps

### Planned Features
* **Edit Functionality** - Allow users to update bookmark details after creation
* **Advanced Search** - Full-text search across titles, descriptions, and URLs
* **Tags/Categories** - Organize bookmarks with custom tags and categories
* **Import/Export** - Support for importing bookmarks from browsers and exporting to common formats
* **Social Features** - Share bookmark collections or individual bookmarks with other users
* **Browser Extension** - Quick bookmark creation from any webpage
* **Progressive Web App** - Enhanced offline capabilities and installable app experience

### Technical Improvements
* **TypeScript Migration** - Add type safety to improve code maintainability
* **React/Vue Conversion** - Modernize the frontend with a component-based framework
* **GraphQL API** - Replace REST endpoints with more flexible GraphQL queries
* **Testing Suite** - Implement unit and integration tests with Jest/Cypress
* **CI/CD Pipeline** - Automate testing and deployment with GitHub Actions
* **Performance Monitoring** - Add analytics and performance tracking
* **Dark Mode** - User-selectable theme preferences

### Infrastructure Enhancements
* **Cloud Functions** - Server-side processing for bookmark metadata extraction
* **Image Caching** - Store and serve website thumbnails/favicons
* **Backup System** - Automated data backups and user data export
* **Multi-region Deployment** - Improve global performance with edge functions

## Meta
>**Author:** Jeff Maxwell 
>
><br>**Email:** [maxjeffwell@gmail.com](mailto:maxjeffwell@gmail.com) |
>
>**GitHub:** [https://www.github.com/maxjeffwell](https://github.com/maxjeffwell) |
>
>**Portfolio:** [https://www.el-jefe.me](https://www.el-jefe.me) |
>
></br>

Distributed under the GNU GPLv3 License.
    See ``LICENSE`` for more information.

