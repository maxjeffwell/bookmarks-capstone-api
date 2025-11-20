/**
 * Test setup file
 * Runs before all tests to set up global mocks and utilities
 */

import { vi } from 'vitest';

// Mock jQuery globally since our code uses it
global.$ = vi.fn(() => ({
  on: vi.fn(),
  off: vi.fn(),
  trigger: vi.fn(),
  val: vi.fn(),
  text: vi.fn(),
  html: vi.fn(),
  addClass: vi.fn(),
  removeClass: vi.fn(),
  toggleClass: vi.fn(),
  attr: vi.fn(),
  prop: vi.fn(),
  find: vi.fn(),
  append: vi.fn(),
  remove: vi.fn()
}));

// Mock jQuery static methods
global.$.ajax = vi.fn();
global.$.serializeJSON = vi.fn();

// Mock Firebase global if needed
global.firebase = {
  firestore: {
    FieldValue: {
      serverTimestamp: vi.fn(() => new Date())
    }
  }
};

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});
