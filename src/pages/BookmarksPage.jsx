import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { collection, query, onSnapshot, doc, addDoc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

function BookmarksPage() {
  const { user, signOut } = useAuth();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Real-time sync with Firestore
  useEffect(() => {
    if (!user) return;

    const bookmarksRef = collection(db, `users/${user.uid}/bookmarks`);
    const q = query(bookmarksRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bookmarksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBookmarks(bookmarksData);
      setLoading(false);
      console.log('📡 Real-time sync: received', bookmarksData.length, 'bookmarks');
    }, (error) => {
      console.error('Error fetching bookmarks:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddBookmark = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const bookmark = {
      title: formData.get('title'),
      url: formData.get('url'),
      desc: formData.get('desc') || '',
      rating: parseInt(formData.get('rating')) || 3,
      tags: formData.get('tags') ? formData.get('tags').split(',').map(t => t.trim()).filter(t => t) : [],
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, `users/${user.uid}/bookmarks`), bookmark);
      e.target.reset();
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding bookmark:', error);
      alert('Failed to add bookmark');
    }
  };

  const handleDeleteBookmark = async (bookmarkId) => {
    if (!confirm('Delete this bookmark?')) return;

    try {
      await deleteDoc(doc(db, `users/${user.uid}/bookmarks`, bookmarkId));
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      alert('Failed to delete bookmark');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-gray-900">🔥 FireBook</h1>
              <span className="text-sm text-gray-500">by {user.email}</span>
            </div>
            <button
              onClick={signOut}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add Bookmark Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-firebase"
          >
            {showAddForm ? '❌ Cancel' : '➕ Add Bookmark'}
          </button>
        </div>

        {/* Add Bookmark Form */}
        {showAddForm && (
          <div className="card mb-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🔥 Create New Bookmark</h2>
            <form onSubmit={handleAddBookmark} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    📝 Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    className="input-field"
                    placeholder="Enter bookmark title"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
                    🔗 URL
                  </label>
                  <input
                    type="url"
                    id="url"
                    name="url"
                    className="input-field"
                    placeholder="https://example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="desc" className="block text-sm font-medium text-gray-700 mb-1">
                  💬 Description
                  </label>
                <textarea
                  id="desc"
                  name="desc"
                  rows="3"
                  className="input-field"
                  placeholder="Optional description"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                    🏷️ Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    id="tags"
                    name="tags"
                    className="input-field"
                    placeholder="work, productivity, tools"
                  />
                </div>
                <div>
                  <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-1">
                    ⭐ Rating
                  </label>
                  <select id="rating" name="rating" className="input-field">
                    <option value="5">5 stars</option>
                    <option value="4">4 stars</option>
                    <option value="3" selected>3 stars</option>
                    <option value="2">2 stars</option>
                    <option value="1">1 star</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-firebase">
                  🔥 Create Bookmark
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-white text-lg">Loading bookmarks...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && bookmarks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-bold text-white mb-2">No bookmarks yet</h3>
            <p className="text-white opacity-90">Click "Add Bookmark" to get started!</p>
          </div>
        )}

        {/* Bookmarks Grid */}
        {!loading && bookmarks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookmarks.map(bookmark => (
              <div key={bookmark.id} className="card animate-fade-in">
                {/* Title and URL */}
                <div className="mb-3">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 break-words">
                    {bookmark.title}
                  </h3>
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-firebase-orange hover:text-firebase-amber text-sm break-all"
                  >
                    {bookmark.url}
                  </a>
                </div>

                {/* Rating */}
                <div className="flex items-center mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className={`text-xl ${i < bookmark.rating ? 'text-firebase-orange' : 'text-gray-300'}`}
                    >
                      ★
                    </span>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">{bookmark.rating}/5</span>
                </div>

                {/* Description */}
                {bookmark.desc && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-3">{bookmark.desc}</p>
                )}

                {/* Tags */}
                {bookmark.tags && bookmark.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {bookmark.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Metadata indicators */}
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                  {bookmark.fetched && <span className="flex items-center">✅ Metadata</span>}
                  {bookmark.screenshot && <span className="flex items-center">📸 Screenshot</span>}
                  {bookmark.autoTagged && <span className="flex items-center">🏷️ AI Tagged</span>}
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-4 border-t border-gray-200">
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-firebase-blue hover:text-blue-700 text-sm font-medium"
                  >
                    🔗 Visit
                  </a>
                  <button
                    onClick={() => handleDeleteBookmark(bookmark.id)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default BookmarksPage;
