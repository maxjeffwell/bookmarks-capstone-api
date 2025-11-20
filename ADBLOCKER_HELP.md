# Firebase Blocked by Ad Blocker - Solutions

The error `ERR_BLOCKED_BY_CLIENT` means your browser extension (like an ad blocker) is blocking Firebase connections.

## Quick Solutions

### Option 1: Disable Ad Blocker for This Site (Recommended)
1. Click your ad blocker icon in the browser toolbar
2. Select "Disable on this site" or "Pause on this site"
3. Refresh the page

### Option 2: Whitelist Firebase Domains
Add these domains to your ad blocker's whitelist:
- `firestore.googleapis.com`
- `*.firebaseio.com`
- `firebaseapp.com`
- `*.googleapis.com`

### Option 3: Try a Different Browser
Some browsers have built-in tracking protection that's less aggressive:
1. Try the app in Chrome, Firefox, or Safari
2. Each browser handles Firebase connections differently

## Common Ad Blockers Settings

### uBlock Origin
1. Click the uBlock icon
2. Click the power button to disable for this site
3. Or go to Settings → My filters → Add:
   ```
   @@||firestore.googleapis.com^
   @@||firebaseio.com^
   @@||firebaseapp.com^
   ```

### AdBlock Plus
1. Click AdBlock icon → "Don't run on this page"
2. Or go to Options → Whitelisted websites → Add domain

### Brave Browser
1. Click the Brave Shields icon
2. Toggle "Shields" to OFF for this site
3. Or lower shields to "Allow all trackers & ads"

### Privacy Badger
1. Click Privacy Badger icon
2. Find `googleapis.com` and `firebaseio.com`
3. Move sliders to green (allow)

## Alternative: Use Incognito/Private Mode
Most extensions are disabled in incognito mode by default:
- Chrome: Ctrl+Shift+N (Windows) or Cmd+Shift+N (Mac)
- Firefox: Ctrl+Shift+P (Windows) or Cmd+Shift+P (Mac)
- Safari: Cmd+Shift+N

## Why This Happens
Firebase uses various tracking and analytics endpoints that ad blockers classify as trackers. While Firebase itself isn't serving ads, the connection patterns look similar to ad networks, causing false positives.

## Still Having Issues?
1. Check browser console for specific blocked URLs
2. Temporarily disable all extensions to test
3. Try a different browser
4. Contact your app administrator for support