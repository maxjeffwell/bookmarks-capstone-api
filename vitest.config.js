import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
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
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/main.jsx', // Entry point
        'src/services/firebase.js', // Contains credentials
        'src/services/algolia.js', // Contains credentials
        'node_modules/**',
        'dist/**',
        'tests/**'
      ]
    },

    // Test file patterns
    include: ['tests/**/*.test.{js,jsx}'],

    // Watch mode options
    watchExclude: ['**/node_modules/**', '**/dist/**']
  }
});
