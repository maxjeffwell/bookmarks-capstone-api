const firebaseApi = (function() {
  'use strict';

  // Get user-specific collection path
  const getUserBookmarksCollection = function() {
    const userId = auth.getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return `users/${userId}/bookmarks`;
  };

  // Helper to convert Firestore document to bookmark object
  const docToBookmark = function(doc) {
    const data = doc.data();
    
    // Ensure tags is always an array
    if (data.tags && !Array.isArray(data.tags)) {
      // Convert string tags to array
      if (typeof data.tags === 'string') {
        data.tags = data.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      } else {
        data.tags = [];
      }
    } else if (!data.tags) {
      data.tags = [];
    }
    
    return {
      id: doc.id,
      title: data.title || '',
      url: data.url || '',
      desc: data.desc || '',
      rating: data.rating || 1,
      ...data,
      tags: data.tags || [],
      expanded: false // Local UI state
    };
  };

  // Get all bookmarks
  const getBookmarks = function() {
    return firebaseConfig.getCollection(getUserBookmarksCollection())
      .orderBy('createdAt', 'desc')
      .get()
      .then(snapshot => {
        const bookmarks = [];
        snapshot.forEach(doc => {
          bookmarks.push(docToBookmark(doc));
        });
        return bookmarks;
      })
      .catch(error => {
        console.error('Error getting bookmarks:', error);
        if (error.code === 'unavailable' || error.message.includes('ERR_BLOCKED')) {
          throw new Error('Firebase is blocked by your browser. Please disable ad blockers for this site.');
        }
        throw new Error('Failed to load bookmarks. Please try again.');
      });
  };

  // Create a new bookmark
  const createBookmark = function(bookmark) {
    // Ensure tags is properly formatted
    const processedBookmark = { ...bookmark };
    if (!processedBookmark.tags || !Array.isArray(processedBookmark.tags)) {
      processedBookmark.tags = [];
    }
    
    // Add timestamp for ordering
    const bookmarkData = {
      ...processedBookmark,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      expanded: false
    };

    return firebaseConfig.getCollection(getUserBookmarksCollection())
      .add(bookmarkData)
      .then(docRef => {
        // Return the created bookmark with its new ID
        return {
          id: docRef.id,
          ...bookmarkData,
          createdAt: new Date() // Approximate timestamp for immediate display
        };
      })
      .catch(error => {
        console.error('Error creating bookmark:', error);

        // Parse validation errors if any
        if (error.message.includes('title')) {
          throw new Error('Title cannot be blank');
        } else if (error.message.includes('url')) {
          throw new Error('URL must be a valid URL');
        } else {
          throw new Error('Failed to create bookmark. Please try again.');
        }
      });
  };

  // Delete a bookmark
  const deleteBookmark = function(id) {
    return firebaseConfig.getCollection(getUserBookmarksCollection())
      .doc(id)
      .delete()
      .catch(error => {
        console.error('Error deleting bookmark:', error);
        throw new Error('Failed to delete bookmark. Please try again.');
      });
  };

  // Update a bookmark (for future use)
  const updateBookmark = function(id, updates) {
    // Ensure tags is properly formatted if included in updates
    const processedUpdates = { ...updates };
    if (processedUpdates.tags !== undefined) {
      if (!processedUpdates.tags || !Array.isArray(processedUpdates.tags)) {
        processedUpdates.tags = [];
      }
    }
    
    return firebaseConfig.getCollection(getUserBookmarksCollection())
      .doc(id)
      .update({
        ...processedUpdates,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      })
      .then(() => {
        return { id, ...updates };
      })
      .catch(error => {
        console.error('Error updating bookmark:', error);
        throw new Error('Failed to update bookmark. Please try again.');
      });
  };

  // Real-time listener for bookmarks (optional enhancement)
  const listenToBookmarks = function(callback) {
    return firebaseConfig.getCollection(getUserBookmarksCollection())
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        const bookmarks = [];
        snapshot.forEach(doc => {
          bookmarks.push(docToBookmark(doc));
        });
        callback(bookmarks);
      }, error => {
        console.error('Error listening to bookmarks:', error);
        callback([], 'Failed to sync bookmarks');
      });
  };

  return {
    getBookmarks,
    createBookmark,
    deleteBookmark,
    updateBookmark,
    listenToBookmarks
  };
}());
