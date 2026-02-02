# Testing Documentation

This project uses [Vitest](https://vitest.dev/) with React Testing Library for comprehensive test coverage.

## Test Structure

```
tests/
├── setup.js               # Global test setup and mocks
├── App.test.jsx           # App component integration tests
├── AuthContext.test.jsx   # Authentication context/hook tests
├── ErrorBoundary.test.jsx # Error boundary component tests
└── README.md              # This file
```

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with UI (browser-based test viewer)
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Test Coverage

### ErrorBoundary (9 tests) - 100% coverage
Tests for graceful error handling:
- Renders children when no error
- Shows fallback UI on error
- Try Again and Reload Page buttons
- Error state reset on retry
- onError callback invocation
- Custom fallback rendering
- Technical details visibility

### AuthContext (11 tests) - 75% coverage
Tests for authentication state management:
- Provider renders children
- Loading state handling
- User state after auth check
- signIn/signUp/signOut functions
- Google sign-in
- Password reset
- Error handling and clearing

### App (4 tests) - 100% coverage
Integration tests for main app:
- Renders without crashing
- Shows loading state initially
- Shows auth page for unauthenticated users
- Error boundary integration

## Configuration

### vitest.config.js
- **Environment**: happy-dom (fast DOM simulation)
- **Globals**: Enabled (describe, it, expect available globally)
- **Coverage**: v8 provider with HTML/JSON/text reports
- **Setup Files**: Runs `tests/setup.js` before tests
- **React Plugin**: @vitejs/plugin-react for JSX support

### tests/setup.js
Global mocks for:
- React Testing Library cleanup
- @testing-library/jest-dom matchers
- window.matchMedia
- IntersectionObserver
- ResizeObserver

## Writing New Tests

### Component Test Example

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyComponent from '../src/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Testing with Firebase Mocks

Firebase is mocked in test files. Example pattern:

```jsx
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((auth, callback) => {
    callback({ email: 'test@example.com' });
    return vi.fn(); // unsubscribe
  }),
  signInWithEmailAndPassword: vi.fn(),
  // ... other auth functions
}));

vi.mock('../src/services/firebase', () => ({
  auth: {},
  googleProvider: {},
}));
```

### Best Practices

1. **Descriptive Test Names**: Use "should [action]" or describe what it does
2. **Arrange-Act-Assert**: Structure tests clearly
3. **Isolated Tests**: Each test should be independent
4. **Mock External Dependencies**: Don't rely on real Firebase/APIs
5. **Test Edge Cases**: Include error scenarios and boundary conditions

## Coverage Reports

After running `npm run test:coverage`, view the HTML report:
```bash
open coverage/index.html
```

**Current Coverage:**
| File | Statements | Branches | Functions | Lines |
|------|------------|----------|-----------|-------|
| App.jsx | 100% | 100% | 100% | 100% |
| ErrorBoundary.jsx | 100% | 100% | 100% | 100% |
| MainApp.jsx | 100% | 75% | 100% | 100% |
| AuthContext.jsx | 75% | 75% | 90% | 75% |

**Excluded from Coverage:**
- `src/main.jsx` (entry point)
- `src/services/firebase.js` (credentials)
- `src/services/algolia.js` (credentials)

## Future Test Additions

Components needing test coverage:
- [ ] `BookmarkCard.jsx` - Bookmark display and interactions
- [ ] `BookmarksPage.jsx` - Main bookmark list and CRUD
- [ ] `EditBookmarkModal.jsx` - Edit form validation
- [ ] `ImportExportModal.jsx` - Import/export functionality
- [ ] `AlgoliaSearch.jsx` - Search integration
- [ ] `CollectionsPage.jsx` - Tag-based collections
- [ ] `SmartCollectionsPage.jsx` - AI-powered groupings

## Troubleshooting

### Tests Failing Locally
1. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
2. Clear Vitest cache: `npx vitest --clearCache`
3. Check Node version: Vitest requires Node 18+

### Async Test Issues
Always await promises in tests:
```javascript
it('should handle async', async () => {
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  });
});
```

### Mock Not Working
Ensure mocks are cleared between tests:
```javascript
beforeEach(() => {
  vi.clearAllMocks();
});
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
