'use strict';

const api = (function() {
  // Simplified API module - Firebase only
  // Real-time sync is the primary method; getBookmarks is for fallback scenarios

  const getBookmarks = function(onSuccess) {
    if (typeof firebaseApi === 'undefined') {
      console.error('Firebase API not loaded');
      onSuccess([]);
      return;
    }

    firebaseApi.getBookmarks()
      .then(bookmarks => onSuccess(bookmarks))
      .catch(error => {
        console.error('Firebase error:', error);
        onSuccess([]); // Return empty array on error to maintain app stability
      });
  };

  const createBookmark = function(newBookmark, onSuccess, onError) {
    if (typeof firebaseApi === 'undefined') {
      console.error('Firebase API not loaded');
      if (onError) onError({ responseJSON: { message: 'Database not available' } });
      return;
    }

    // Parse the JSON string if needed
    const bookmarkData = typeof newBookmark === 'string'
      ? JSON.parse(newBookmark)
      : newBookmark;

    firebaseApi.createBookmark(bookmarkData)
      .then(bookmark => onSuccess(bookmark))
      .catch(error => {
        if (onError) {
          onError({
            responseJSON: {
              message: error.message
            }
          });
        }
      });
  };

  const deleteBookmark = function(id, onSuccess) {
    if (typeof firebaseApi === 'undefined') {
      console.error('Firebase API not loaded');
      onSuccess(); // Optimistically succeed
      return;
    }

    firebaseApi.deleteBookmark(id)
      .then(() => onSuccess())
      .catch(error => {
        console.error('Delete error:', error);
        // Still call success to remove from UI optimistically
        onSuccess();
      });
  };

  const updateBookmark = function(id, updatedBookmark, onSuccess, onError) {
    if (typeof firebaseApi === 'undefined') {
      console.error('Firebase API not loaded');
      if (onError) onError({ responseJSON: { message: 'Database not available' } });
      return;
    }

    const updates = typeof updatedBookmark === 'string'
      ? JSON.parse(updatedBookmark)
      : updatedBookmark;

    firebaseApi.updateBookmark(id, updates)
      .then(bookmark => onSuccess(bookmark))
      .catch(error => {
        if (onError) {
          onError({
            responseJSON: {
              message: error.message
            }
          });
        }
      });
  };

  const listenToBookmarks = function(callback) {
    if (typeof firebaseApi === 'undefined' || !firebaseApi.listenToBookmarks) {
      console.error('Real-time sync not available - Firebase API not loaded');
      // Fallback to one-time fetch
      getBookmarks((bookmarks) => callback(bookmarks));
      // Return a no-op unsubscribe function
      return function() {};
    }

    // Return the unsubscribe function from Firebase
    return firebaseApi.listenToBookmarks(callback);
  };

  return {
    getBookmarks,
    createBookmark,
    deleteBookmark,
    updateBookmark,
    listenToBookmarks
  };
}());
