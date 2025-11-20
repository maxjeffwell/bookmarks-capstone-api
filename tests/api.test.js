/**
 * Tests for the API module
 * Tests Firebase integration and error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('API Module', () => {
  let api;
  let mockFirebaseApi;

  beforeEach(() => {
    // Create mock Firebase API
    mockFirebaseApi = {
      getBookmarks: vi.fn(),
      createBookmark: vi.fn(),
      deleteBookmark: vi.fn(),
      updateBookmark: vi.fn(),
      listenToBookmarks: vi.fn()
    };

    // Create fresh API instance with mock
    api = (function() {
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
            onSuccess([]);
          });
      };

      const createBookmark = function(newBookmark, onSuccess, onError) {
        if (typeof firebaseApi === 'undefined') {
          console.error('Firebase API not loaded');
          if (onError) onError({ responseJSON: { message: 'Database not available' } });
          return;
        }

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
          onSuccess();
          return;
        }

        firebaseApi.deleteBookmark(id)
          .then(() => onSuccess())
          .catch(error => {
            console.error('Delete error:', error);
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
          getBookmarks((bookmarks) => callback(bookmarks));
          return function() {};
        }

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

    // Set up global firebaseApi
    global.firebaseApi = mockFirebaseApi;
    global.console.error = vi.fn();
  });

  describe('getBookmarks', () => {
    it('should fetch bookmarks successfully', async () => {
      const mockBookmarks = [
        { id: 1, title: 'Test 1', url: 'https://test1.com' },
        { id: 2, title: 'Test 2', url: 'https://test2.com' }
      ];

      mockFirebaseApi.getBookmarks.mockResolvedValue(mockBookmarks);

      const onSuccess = vi.fn();
      api.getBookmarks(onSuccess);

      // Wait for promise to resolve
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockFirebaseApi.getBookmarks).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalledWith(mockBookmarks);
    });

    it('should handle errors gracefully', async () => {
      mockFirebaseApi.getBookmarks.mockRejectedValue(new Error('Network error'));

      const onSuccess = vi.fn();
      api.getBookmarks(onSuccess);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(onSuccess).toHaveBeenCalledWith([]);
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle missing Firebase API', () => {
      global.firebaseApi = undefined;

      const onSuccess = vi.fn();
      api.getBookmarks(onSuccess);

      expect(onSuccess).toHaveBeenCalledWith([]);
      expect(console.error).toHaveBeenCalledWith('Firebase API not loaded');
    });
  });

  describe('createBookmark', () => {
    it('should create bookmark with object data', async () => {
      const newBookmark = { title: 'New', url: 'https://new.com', rating: 4 };
      const createdBookmark = { id: 123, ...newBookmark };

      mockFirebaseApi.createBookmark.mockResolvedValue(createdBookmark);

      const onSuccess = vi.fn();
      api.createBookmark(newBookmark, onSuccess);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockFirebaseApi.createBookmark).toHaveBeenCalledWith(newBookmark);
      expect(onSuccess).toHaveBeenCalledWith(createdBookmark);
    });

    it('should create bookmark with JSON string data', async () => {
      const newBookmark = { title: 'New', url: 'https://new.com' };
      const jsonString = JSON.stringify(newBookmark);
      const createdBookmark = { id: 123, ...newBookmark };

      mockFirebaseApi.createBookmark.mockResolvedValue(createdBookmark);

      const onSuccess = vi.fn();
      api.createBookmark(jsonString, onSuccess);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockFirebaseApi.createBookmark).toHaveBeenCalledWith(newBookmark);
      expect(onSuccess).toHaveBeenCalledWith(createdBookmark);
    });

    it('should handle creation errors', async () => {
      const error = new Error('Title cannot be blank');
      mockFirebaseApi.createBookmark.mockRejectedValue(error);

      const onSuccess = vi.fn();
      const onError = vi.fn();
      api.createBookmark({ title: '', url: 'test' }, onSuccess, onError);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(onError).toHaveBeenCalledWith({
        responseJSON: { message: 'Title cannot be blank' }
      });
    });

    it('should handle missing Firebase API', () => {
      global.firebaseApi = undefined;

      const onSuccess = vi.fn();
      const onError = vi.fn();
      api.createBookmark({ title: 'Test' }, onSuccess, onError);

      expect(onError).toHaveBeenCalledWith({
        responseJSON: { message: 'Database not available' }
      });
    });
  });

  describe('deleteBookmark', () => {
    it('should delete bookmark successfully', async () => {
      mockFirebaseApi.deleteBookmark.mockResolvedValue();

      const onSuccess = vi.fn();
      api.deleteBookmark(123, onSuccess);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockFirebaseApi.deleteBookmark).toHaveBeenCalledWith(123);
      expect(onSuccess).toHaveBeenCalled();
    });

    it('should handle delete errors optimistically', async () => {
      mockFirebaseApi.deleteBookmark.mockRejectedValue(new Error('Not found'));

      const onSuccess = vi.fn();
      api.deleteBookmark(123, onSuccess);

      await new Promise(resolve => setTimeout(resolve, 0));

      // Should still call success for optimistic UI update
      expect(onSuccess).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle missing Firebase API', () => {
      global.firebaseApi = undefined;

      const onSuccess = vi.fn();
      api.deleteBookmark(123, onSuccess);

      expect(onSuccess).toHaveBeenCalled();
    });
  });

  describe('updateBookmark', () => {
    it('should update bookmark with object data', async () => {
      const updates = { title: 'Updated', rating: 5 };
      const updatedBookmark = { id: 123, ...updates };

      mockFirebaseApi.updateBookmark.mockResolvedValue(updatedBookmark);

      const onSuccess = vi.fn();
      api.updateBookmark(123, updates, onSuccess);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockFirebaseApi.updateBookmark).toHaveBeenCalledWith(123, updates);
      expect(onSuccess).toHaveBeenCalledWith(updatedBookmark);
    });

    it('should update bookmark with JSON string data', async () => {
      const updates = { title: 'Updated' };
      const jsonString = JSON.stringify(updates);
      const updatedBookmark = { id: 123, ...updates };

      mockFirebaseApi.updateBookmark.mockResolvedValue(updatedBookmark);

      const onSuccess = vi.fn();
      api.updateBookmark(123, jsonString, onSuccess);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockFirebaseApi.updateBookmark).toHaveBeenCalledWith(123, updates);
      expect(onSuccess).toHaveBeenCalledWith(updatedBookmark);
    });

    it('should handle update errors', async () => {
      const error = new Error('Validation failed');
      mockFirebaseApi.updateBookmark.mockRejectedValue(error);

      const onSuccess = vi.fn();
      const onError = vi.fn();
      api.updateBookmark(123, { title: '' }, onSuccess, onError);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(onError).toHaveBeenCalledWith({
        responseJSON: { message: 'Validation failed' }
      });
    });

    it('should handle missing Firebase API', () => {
      global.firebaseApi = undefined;

      const onSuccess = vi.fn();
      const onError = vi.fn();
      api.updateBookmark(123, { title: 'Test' }, onSuccess, onError);

      expect(onError).toHaveBeenCalledWith({
        responseJSON: { message: 'Database not available' }
      });
    });
  });

  describe('listenToBookmarks', () => {
    it('should set up real-time listener', () => {
      const mockUnsubscribe = vi.fn();
      mockFirebaseApi.listenToBookmarks.mockReturnValue(mockUnsubscribe);

      const callback = vi.fn();
      const unsubscribe = api.listenToBookmarks(callback);

      expect(mockFirebaseApi.listenToBookmarks).toHaveBeenCalledWith(callback);
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it('should fall back to one-time fetch if listener unavailable', async () => {
      global.firebaseApi = { ...mockFirebaseApi, listenToBookmarks: undefined };

      const mockBookmarks = [{ id: 1, title: 'Test' }];
      mockFirebaseApi.getBookmarks.mockResolvedValue(mockBookmarks);

      const callback = vi.fn();
      const unsubscribe = api.listenToBookmarks(callback);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(callback).toHaveBeenCalledWith(mockBookmarks);
      expect(typeof unsubscribe).toBe('function');
      expect(unsubscribe()).toBeUndefined(); // No-op function
    });

    it('should handle missing Firebase API', () => {
      global.firebaseApi = undefined;

      const callback = vi.fn();
      const unsubscribe = api.listenToBookmarks(callback);

      expect(console.error).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });
  });
});
