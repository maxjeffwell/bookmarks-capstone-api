import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { collection, query, onSnapshot, doc, addDoc, deleteDoc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import BookmarkCard from '../components/BookmarkCard';
import CollectionsPage from './CollectionsPage';
import SmartCollectionsPage from './SmartCollectionsPage';
import AlgoliaSearch from '../components/AlgoliaSearch';
import EditBookmarkModal from '../components/EditBookmarkModal';
import ImportExportModal from '../components/ImportExportModal';

function BookmarksPage() {
  const { user, signOut } = useAuth();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'gallery'
  const [showCollections, setShowCollections] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState(null);
  const [showImportExport, setShowImportExport] = useState(false);
  const [showSmartCollections, setShowSmartCollections] = useState(false);
  const [similarResults, setSimilarResults] = useState(null);

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
      userId: user.uid,  // Required for Algolia search filtering
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

  const handleApplyTag = async (bookmarkId, tag) => {
    try {
      const bookmarkRef = doc(db, `users/${user.uid}/bookmarks`, bookmarkId);
      await updateDoc(bookmarkRef, {
        tags: arrayUnion(tag)
      });
    } catch (error) {
      console.error('Error applying tag:', error);
      alert('Failed to apply tag');
    }
  };

  const handleEditBookmark = (bookmark) => {
    setEditingBookmark(bookmark);
  };

  const handleShowSimilar = (bookmark, similar) => {
    setSimilarResults({ bookmark, similar });
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
        {/* Controls */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn-firebase"
            >
              {showAddForm ? '❌ Cancel' : '➕ Add Bookmark'}
            </button>
            <button
              onClick={() => setShowSearch(true)}
              className="px-4 py-2 bg-white/20 text-white hover:bg-white/30 rounded-lg font-medium transition-all"
            >
              🔍 Search
            </button>
            <button
              onClick={() => setShowCollections(true)}
              className="px-4 py-2 bg-white/20 text-white hover:bg-white/30 rounded-lg font-medium transition-all"
            >
              📚 Collections
            </button>
            <button
              onClick={() => setShowImportExport(true)}
              className="px-4 py-2 bg-white/20 text-white hover:bg-white/30 rounded-lg font-medium transition-all"
            >
              📦 Import/Export
            </button>
            <button
              onClick={() => setShowSmartCollections(true)}
              className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-white hover:from-cyan-500 hover:to-blue-600 rounded-lg font-medium transition-all shadow-lg"
            >
              🧠 Smart Collections
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-medium">View:</span>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-gray-900'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              📋 Grid
            </button>
            <button
              onClick={() => setViewMode('gallery')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'gallery'
                  ? 'bg-white text-gray-900'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              🖼️ Gallery
            </button>
          </div>
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

        {/* Bookmarks Display */}
        {!loading && bookmarks.length > 0 && (
          <div className={`grid gap-6 ${
            viewMode === 'gallery'
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          }`}>
            {bookmarks.map(bookmark => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                onDelete={handleDeleteBookmark}
                onApplyTag={handleApplyTag}
                onEdit={handleEditBookmark}
                onShowSimilar={handleShowSimilar}
              />
            ))}
          </div>
        )}
      </main>

      {/* Edit Bookmark Modal */}
      {editingBookmark && (
        <EditBookmarkModal
          bookmark={editingBookmark}
          onClose={() => setEditingBookmark(null)}
        />
      )}

      {/* Search Modal */}
      {showSearch && (
        <AlgoliaSearch
          onDelete={handleDeleteBookmark}
          onApplyTag={handleApplyTag}
          onEdit={handleEditBookmark}
          onClose={() => setShowSearch(false)}
        />
      )}

      {/* Collections Modal */}
      {showCollections && (
        <CollectionsPage onClose={() => setShowCollections(false)} />
      )}

      {/* Import/Export Modal */}
      {showImportExport && (
        <ImportExportModal
          bookmarks={bookmarks}
          onClose={() => setShowImportExport(false)}
        />
      )}

      {/* Smart Collections Modal */}
      {showSmartCollections && (
        <SmartCollectionsPage
          bookmarks={bookmarks}
          onClose={() => setShowSmartCollections(false)}
        />
      )}

      {/* Similar Bookmarks Results Modal */}
      {similarResults && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-6 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold">🔍 Similar Bookmarks</h2>
                <p className="text-cyan-100 text-sm mt-1">
                  Similar to "{similarResults.bookmark.title}"
                </p>
              </div>
              <button
                onClick={() => setSimilarResults(null)}
                className="text-white/80 hover:text-white text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              {similarResults.similar.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-5xl mb-4">🔍</div>
                  <p className="text-gray-600">No similar bookmarks found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {similarResults.similar.map((item) => {
                    const bm = bookmarks.find(b => b.id === item.id) || item;
                    return (
                      <div key={item.id} className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors">
                        {bm.favicon && (
                          <img
                            src={bm.favicon}
                            alt=""
                            className="w-8 h-8 flex-shrink-0"
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{bm.title}</p>
                          <a
                            href={bm.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-cyan-600 hover:text-cyan-700 truncate block"
                          >
                            {bm.url}
                          </a>
                        </div>
                        <span className="text-sm bg-cyan-100 text-cyan-700 px-3 py-1 rounded-full font-medium whitespace-nowrap">
                          {Math.round(item.similarity * 100)}% match
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookmarksPage;
