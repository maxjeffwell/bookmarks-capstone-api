module.exports = {
  // Build output directory
  outputDir: 'dist',
  
  // Files to minify
  scripts: {
    src: 'scripts/*.js',
    dest: 'scripts'
  },
  
  styles: {
    src: 'styles/*.css',
    dest: 'styles'
  },
  
  // Static files to copy
  static: [
    'README.md',
    'LICENSE',
    '_config.yml',
    'FIREBASE_SETUP.md',
    'FIREBASE_AUTH_SETUP.md',
    'ADBLOCKER_HELP.md',
    'firestore.rules'
  ],
  
  // HTML files to process
  html: [
    'index.html',
    'debug.html',
    'test-firebase.html'
  ],
  
  // Minification options
  terserOptions: {
    compress: {
      drop_console: false, // Keep console logs for debugging
      drop_debugger: true,
      pure_funcs: ['console.debug']
    },
    mangle: true,
    output: {
      comments: false
    }
  },
  
  cleanCssOptions: {
    level: 2 // Advanced optimizations
  },
  
  // Environment-specific builds
  environments: {
    development: {
      minify: false,
      sourceMaps: true
    },
    production: {
      minify: true,
      sourceMaps: false
    }
  }
};