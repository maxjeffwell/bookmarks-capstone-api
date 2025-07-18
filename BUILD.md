# Build Process Documentation

## Overview
This project uses a custom Node.js build script to prepare files for production deployment.

## Build Features
- ✅ JavaScript minification using Terser
- ✅ CSS minification using clean-css
- ✅ Static file copying
- ✅ Deployment information generation
- ✅ GitHub Pages deployment support

## Available Scripts

### `npm run build`
Creates a production-ready build in the `dist` folder.

```bash
npm run build
```

Output:
- Minified JavaScript files in `dist/scripts/`
- Minified CSS files in `dist/styles/`
- Copied HTML and static files
- Build information in `dist/build-info.json`

### `npm run clean`
Removes the `dist` folder.

```bash
npm run clean
```

### `npm run serve`
Starts a local development server (no build required).

```bash
npm run serve
# Opens at http://localhost:8080
```

### `npm run serve:dist`
Serves the built files from the `dist` folder.

```bash
npm run serve:dist
# Opens at http://localhost:8080
```

### `npm run deploy`
Builds and deploys to GitHub Pages.

```bash
npm run deploy
```

## Build Configuration

The build process can be customized by editing `build.config.js`:

```javascript
module.exports = {
  outputDir: 'dist',
  scripts: { src: 'scripts/*.js', dest: 'scripts' },
  styles: { src: 'styles/*.css', dest: 'styles' },
  // ... more options
};
```

## Build Output Structure

```
dist/
├── scripts/           # Minified JavaScript
│   ├── api.js
│   ├── auth.js
│   ├── bookmarks.js
│   └── ...
├── styles/           # Minified CSS
│   ├── main.css
│   ├── modern.css
│   └── ...
├── index.html        # Main application
├── build-info.json   # Build metadata
└── DEPLOYMENT.md     # Deployment instructions
```

## Deployment

### GitHub Pages

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy to GitHub Pages:
   ```bash
   npm run deploy
   ```

3. Access your site at:
   ```
   https://[username].github.io/bookmarks-capstone-api/
   ```

### Manual Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Upload the contents of the `dist` folder to your web server

3. Configure your server to serve static files

## Development Workflow

1. **Development**: Use `npm run serve` to run locally
2. **Testing**: Make changes and refresh browser
3. **Building**: Run `npm run build` to create production files
4. **Verification**: Use `npm run serve:dist` to test the build
5. **Deployment**: Run `npm run deploy` for GitHub Pages

## Troubleshooting

### Build Failures
- Ensure all dependencies are installed: `npm install`
- Check for syntax errors in JavaScript files
- Verify file permissions

### Minification Issues
- Some complex JavaScript might not minify correctly
- The build will fall back to copying unminified files
- Check console output for specific errors

### Deployment Issues
- Ensure you have push access to the repository
- Check that the `gh-pages` branch exists
- Verify GitHub Pages is enabled in repository settings

## Future Enhancements

- [ ] Source maps for debugging
- [ ] Image optimization
- [ ] Bundle splitting
- [ ] Cache busting with file hashing
- [ ] Environment-specific builds
- [ ] Automated testing before build