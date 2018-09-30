'use strict';

const store = (function() {

  const addBookmark = function(bookmark) {
    this.bookmarks.push(bookmark);
  };

  const findAndDelete = function(id) {
    this.bookmarks = this.bookmarks.filter(bookmark => bookmark.id !== id);
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

  return {
    bookmarks: [],
    adding: true,
    filter: 0,
    error: null,

    addBookmark,
    findAndDelete,
    toggleBookmarkExpanded,
    toggleAdding,
    setFilter,
    setError
  };
}());
