'use strict';

$(function() {
  bookmarkList.bindEventListeners();
  bookmarkList.render();

  store.loadFromLocalStorage();
  if (store.bookmarks.length > 0) {
    bookmarkList.render();
  }

  if (store.darkMode) {
    document.body.classList.add('dark-mode');
  }

  // Keyboard shortcuts
  $(document).on('keydown', function(event) {
    // Only handle shortcuts when not typing in input fields
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      return;
    }

    // Ctrl/Cmd + N: Add new bookmark
    if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
      event.preventDefault();
      if (!store.adding) {
        store.toggleAdding();
        bookmarkList.render();
        setTimeout(() => $('#new-title').focus(), 100);
      }
    }

    // Ctrl/Cmd + D: Toggle dark mode
    if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
      event.preventDefault();
      store.toggleDarkMode();
      $('.js-theme-toggle').text(store.darkMode ? '☀️' : '🌙');
    }

    // Ctrl/Cmd + E: Export bookmarks
    if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
      event.preventDefault();
      $('.js-export-bookmarks').click();
    }

    // Ctrl/Cmd + B: Toggle bulk mode
    if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
      event.preventDefault();
      store.toggleBulkMode();
      bookmarkList.render();
    }

    // Escape: Cancel current action
    if (event.key === 'Escape') {
      if (store.adding) {
        store.toggleAdding();
        bookmarkList.render();
      }
      if (store.editingId) {
        store.setEditingId(null);
        bookmarkList.render();
      }
      if (store.bulkMode) {
        store.toggleBulkMode();
        bookmarkList.render();
      }
    }

    // F: Focus search
    if (event.key === 'f' && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      $('#search-bookmarks').focus();
    }
  });

  api.getBookmarks((bookmarks) => {
    store.bookmarks = [];
    bookmarks.forEach((bookmark) => store.addBookmark(bookmark));
    bookmarkList.render();
  });
});
