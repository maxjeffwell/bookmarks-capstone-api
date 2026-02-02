import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, functions } from '../services/firebase';
import { collection, query, onSnapshot, doc, addDoc, deleteDoc, updateDoc, serverTimestamp, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

function CollectionsPage({ onClose }) {
  const { user } = useAuth();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState('viewer');
  const [sharing, setSharing] = useState(false);

  // Real-time sync for collections
  useEffect(() => {
    if (!user) return;

    const collectionsRef = collection(db, 'collections');
    // Query owned collections (shared collections handled separately if needed)
    const q = query(
      collectionsRef,
      where('ownerId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const collectionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCollections(collectionsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching collections:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCreateCollection = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const newCollection = {
      name: formData.get('name'),
      description: formData.get('description') || '',
      ownerId: user.uid,
      ownerEmail: user.email,
      bookmarks: [],
      collaborators: {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, 'collections'), newCollection);
      e.target.reset();
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating collection:', error);
      alert('Failed to create collection');
    }
  };

  const handleDeleteCollection = async (collectionId) => {
    if (!confirm('Delete this collection? This cannot be undone.')) return;

    try {
      await deleteDoc(doc(db, 'collections', collectionId));
    } catch (error) {
      console.error('Error deleting collection:', error);
      alert('Failed to delete collection');
    }
  };

  const handleShareCollection = async (e) => {
    e.preventDefault();
    if (!selectedCollection || !shareEmail) return;

    setSharing(true);
    try {
      const shareCollectionFn = httpsCallable(functions, 'shareCollection');
      const result = await shareCollectionFn({
        collectionId: selectedCollection.id,
        userEmail: shareEmail,
        permission: sharePermission
      });

      alert(result.data.message);
      setShareEmail('');
      setSelectedCollection(null);
    } catch (error) {
      console.error('Error sharing collection:', error);
      alert(error.message || 'Failed to share collection');
    } finally {
      setSharing(false);
    }
  };

  const handleRemoveCollaborator = async (collectionId, userId) => {
    if (!confirm('Remove this collaborator?')) return;

    try {
      const removeCollaboratorFn = httpsCallable(functions, 'removeCollaborator');
      await removeCollaboratorFn({
        collectionId,
        userId
      });
      alert('Collaborator removed');
    } catch (error) {
      console.error('Error removing collaborator:', error);
      alert('Failed to remove collaborator');
    }
  };

  const isOwner = (collection) => collection.ownerId === user.uid;
  const canEdit = (collection) => {
    if (isOwner(collection)) return true;
    const userCollab = collection.collaborators?.[user.uid];
    return userCollab?.permission === 'editor';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-0 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-4xl sm:rounded-2xl shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">📚 Collections</h2>
          <button
            onClick={onClose}
            className="btn-close"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Create Collection Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="btn-firebase"
            >
              {showCreateForm ? '❌ Cancel' : '➕ New Collection'}
            </button>
          </div>

          {/* Create Collection Form */}
          {showCreateForm && (
            <div className="card mb-6 animate-fade-in">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Create New Collection</h3>
              <form onSubmit={handleCreateCollection} className="space-y-4">
                <div>
                  <label htmlFor="collection-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Collection Name
                  </label>
                  <input
                    type="text"
                    id="collection-name"
                    name="name"
                    className="input-field"
                    placeholder="My Favorite Sites"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="collection-description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    id="collection-description"
                    name="description"
                    rows="3"
                    className="input-field"
                    placeholder="A collection of my favorite websites..."
                  ></textarea>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={() => setShowCreateForm(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-firebase">
                    Create Collection
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block w-12 h-12 border-4 border-firebase-orange border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600 text-lg">Loading collections...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && collections.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No collections yet</h3>
              <p className="text-gray-600">Create your first collection to organize bookmarks!</p>
            </div>
          )}

          {/* Collections List */}
          {!loading && collections.length > 0 && (
            <div className="space-y-4">
              {collections.map(coll => (
                <div key={coll.id} className="card">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {coll.name}
                        {isOwner(coll) && <span className="ml-2 text-xs bg-firebase-orange text-white px-2 py-1 rounded-full">Owner</span>}
                      </h3>
                      {coll.description && (
                        <p className="text-gray-600 text-sm">{coll.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Created by {coll.ownerEmail} • {coll.bookmarks?.length || 0} bookmarks
                      </p>
                    </div>
                    {isOwner(coll) && (
                      <button
                        onClick={() => handleDeleteCollection(coll.id)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        🗑️
                      </button>
                    )}
                  </div>

                  {/* Collaborators */}
                  {coll.collaborators && Object.keys(coll.collaborators).length > 0 && (
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Shared with:</p>
                      <div className="space-y-2">
                        {Object.entries(coll.collaborators).map(([userId, collab]) => (
                          <div key={userId} className="flex items-center justify-between text-sm">
                            <div>
                              <span className="text-gray-900">{collab.email}</span>
                              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                                collab.permission === 'editor'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {collab.permission}
                              </span>
                            </div>
                            {isOwner(coll) && (
                              <button
                                onClick={() => handleRemoveCollaborator(coll.id, userId)}
                                className="text-red-600 hover:text-red-700 text-xs"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Share Button */}
                  {isOwner(coll) && (
                    <button
                      onClick={() => setSelectedCollection(coll)}
                      className="mt-3 text-firebase-blue hover:text-blue-700 text-sm font-medium"
                    >
                      👥 Share Collection
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {selectedCollection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-0 sm:p-4 z-60">
          <div className="bg-white w-full h-full sm:h-auto sm:max-w-md sm:rounded-xl shadow-2xl p-6 overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Share "{selectedCollection.name}"</h3>

            <form onSubmit={handleShareCollection} className="space-y-4">
              <div>
                <label htmlFor="share-email" className="block text-sm font-medium text-gray-700 mb-1">
                  User Email
                </label>
                <input
                  type="email"
                  id="share-email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  className="input-field"
                  placeholder="friend@example.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="share-permission" className="block text-sm font-medium text-gray-700 mb-1">
                  Permission Level
                </label>
                <select
                  id="share-permission"
                  value={sharePermission}
                  onChange={(e) => setSharePermission(e.target.value)}
                  className="input-field"
                >
                  <option value="viewer">Viewer (can only view)</option>
                  <option value="editor">Editor (can add/edit)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCollection(null);
                    setShareEmail('');
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sharing}
                  className="btn-firebase disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sharing ? 'Sharing...' : 'Share Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CollectionsPage;
