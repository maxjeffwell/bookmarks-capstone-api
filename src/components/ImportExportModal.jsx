import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

function ImportExportModal({ bookmarks, onClose }) {
  const { user } = useAuth();
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState(null);

  const handleExport = () => {
    // Create export data with only user-editable fields
    const exportData = bookmarks.map(bookmark => ({
      title: bookmark.title,
      url: bookmark.url,
      desc: bookmark.desc || '',
      rating: bookmark.rating || 3,
      tags: bookmark.tags || [],
    }));

    // Create JSON file
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    // Create download link
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bookmarks-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setImportStatus({
      type: 'success',
      message: `Exported ${exportData.length} bookmarks successfully!`
    });
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    setImportStatus(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate data is an array
      if (!Array.isArray(data)) {
        throw new Error('Invalid format: Expected an array of bookmarks');
      }

      // Import each bookmark
      const bookmarksRef = collection(db, `users/${user.uid}/bookmarks`);
      let successCount = 0;
      let errorCount = 0;

      for (const item of data) {
        try {
          // Validate required fields
          if (!item.title || !item.url) {
            console.warn('Skipping invalid bookmark:', item);
            errorCount++;
            continue;
          }

          const bookmark = {
            title: item.title,
            url: item.url,
            desc: item.desc || '',
            rating: parseInt(item.rating) || 3,
            tags: Array.isArray(item.tags) ? item.tags : [],
            createdAt: serverTimestamp(),
          };

          await addDoc(bookmarksRef, bookmark);
          successCount++;
        } catch (error) {
          console.error('Error importing bookmark:', error);
          errorCount++;
        }
      }

      setImportStatus({
        type: successCount > 0 ? 'success' : 'error',
        message: `Imported ${successCount} bookmarks successfully!${errorCount > 0 ? ` (${errorCount} failed)` : ''}`
      });
    } catch (error) {
      console.error('Import error:', error);
      setImportStatus({
        type: 'error',
        message: `Import failed: ${error.message}`
      });
    } finally {
      setImporting(false);
      // Reset file input
      e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-60">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-xl">
          <h2 className="text-2xl font-bold text-gray-900">📦 Import/Export Bookmarks</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Message */}
          {importStatus && (
            <div
              className={`p-4 rounded-lg ${
                importStatus.type === 'success'
                  ? 'bg-green-50 border-2 border-green-200 text-green-800'
                  : 'bg-red-50 border-2 border-red-200 text-red-800'
              }`}
            >
              <p className="font-medium">{importStatus.message}</p>
            </div>
          )}

          {/* Export Section */}
          <div className="card">
            <h3 className="text-xl font-bold text-gray-900 mb-3">📤 Export Bookmarks</h3>
            <p className="text-gray-600 text-sm mb-4">
              Download all your bookmarks as a JSON file. This includes titles, URLs, descriptions, ratings, and tags.
            </p>
            <button
              onClick={handleExport}
              className="btn-firebase"
              disabled={bookmarks.length === 0}
            >
              📥 Download JSON ({bookmarks.length} bookmarks)
            </button>
          </div>

          {/* Import Section */}
          <div className="card">
            <h3 className="text-xl font-bold text-gray-900 mb-3">📥 Import Bookmarks</h3>
            <p className="text-gray-600 text-sm mb-4">
              Upload a JSON file to import bookmarks. The file should contain an array of bookmark objects with <code className="bg-gray-200 px-1 rounded">title</code>, <code className="bg-gray-200 px-1 rounded">url</code>, <code className="bg-gray-200 px-1 rounded">desc</code>, <code className="bg-gray-200 px-1 rounded">rating</code>, and <code className="bg-gray-200 px-1 rounded">tags</code> fields.
            </p>

            <div className="space-y-3">
              <label
                htmlFor="import-file"
                className={`btn-firebase inline-block cursor-pointer ${
                  importing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {importing ? '⏳ Importing...' : '📂 Choose JSON File'}
              </label>
              <input
                type="file"
                id="import-file"
                accept=".json,application/json"
                onChange={handleImport}
                disabled={importing}
                className="hidden"
              />

              {/* Example Format */}
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                  📋 Show example JSON format
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
{`[
  {
    "title": "Example Site",
    "url": "https://example.com",
    "desc": "An example bookmark",
    "rating": 5,
    "tags": ["example", "demo"]
  },
  {
    "title": "Another Site",
    "url": "https://another.com",
    "desc": "Another example",
    "rating": 4,
    "tags": ["tools", "productivity"]
  }
]`}
                </pre>
              </details>
            </div>
          </div>

          {/* Warning */}
          <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Note:</strong> Imported bookmarks will be added to your existing collection. Duplicate bookmarks may be created if you import the same file multiple times.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex justify-end rounded-b-xl">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImportExportModal;
