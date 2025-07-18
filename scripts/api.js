'use strict';

const api = (function() {
  // Switch between Firebase and REST API by changing this flag
  const USE_FIREBASE = true;
  const BASE_URL = 'http://localhost:8000/bookmarks';

  const getBookmarks = function(onSuccess) {
    if (USE_FIREBASE && typeof firebaseApi !== 'undefined') {
      firebaseApi.getBookmarks()
        .then(bookmarks => onSuccess(bookmarks))
        .catch(error => {
          console.error('Firebase error:', error);
          onSuccess([]); // Return empty array on error to maintain app stability
        });
    } else if (USE_FIREBASE && typeof firebaseApi === 'undefined') {
      console.error('Firebase API not loaded, falling back to REST API');
      $.ajax({
        url: BASE_URL,
        method: 'GET',
        contentType: 'application/json',
        success: onSuccess,
        error: () => onSuccess([])
      });
    } else {
      $.ajax({
        url: BASE_URL,
        method: 'GET',
        contentType: 'application/json',
        success: onSuccess
      });
    }
  };

  const createBookmark = function(newBookmark, onSuccess, onError) {
    if (USE_FIREBASE) {
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
    } else {
      $.ajax({
        url: BASE_URL,
        method: 'POST',
        contentType: 'application/json',
        data: newBookmark,
        success: onSuccess,
        error: onError
      });
    }
  };

  const deleteBookmark = function(id, onSuccess) {
    if (USE_FIREBASE) {
      firebaseApi.deleteBookmark(id)
        .then(() => onSuccess())
        .catch(error => {
          console.error('Delete error:', error);
          // Still call success to remove from UI optimistically
          onSuccess();
        });
    } else {
      $.ajax({
        url: `${BASE_URL}/${id}`,
        method: 'DELETE',
        contentType: 'application/json',
        success: onSuccess
      });
    }
  };

  const updateBookmark = function(id, updatedBookmark, onSuccess, onError) {
    if (USE_FIREBASE) {
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
    } else {
      $.ajax({
        url: `${BASE_URL}/${id}`,
        method: 'PATCH',
        contentType: 'application/json',
        data: updatedBookmark,
        success: onSuccess,
        error: onError
      });
    }
  };

  return {
    getBookmarks,
    createBookmark,
    deleteBookmark,
    updateBookmark
  };
}());
