# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Bookmarks Capstone API** is a frontend JavaScript application for managing web bookmarks, built as part of Thinkful's Engineering Immersion program. The project demonstrates fundamental web development skills using vanilla JavaScript, jQuery, and a RESTful API. Features include bookmark creation, rating, filtering, and responsive design following React-ful patterns.

## Commands

This is a static web application with no build process or package.json. The application runs directly in the browser.

### Development
- Open `index.html` in a web browser for local development
- Use a local web server (e.g., Live Server extension) for best development experience
- No build or compilation steps required

### Deployment
- Static site hosted on GitHub Pages
- Direct file serving without build process
- Live app: https://maxjeffwell.github.io/bookmarks-capstone-api/

## Architecture

### Application Structure
The application follows a modular architecture with clear separation of concerns:

**HTML Foundation** (`index.html`):
- Semantic HTML structure with accessibility attributes
- Google Fonts integration (Spectral font family)
- jQuery CDN integration for DOM manipulation and AJAX
- Script loading order: utilities → data → API → UI → initialization

**Modular JavaScript Organization:**
- Namespace-based modules to avoid global scope pollution
- IIFE (Immediately Invoked Function Expression) pattern for encapsulation
- Clear module boundaries with explicit return objects
- Event-driven architecture with centralized event handling

### Data Flow Architecture

**Store Pattern** (`scripts/store.js`):
- Centralized client-side state management
- Immutable state updates through dedicated methods
- State includes: bookmarks array, UI flags (adding, filter), error messages
- Single source of truth for application state

**API Layer** (`scripts/api.js`):
- RESTful API integration with Thinkful's bookmark service
- AJAX operations using jQuery for GET, POST, DELETE
- Callback-based error handling and success responses
- Base URL configuration for external API endpoint

**Render-State Pattern:**
- React-ful design pattern: state changes trigger complete re-renders
- Unidirectional data flow from state to UI
- Event handlers update state, which triggers UI updates

### Component Architecture

**Main Application Module** (`scripts/bookmarks.js`):
- Primary UI component responsible for rendering and user interactions
- Template-based HTML generation using ES6 template literals
- Event delegation for dynamic content handling
- Modular rendering functions for different UI sections

**Utility Extensions** (`scripts/jSonExtension.js`):
- jQuery plugin extension for form serialization to JSON
- Custom FormData handling for API payload preparation
- Enhances jQuery functionality for modern JavaScript patterns

### State Management

**Store Object Structure:**
```javascript
{
  bookmarks: [],        // Array of bookmark objects
  adding: true,         // Boolean flag for add form visibility
  filter: 0,           // Number for rating filter (0-5)
  error: null          // String error message or null
}
```

**State Mutation Methods:**
- `addBookmark()` - Adds new bookmark to collection
- `findAndDelete()` - Removes bookmark by ID
- `toggleBookmarkExpanded()` - Toggles detailed view state
- `toggleAdding()` - Controls add form visibility
- `setFilter()` - Updates rating filter
- `setError()` - Manages error message display

### API Integration

**External API Endpoint:**
- Base URL: `https://thinkful-list-api.herokuapp.com/Jeff/bookmarks`
- RESTful operations: GET (all), POST (create), DELETE (by ID)
- JSON content type for all requests
- Error handling through jQuery AJAX error callbacks

**API Methods:**
- `getBookmarks()` - Fetches all user bookmarks
- `createBookmark()` - Adds new bookmark with validation
- `deleteBookmark()` - Removes bookmark by ID

### UI/UX Features

**Responsive Design:**
- CSS Grid system for layout structure
- Mobile-first responsive design approach
- Semantic HTML with proper ARIA attributes
- Custom CSS for visual styling and interactions

**User Interactions:**
- Add bookmark form with validation
- Expandable bookmark detail views
- Rating system (1-5 stars) with visual feedback
- Filter bookmarks by minimum rating
- Delete confirmation through UI interaction

