'use strict';

const store = (function() {

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
