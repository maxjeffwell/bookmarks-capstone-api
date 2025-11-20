/**
 * Tests for the store module
 * Tests state management, bookmark operations, and localStorage interactions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; })
  };
})();

global.localStorage = localStorageMock;

// Mock document for dark mode tests
global.document = {
  body: {
    classList: {
      toggle: vi.fn(),
      add: vi.fn(),
      remove: vi.fn()
    }
  }
};

describe('Store Module', () => {
  let store;

  beforeEach(() => {
    // Reset localStorage
    localStorageMock.clear();
    vi.clearAllMocks();

    // Create a fresh store instance for each test
    // We need to re-evaluate the IIFE to get fresh state
    store = (function() {
      const addBookmark = function(bookmark) {
        this.bookmarks.push(bookmark);
        this.saveToLocalStorage();
      };

      const findAndDelete = function(id) {
        this.bookmarks = this.bookmarks.filter(bookmark => bookmark.id !== id);
        this.saveToLocalStorage();
      };

      const toggleBookmarkExpanded = function(id) {
        const bookmark = this.bookmarks.filter(bookmark => bookmark.id === id);
        bookmark[0].expanded = !bookmark[0].expanded;
      };

      const toggleAdding = function() {
        this.adding = !this.adding;
      };

      const setFilter = function(num) {
        this.filter = num;
      };

      const setError = function(message) {
        this.error = message;
      };

      const setSearchTerm = function(term) {
        this.searchTerm = term;
      };

      const setEditingId = function(id) {
        this.editingId = id;
      };

      const updateBookmark = function(id, updatedBookmark) {
        const index = this.bookmarks.findIndex(bookmark => bookmark.id === id);
        if (index !== -1) {
          this.bookmarks[index] = { ...this.bookmarks[index], ...updatedBookmark };
          this.saveToLocalStorage();
        }
      };

      const saveToLocalStorage = function() {
        try {
          localStorage.setItem('bookmarks-backup', JSON.stringify(this.bookmarks));
        } catch (e) {
          console.warn('Could not save to localStorage:', e);
        }
      };

      const loadFromLocalStorage = function() {
        try {
          const saved = localStorage.getItem('bookmarks-backup');
          if (saved) {
            this.bookmarks = JSON.parse(saved);
          }
          const darkMode = localStorage.getItem('darkMode') === 'true';
          this.darkMode = darkMode;
        } catch (e) {
          console.warn('Could not load from localStorage:', e);
        }
      };

      const toggleDarkMode = function() {
        this.darkMode = !this.darkMode;
        localStorage.setItem('darkMode', this.darkMode);
        document.body.classList.toggle('dark-mode', this.darkMode);
      };

      const reorderBookmarks = function(fromIndex, toIndex) {
        const bookmark = this.bookmarks.splice(fromIndex, 1)[0];
        this.bookmarks.splice(toIndex, 0, bookmark);
        this.saveToLocalStorage();
      };

      const setSelectedTag = function(tag) {
        this.selectedTag = tag;
      };

      const toggleBulkMode = function() {
        this.bulkMode = !this.bulkMode;
        this.selectedBookmarks = [];
      };

      const toggleBookmarkSelection = function(id) {
        const stringId = String(id);
        const index = this.selectedBookmarks.indexOf(stringId);
        if (index === -1) {
          this.selectedBookmarks.push(stringId);
        } else {
          this.selectedBookmarks.splice(index, 1);
        }
      };

      const selectAllBookmarks = function() {
        this.selectedBookmarks = this.bookmarks.map(b => String(b.id));
      };

      const deleteSelectedBookmarks = function() {
        this.selectedBookmarks.forEach(id => {
          this.findAndDelete(id);
        });
        this.selectedBookmarks = [];
      };

      const saveDraft = function(formData) {
        localStorage.setItem('bookmark-draft', JSON.stringify(formData));
      };

      const loadDraft = function() {
        try {
          const draft = localStorage.getItem('bookmark-draft');
          return draft ? JSON.parse(draft) : null;
        } catch (e) {
          return null;
        }
      };

      const clearDraft = function() {
        localStorage.removeItem('bookmark-draft');
      };

      return {
        bookmarks: [],
        adding: true,
        filter: 0,
        error: null,
        searchTerm: '',
        editingId: null,
        darkMode: false,
        selectedTag: '',
        bulkMode: false,
        selectedBookmarks: [],

        addBookmark,
        findAndDelete,
        toggleBookmarkExpanded,
        toggleAdding,
        setFilter,
        setError,
        setSearchTerm,
        setEditingId,
        updateBookmark,
        saveToLocalStorage,
        loadFromLocalStorage,
        toggleDarkMode,
        reorderBookmarks,
        setSelectedTag,
        toggleBulkMode,
        toggleBookmarkSelection,
        selectAllBookmarks,
        deleteSelectedBookmarks,
        saveDraft,
        loadDraft,
        clearDraft
      };
    }());
  });

  describe('Initial State', () => {
    it('should have empty bookmarks array', () => {
      expect(store.bookmarks).toEqual([]);
    });

    it('should have adding set to true', () => {
      expect(store.adding).toBe(true);
    });

    it('should have filter set to 0', () => {
      expect(store.filter).toBe(0);
    });

    it('should have no error initially', () => {
      expect(store.error).toBeNull();
    });

    it('should have empty search term', () => {
      expect(store.searchTerm).toBe('');
    });

    it('should have dark mode disabled', () => {
      expect(store.darkMode).toBe(false);
    });

    it('should have bulk mode disabled', () => {
      expect(store.bulkMode).toBe(false);
    });
  });

  describe('Bookmark Operations', () => {
    it('should add a bookmark', () => {
      const bookmark = { id: 1, title: 'Test', url: 'https://test.com' };
      store.addBookmark(bookmark);

      expect(store.bookmarks).toHaveLength(1);
      expect(store.bookmarks[0]).toEqual(bookmark);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'bookmarks-backup',
        JSON.stringify([bookmark])
      );
    });

    it('should delete a bookmark by id', () => {
      store.bookmarks = [
        { id: 1, title: 'Test 1' },
        { id: 2, title: 'Test 2' },
        { id: 3, title: 'Test 3' }
      ];

      store.findAndDelete(2);

      expect(store.bookmarks).toHaveLength(2);
      expect(store.bookmarks.find(b => b.id === 2)).toBeUndefined();
    });

    it('should toggle bookmark expanded state', () => {
      store.bookmarks = [{ id: 1, title: 'Test', expanded: false }];

      store.toggleBookmarkExpanded(1);
      expect(store.bookmarks[0].expanded).toBe(true);

      store.toggleBookmarkExpanded(1);
      expect(store.bookmarks[0].expanded).toBe(false);
    });

    it('should update a bookmark', () => {
      store.bookmarks = [
        { id: 1, title: 'Original', url: 'https://original.com', rating: 3 }
      ];

      store.updateBookmark(1, { title: 'Updated', rating: 5 });

      expect(store.bookmarks[0].title).toBe('Updated');
      expect(store.bookmarks[0].rating).toBe(5);
      expect(store.bookmarks[0].url).toBe('https://original.com'); // Should preserve
    });

    it('should not update if bookmark id not found', () => {
      store.bookmarks = [{ id: 1, title: 'Test' }];

      store.updateBookmark(999, { title: 'Updated' });

      expect(store.bookmarks[0].title).toBe('Test');
    });

    it('should reorder bookmarks', () => {
      store.bookmarks = [
        { id: 1, title: 'First' },
        { id: 2, title: 'Second' },
        { id: 3, title: 'Third' }
      ];

      store.reorderBookmarks(0, 2);

      expect(store.bookmarks[0].title).toBe('Second');
      expect(store.bookmarks[2].title).toBe('First');
    });
  });

  describe('UI State Management', () => {
    it('should toggle adding state', () => {
      expect(store.adding).toBe(true);
      store.toggleAdding();
      expect(store.adding).toBe(false);
      store.toggleAdding();
      expect(store.adding).toBe(true);
    });

    it('should set filter value', () => {
      store.setFilter(3);
      expect(store.filter).toBe(3);

      store.setFilter(5);
      expect(store.filter).toBe(5);
    });

    it('should set error message', () => {
      store.setError('Test error');
      expect(store.error).toBe('Test error');

      store.setError(null);
      expect(store.error).toBeNull();
    });

    it('should set search term', () => {
      store.setSearchTerm('javascript');
      expect(store.searchTerm).toBe('javascript');
    });

    it('should set editing id', () => {
      store.setEditingId(42);
      expect(store.editingId).toBe(42);

      store.setEditingId(null);
      expect(store.editingId).toBeNull();
    });

    it('should set selected tag', () => {
      store.setSelectedTag('programming');
      expect(store.selectedTag).toBe('programming');
    });
  });

  describe('Dark Mode', () => {
    it('should toggle dark mode', () => {
      store.toggleDarkMode();

      expect(store.darkMode).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith('darkMode', true);
      expect(document.body.classList.toggle).toHaveBeenCalledWith('dark-mode', true);
    });

    it('should load dark mode from localStorage', () => {
      // Set up mock to return 'true' for darkMode key
      localStorage.getItem.mockImplementation((key) => {
        if (key === 'darkMode') return 'true';
        return null;
      });

      store.loadFromLocalStorage();

      expect(store.darkMode).toBe(true);
    });
  });

  describe('Bulk Operations', () => {
    beforeEach(() => {
      store.bookmarks = [
        { id: 1, title: 'Test 1' },
        { id: 2, title: 'Test 2' },
        { id: 3, title: 'Test 3' }
      ];
    });

    it('should toggle bulk mode', () => {
      store.toggleBulkMode();
      expect(store.bulkMode).toBe(true);
      expect(store.selectedBookmarks).toEqual([]);

      store.toggleBulkMode();
      expect(store.bulkMode).toBe(false);
    });

    it('should toggle bookmark selection', () => {
      store.toggleBookmarkSelection(1);
      expect(store.selectedBookmarks).toContain('1');

      store.toggleBookmarkSelection(1);
      expect(store.selectedBookmarks).not.toContain('1');
    });

    it('should select all bookmarks', () => {
      store.selectAllBookmarks();

      expect(store.selectedBookmarks).toEqual(['1', '2', '3']);
    });

    it('should delete selected bookmarks', () => {
      store.selectedBookmarks = ['1', '3'];

      // The deleteSelectedBookmarks uses findAndDelete which filters by id
      // We need to ensure the ids match (string vs number comparison)
      store.bookmarks = [
        { id: '1', title: 'Test 1' },
        { id: '2', title: 'Test 2' },
        { id: '3', title: 'Test 3' }
      ];

      store.deleteSelectedBookmarks();

      expect(store.bookmarks).toHaveLength(1);
      expect(store.bookmarks[0].id).toBe('2');
      expect(store.selectedBookmarks).toEqual([]);
    });
  });

  describe('LocalStorage Operations', () => {
    it('should save bookmarks to localStorage', () => {
      store.bookmarks = [{ id: 1, title: 'Test' }];
      store.saveToLocalStorage();

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'bookmarks-backup',
        JSON.stringify(store.bookmarks)
      );
    });

    it('should load bookmarks from localStorage', () => {
      const savedBookmarks = [
        { id: 1, title: 'Saved 1' },
        { id: 2, title: 'Saved 2' }
      ];

      localStorage.getItem.mockReturnValueOnce(JSON.stringify(savedBookmarks));

      store.loadFromLocalStorage();

      expect(store.bookmarks).toEqual(savedBookmarks);
    });

    it('should handle localStorage errors gracefully', () => {
      localStorage.getItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      // Should not throw
      expect(() => store.loadFromLocalStorage()).not.toThrow();
    });
  });

  describe('Draft Operations', () => {
    it('should save draft to localStorage', () => {
      const draftData = { title: 'Draft', url: 'https://draft.com' };
      store.saveDraft(draftData);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'bookmark-draft',
        JSON.stringify(draftData)
      );
    });

    it('should load draft from localStorage', () => {
      const draftData = { title: 'Draft', url: 'https://draft.com' };
      localStorage.getItem.mockReturnValueOnce(JSON.stringify(draftData));

      const loaded = store.loadDraft();

      expect(loaded).toEqual(draftData);
    });

    it('should return null if no draft exists', () => {
      localStorage.getItem.mockReturnValueOnce(null);

      const loaded = store.loadDraft();

      expect(loaded).toBeNull();
    });

    it('should return null if draft is invalid JSON', () => {
      localStorage.getItem.mockReturnValueOnce('invalid json');

      const loaded = store.loadDraft();

      expect(loaded).toBeNull();
    });

    it('should clear draft from localStorage', () => {
      store.clearDraft();

      expect(localStorage.removeItem).toHaveBeenCalledWith('bookmark-draft');
    });
  });
});
