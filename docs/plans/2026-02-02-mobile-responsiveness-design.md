# Mobile Responsiveness Design

**Date:** 2026-02-02
**Status:** Approved

## Overview

Improve mobile responsiveness across FireBook with four key changes:
1. Mobile hamburger menu for control bar
2. Action menu dropdown for BookmarkCard
3. Full-screen modals on mobile
4. Touch-friendly target sizing (44px minimum)

## Design Decisions

### 1. Mobile Navigation (Hamburger Menu)

**Desktop (md and up):**
- Full button row: Add Bookmark, Search, Collections, Import/Export, Smart Collections
- View toggle (Grid/Gallery) on the right

**Mobile (below md):**
- "Add Bookmark" button stays visible (primary action)
- Hamburger menu (☰) contains: Search, Collections, Import/Export, Smart Collections
- View toggle remains visible
- Menu is dropdown style, closes on outside click or selection

**Files:** `BookmarksPage.jsx`

### 2. BookmarkCard Action Menu

**Desktop (md and up):**
- Current layout preserved: Visit Site, Edit, Delete all visible

**Mobile (below md):**
- "Visit Site" always visible (primary action)
- Three-dot menu (⋮) contains: Edit, Delete
- AI action buttons (Generate Embedding / Find Similar) stay visible

**Files:** `BookmarkCard.jsx`

### 3. Full-Screen Modals on Mobile

**Pattern:**
```jsx
// Overlay
className="fixed inset-0 bg-black/50 flex items-center justify-center p-0 sm:p-4 z-50"

// Modal container
className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-2xl"
```

**Files:**
- `AlgoliaSearch.jsx`
- `EditBookmarkModal.jsx`
- `CollectionsPage.jsx`
- `SmartCollectionsPage.jsx`
- `ImportExportModal.jsx`
- Similar results modal in `BookmarksPage.jsx`

### 4. Touch Target Sizing

| Element | Current | New |
|---------|---------|-----|
| Primary buttons (.btn-firebase) | px-4 py-2 | px-4 py-3 |
| Secondary buttons (.btn-secondary) | px-3 py-1.5 | px-3 py-2.5 |
| Tag buttons | px-2 py-1 | px-3 py-2 |
| Close (×) buttons | text only | p-2 wrapper |

**Files:**
- `index.css` (global styles)
- `BookmarkCard.jsx` (tag buttons)
- All modal components (close buttons)

## Implementation Order

1. Touch targets (CSS foundation)
2. Responsive modals (6 components)
3. Hamburger menu (BookmarksPage)
4. Card action menu (BookmarkCard)

## Testing

- Chrome DevTools: iPhone SE (375px), iPhone 12 (390px), Pixel 5
- Breakpoints: 375px, 390px, 640px (sm), 768px (md)
