import React from 'react';
import { InstantSearch, SearchBox, Hits, Configure, Stats } from 'react-instantsearch';
import { searchClient, indexName, isAlgoliaConfigured } from '../services/algolia';
import { useAuth } from '../context/AuthContext';
import BookmarkCard from './BookmarkCard';

function Hit({ hit, onDelete, onApplyTag, onEdit }) {
  // Convert Algolia hit to bookmark format
  const bookmark = {
    id: hit.objectID,
    title: hit.title,
    url: hit.url,
    desc: hit.description || hit.desc,
    rating: hit.rating,
    tags: Array.isArray(hit.tags) ? hit.tags : [],
    suggestedTags: Array.isArray(hit.suggestedTags) ? hit.suggestedTags : [],
    screenshot: hit.screenshot,
    image: hit.image,
    favicon: hit.favicon,
    siteName: hit.siteName,
    fetched: hit.fetched,
    autoTagged: hit.autoTagged,
    createdAt: hit.createdAt,
    fetchError: hit.fetchError,
    screenshotError: hit.screenshotError,
    autoTagError: hit.autoTagError,
  };

  return <BookmarkCard bookmark={bookmark} onDelete={onDelete} onApplyTag={onApplyTag} onEdit={onEdit} />;
}

function AlgoliaSearch({ onDelete, onApplyTag, onEdit, onClose }) {
  const { user } = useAuth();

  if (!isAlgoliaConfigured()) {
    return (
      <div className="card mb-6 bg-yellow-50 border-2 border-yellow-200">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="font-bold text-gray-900 mb-2">Algolia Search Not Configured</h3>
            <p className="text-sm text-gray-700 mb-2">
              To enable instant search, add your Algolia Search-Only API Key to <code className="bg-gray-200 px-1 rounded">.env.local</code>:
            </p>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
              VITE_ALGOLIA_SEARCH_API_KEY=your-search-only-api-key
            </pre>
            <p className="text-xs text-gray-600 mt-2">
              Get your API key from: <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-firebase-blue hover:underline">Firebase Console</a> → Extensions → Algolia Search
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <InstantSearch searchClient={searchClient} indexName={indexName}>
          <Configure filters={`userId:${user.uid}`} hitsPerPage={20} />

          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
            <div className="flex-1 mr-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">🔍 Search Bookmarks</h2>
              <SearchBox
                placeholder="Search bookmarks by title, description, tags..."
                classNames={{
                  root: 'w-full',
                  form: 'relative',
                  input: 'w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-firebase-orange focus:border-transparent text-lg',
                  submit: 'absolute right-3 top-1/2 -translate-y-1/2',
                  reset: 'absolute right-12 top-1/2 -translate-y-1/2',
                  submitIcon: 'w-5 h-5 text-firebase-orange',
                  resetIcon: 'w-5 h-5 text-gray-400',
                }}
                autoFocus
              />
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold flex-shrink-0"
            >
              ×
            </button>
          </div>

          {/* Search Results */}
          <div className="p-6">
            <div className="mb-4">
              <Stats
                classNames={{
                  root: 'text-sm text-gray-600',
                  text: 'font-medium',
                }}
                translations={{
                  rootElementText({ nbHits, processingTimeMS }) {
                    return `Found ${nbHits} bookmark${nbHits !== 1 ? 's' : ''} in ${processingTimeMS}ms`;
                  },
                }}
              />
            </div>

            <Hits
              hitComponent={({ hit }) => <Hit hit={hit} onDelete={onDelete} onApplyTag={onApplyTag} onEdit={onEdit} />}
              classNames={{
                root: 'grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
                list: 'contents',
                item: 'contents',
              }}
            />
          </div>
        </InstantSearch>
      </div>
    </div>
  );
}

export default AlgoliaSearch;