**Accessibility Features:**
- Semantic HTML structure with proper roles
- ARIA live regions for dynamic content updates
- Keyboard navigation support
- Screen reader friendly form labels and descriptions

## Key Technologies

- **jQuery 3.3.1** - DOM manipulation and AJAX requests
- **Vanilla JavaScript (ES6+)** - Core application logic
- **CSS Grid** - Responsive layout system
- **HTML5** - Semantic markup and form validation
- **RESTful API** - External data persistence
- **GitHub Pages** - Static site hosting

## Development Patterns

### Module Pattern
Each JavaScript file implements the module pattern using IIFEs:
```javascript
const moduleName = (function() {
  // Private variables and functions
  
  const publicMethod = function() {
    // Implementation
  };
  
  return {
    publicMethod
  };
}());
```

### Event Delegation
Centralized event handling using jQuery event delegation:
- Events bound to parent containers handle dynamically created content
- Single event listener manages multiple UI elements
- Prevents memory leaks from repeated event binding

### Template-Based Rendering
HTML generation using ES6 template literals:
- Dynamic content insertion with variable interpolation
- Conditional rendering based on application state
- Separation of markup templates from logic

## User Stories Implementation

**Bookmark Management:**
- Create bookmarks with title, URL, description, and rating
- View bookmarks in condensed (title/rating) and detailed views
- Delete bookmarks with immediate UI feedback
- Filter bookmarks by minimum rating (1-5 stars)

**Form Handling:**
- Client-side form validation with error display
- JSON serialization for API payload preparation
- Form reset and state management
- Error messaging with dismissible notifications

**State Persistence:**
- Integration with external API for data persistence
- Local state management for UI interactions
- Optimistic UI updates with error rollback

## Error Handling

**API Error Management:**
- jQuery AJAX error callbacks for network failures
- Server validation error display in UI
- User-friendly error messages with dismissal options
- State rollback on failed operations

**Form Validation:**
- Required field validation
- URL format validation through browser constraints
- Rating selection validation
- Real-time error feedback

## Performance Considerations

**Efficient Rendering:**
- Complete re-renders triggered only by state changes
- Minimal DOM manipulation through template replacement
- Event delegation reduces event listener overhead

**Network Optimization:**
- RESTful API design minimizes unnecessary requests
- JSON payload optimization for bookmark data
- CDN delivery for jQuery library

## Browser Support

- Modern browsers with ES6+ support
- jQuery compatibility for older browser support
- Graceful degradation for accessibility features
- Progressive enhancement for advanced interactions

## File Structure
```
├── index.html                  # Main HTML document
├── scripts/
│   ├── index.js               # Application initialization
│   ├── store.js               # Client-side state management
│   ├── api.js                 # External API integration
│   ├── bookmarks.js           # Main UI component and rendering
│   └── jSonExtension.js       # jQuery utility extensions
├── styles/
│   ├── main.css               # Core application styles
│   └── grid.css               # CSS Grid layout system
├── README.md                   # Project documentation
└── _config.yml                # GitHub Pages configuration
```

## Development Notes

**Code Quality:**
- ESLint configuration for code consistency
- Namespace-based organization prevents global conflicts
- Modular architecture enables easy testing and maintenance

**Accessibility:**
- ARIA labels and roles for screen reader support
- Semantic HTML structure
- Keyboard navigation patterns
- Color contrast and visual design considerations

**Educational Context:**
- Demonstrates fundamental web development concepts
- Progressive enhancement from basic HTML/CSS to dynamic JavaScript
- RESTful API consumption patterns
- Client-side state management without frameworks

## Future Enhancements

- **Edit Functionality** - Allow updating bookmark details
- **Local Storage** - Offline capability and faster loading
- **Advanced Filtering** - Multiple filter criteria and search
- **Drag and Drop** - Reordering bookmarks
- **Import/Export** - Bookmark data portability
- **User Authentication** - Personal bookmark collections
- **Progressive Web App** - Offline support and mobile app experience