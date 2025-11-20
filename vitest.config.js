import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Enable global test APIs (describe, it, expect, etc.)
    globals: true,

    // Use happy-dom for fast DOM simulation
    environment: 'happy-dom',

    // Setup files to run before tests
    setupFiles: ['./tests/setup.js'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['scripts/**/*.js'],
      exclude: [
        'scripts/firebase-config.js', // Contains credentials
        'node_modules/**',
        'dist/**',
        'tests/**'
      ]
    },

    // Test file patterns
    include: ['tests/**/*.test.js'],

    // Watch mode options
    watchExclude: ['**/node_modules/**', '**/dist/**']
  }
});
