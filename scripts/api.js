'use strict';

const api = (function() {
  const BASE_URL = 'http://localhost:8000/bookmarks';

  const getBookmarks = function(onSuccess) {
    $.ajax({
      url: BASE_URL,
      method: 'GET',
      contentType: 'application/json',
      success: onSuccess
    });
  };

  const createBookmark = function(newBookmark, onSuccess, onError) {
    $.ajax({
      url: BASE_URL,
      method: 'POST',
      contentType: 'application/json',
      data: newBookmark,
      success: onSuccess,
      error: onError
    });
  };

  const deleteBookmark = function(id, onSuccess) {
    $.ajax({
      url: `${BASE_URL}/${id}`,
      method: 'DELETE',
      contentType: 'application/json',
      success: onSuccess
    });
  };

  const updateBookmark = function(id, updatedBookmark, onSuccess, onError) {
    $.ajax({
      url: `${BASE_URL}/${id}`,
      method: 'PATCH',
      contentType: 'application/json',
      data: updatedBookmark,
      success: onSuccess,
      error: onError
    });
  };

  return {
    getBookmarks,
    createBookmark,
    deleteBookmark,
    updateBookmark
  };
}());
