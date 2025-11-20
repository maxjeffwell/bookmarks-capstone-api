# Testing Documentation

This project uses [Vitest](https://vitest.dev/) as the testing framework with comprehensive test coverage for the application's core modules.

## Test Structure

```
tests/
├── setup.js          # Global test setup and mocks
├── store.test.js     # Store module tests (33 tests)
├── api.test.js       # API module tests (17 tests)
└── README.md         # This file
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

### Store Module (33 tests)
Tests for client-side state management:
- **Initial State** (7 tests) - Verifies default state values
- **Bookmark Operations** (6 tests) - Add, delete, update, reorder bookmarks
- **UI State Management** (6 tests) - Filters, search, error handling
- **Dark Mode** (2 tests) - Theme toggle and persistence
- **Bulk Operations** (4 tests) - Multi-select, bulk delete
- **LocalStorage Operations** (3 tests) - Persistence and error handling
- **Draft Operations** (5 tests) - Form draft save/load/clear

### API Module (17 tests)
Tests for Firebase integration:
- **getBookmarks** (3 tests) - Fetch bookmarks, error handling, fallback
- **createBookmark** (4 tests) - Create with object/JSON, validation, errors
- **deleteBookmark** (3 tests) - Delete success, error handling, fallback
- **updateBookmark** (4 tests) - Update with object/JSON, validation, errors
- **listenToBookmarks** (3 tests) - Real-time sync, fallback, error handling

## Configuration

### vitest.config.js
- **Environment**: happy-dom (fast DOM simulation)
- **Globals**: Enabled (describe, it, expect available globally)
- **Coverage**: v8 provider with HTML/JSON/text reports
- **Setup Files**: Runs `tests/setup.js` before tests

### tests/setup.js
Global mocks for:
- jQuery ($) - Mocked with common methods
- Firebase - Mocked firestore methods
- localStorage - Mocked storage API
- document.body - Mocked for DOM operations

## Writing New Tests

### Example Test Structure

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Module Name', () => {
  beforeEach(() => {
    // Setup before each test
    vi.clearAllMocks();
  });

  describe('Feature Group', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = myFunction(input);

      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Best Practices

1. **Descriptive Test Names**: Use "should [action]" format
2. **Arrange-Act-Assert**: Structure tests clearly
3. **Isolated Tests**: Each test should be independent
4. **Mock External Dependencies**: Don't rely on real Firebase/APIs
5. **Test Edge Cases**: Include error scenarios and edge cases

## Mocking

### Mocking Functions
```javascript
const mockFn = vi.fn();
mockFn.mockReturnValue('test');
mockFn.mockResolvedValue(Promise.resolve('async test'));
mockFn.mockRejectedValue(new Error('error'));
```

### Mocking Modules
```javascript
vi.mock('./module', () => ({
  default: vi.fn(),
  namedExport: vi.fn()
}));
```

## Coverage Reports

After running `npm run test:coverage`, view the HTML report:
```bash
open coverage/index.html
```

**Current Coverage:**
- Lines: Target 80%+
- Branches: Target 75%+
- Functions: Target 80%+
- Statements: Target 80%+

**Excluded from Coverage:**
- `scripts/firebase-config.js` (contains credentials)
- `node_modules/`
- `dist/`
- `tests/`

## Continuous Integration

Tests should be run:
- Before every commit (pre-commit hook)
- On every pull request (CI pipeline)
- Before deployment (pre-deploy script)

### Adding Pre-commit Hook

```bash
# Install husky
npm install --save-dev husky

# Add pre-commit hook
npx husky install
npx husky add .git/hooks/pre-commit "npm test"
```

## Troubleshooting

### Tests Failing Locally
1. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
2. Clear Vitest cache: `npx vitest --clearCache`
3. Check Node version: Vitest requires Node 18+

### Async Test Issues
Always await promises in tests:
```javascript
it('should handle async', async () => {
  await someAsyncFunction();
  // Assertions
});
```

### Mock Not Working
Ensure mocks are cleared between tests:
```javascript
beforeEach(() => {
  vi.clearAllMocks();
});
```

## Future Test Additions

Areas that need test coverage:
- [ ] `scripts/bookmarks.js` - UI rendering logic
- [ ] `scripts/auth.js` - Authentication flows
- [ ] `scripts/security.js` - XSS/injection prevention
- [ ] `scripts/analytics.js` - Event tracking
- [ ] Integration tests for full workflows
- [ ] E2E tests with Playwright/Cypress

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://testingjavascript.com/)
- [JavaScript Testing Guide](https://github.com/goldbergyoni/javascript-testing-best-practices)
