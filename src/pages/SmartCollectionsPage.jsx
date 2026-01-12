import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, functions } from '../services/firebase';
import { httpsCallable } from 'firebase/functions';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

function SmartCollectionsPage({ onClose, bookmarks }) {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creatingCollection, setCreatingCollection] = useState(null);
  const [expandedCluster, setExpandedCluster] = useState(null);

  // Fetch smart collection suggestions on mount
  useEffect(() => {
    if (!user) return;
    fetchSuggestions();
  }, [user]);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const suggestFn = httpsCallable(functions, 'suggestSmartCollections');
      const result = await suggestFn({ minClusterSize: 2, similarityThreshold: 0.4 });
      setSuggestions(result.data.collections || []);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      if (err.message?.includes('no embeddings')) {
        setError('No embeddings found. Generate embeddings for your bookmarks first.');
      } else {
        setError(err.message || 'Failed to generate smart collection suggestions');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollection = async (cluster) => {
    console.log('Creating collection:', cluster);
    setCreatingCollection(cluster.name);
    try {
      const newCollection = {
        name: cluster.name,
        description: `Smart collection with ${cluster.bookmarks.length} similar bookmarks`,
        ownerId: user.uid,
        ownerEmail: user.email,
        bookmarks: cluster.bookmarks.map(b => b.id),
        collaborators: {},
        isSmartCollection: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      console.log('Adding doc to collections:', newCollection);
      const docRef = await addDoc(collection(db, 'collections'), newCollection);
      console.log('Collection created with ID:', docRef.id);

      // Remove this cluster from suggestions
      setSuggestions(prev => prev.filter(s => s.name !== cluster.name));
      alert(`Collection "${cluster.name}" created!`);
    } catch (err) {
      console.error('Error creating collection:', err);
      alert('Failed to create collection');
    } finally {
      setCreatingCollection(null);
    }
  };

  const getBookmarkById = (id) => {
    return bookmarks?.find(b => b.id === id) || null;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-6 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span>🧠</span> Smart Collections
            </h2>
            <p className="text-cyan-100 text-sm mt-1">AI-powered bookmark organization</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Refresh Button */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-gray-600 text-sm">
              AI analyzes your bookmarks and suggests collections based on semantic similarity.
            </p>
            <button
              onClick={fetchSuggestions}
              disabled={loading}
              className="btn-firebase flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Analyzing...
                </>
              ) : (
                <>
                  <span>🔄</span> Refresh
                </>
              )}
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600 text-lg">Analyzing your bookmarks...</p>
              <p className="text-gray-500 text-sm mt-2">Finding patterns and similarities</p>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Unable to Generate Suggestions</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button onClick={fetchSuggestions} className="btn-firebase">
                Try Again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && suggestions.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Clusters Found</h3>
              <p className="text-gray-600 mb-2">Your bookmarks don't have enough similarity to form clusters yet.</p>
              <p className="text-gray-500 text-sm">Add more bookmarks or generate embeddings to enable smart collections.</p>
            </div>
          )}

          {/* Suggestions List */}
          {!loading && !error && suggestions.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 mb-4">
                Found {suggestions.length} potential collection{suggestions.length !== 1 ? 's' : ''} based on your bookmarks
              </p>

              {suggestions.map((cluster, index) => (
                <div key={index} className="card border-2 border-transparent hover:border-cyan-200 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                        <span className="text-cyan-500">✨</span>
                        {cluster.name}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {cluster.bookmarks.length} similar bookmarks
                      </p>
                    </div>
                    <button
                      onClick={() => handleCreateCollection(cluster)}
                      disabled={creatingCollection === cluster.name}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                    >
                      {creatingCollection === cluster.name ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          Creating...
                        </>
                      ) : (
                        <>
                          <span>📁</span> Create Collection
                        </>
                      )}
                    </button>
                  </div>

                  {/* Toggle Bookmarks Preview */}
                  <button
                    onClick={() => setExpandedCluster(expandedCluster === index ? null : index)}
                    className="text-sm text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1 mb-3"
                  >
                    {expandedCluster === index ? '▼' : '▶'} View Bookmarks
                  </button>

                  {/* Bookmarks Preview */}
                  {expandedCluster === index && (
                    <div className="bg-gray-50 rounded-lg p-4 animate-fade-in">
                      <div className="space-y-3">
                        {cluster.bookmarks.map((bm) => {
                          const fullBookmark = getBookmarkById(bm.id) || bm;
                          return (
                            <div key={bm.id} className="flex items-center gap-3 bg-white p-3 rounded-lg">
                              {fullBookmark.favicon && (
                                <img
                                  src={fullBookmark.favicon}
                                  alt=""
                                  className="w-6 h-6 flex-shrink-0"
                                  onError={(e) => e.target.style.display = 'none'}
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">{fullBookmark.title}</p>
                                <a
                                  href={fullBookmark.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-cyan-600 hover:text-cyan-700 truncate block"
                                >
                                  {fullBookmark.url}
                                </a>
                              </div>
                              {bm.similarity && (
                                <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-1 rounded-full whitespace-nowrap">
                                  {Math.round(bm.similarity * 100)}% similar
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SmartCollectionsPage;
