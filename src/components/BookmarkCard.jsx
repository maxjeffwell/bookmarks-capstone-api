import React, { useState } from 'react';
import { functions } from '../services/firebase';
import { httpsCallable } from 'firebase/functions';

function BookmarkCard({ bookmark, onDelete, onApplyTag, onEdit, onShowSimilar }) {
  const [expanded, setExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [findingSimilar, setFindingSimilar] = useState(false);
  const [similarBookmarks, setSimilarBookmarks] = useState(null);
  const [generatingEmbedding, setGeneratingEmbedding] = useState(false);
  const [retryingScreenshot, setRetryingScreenshot] = useState(false);
  const [retryingMetadata, setRetryingMetadata] = useState(false);
  const [retryingAll, setRetryingAll] = useState(false);

  // Helper to detect URL-related errors that require fixing the URL first
  const isUrlError = (error) => {
    if (!error) return false;
    const urlErrorPatterns = [
      'EAI_AGAIN',
      'ENOTFOUND',
      'Invalid URL',
      'invalid url',
      'getaddrinfo',
      'ECONNREFUSED',
      'ERR_NAME_NOT_RESOLVED'
    ];
    return urlErrorPatterns.some(pattern => error.includes(pattern));
  };

  // Check if errors are retryable (not URL-related)
  const hasUrlError = isUrlError(bookmark.fetchError) || isUrlError(bookmark.screenshotError);
  const hasRetryableErrors = (bookmark.fetchError || bookmark.screenshotError) && !hasUrlError;
  const hasMultipleErrors = bookmark.fetchError && bookmark.screenshotError;

  const getFaviconUrl = (url) => {
    if (bookmark.favicon) return bookmark.favicon;
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch (e) {
      return null;
    }
  };

  const faviconUrl = getFaviconUrl(bookmark.url);

  // Handler for AI enhancement
  const handleEnhanceWithAI = async () => {
    setEnhancing(true);
    try {
      const enhanceFn = httpsCallable(functions, 'enhanceBookmarkWithAI');
      await enhanceFn({ bookmarkId: bookmark.id });
      // UI will auto-update via Firestore real-time listener
    } catch (error) {
      console.error('Enhancement error:', error);
      alert(error.message || 'Failed to enhance bookmark with AI');
    } finally {
      setEnhancing(false);
    }
  };

  // Handler for generating embedding
  const handleGenerateEmbedding = async () => {
    setGeneratingEmbedding(true);
    try {
      const generateFn = httpsCallable(functions, 'generateBookmarkEmbedding');
      await generateFn({ bookmarkId: bookmark.id });
      // UI will auto-update via Firestore real-time listener
    } catch (error) {
      console.error('Embedding error:', error);
      alert(error.message || 'Failed to generate embedding');
    } finally {
      setGeneratingEmbedding(false);
    }
  };

  // Handler for finding similar bookmarks
  const handleFindSimilar = async () => {
    setFindingSimilar(true);
    setSimilarBookmarks(null);
    try {
      const findSimilarFn = httpsCallable(functions, 'findSimilarBookmarks');
      const result = await findSimilarFn({ bookmarkId: bookmark.id, limit: 5, threshold: 0.4 });
      const similar = result.data?.similar || [];
      setSimilarBookmarks(similar);
      if (onShowSimilar) {
        onShowSimilar(bookmark, similar);
      }
    } catch (error) {
      console.error('Find similar error:', error);
      if (error.message?.includes('no embedding')) {
        alert('Please generate an embedding first');
      } else {
        alert(error.message || 'Failed to find similar bookmarks');
      }
    } finally {
      setFindingSimilar(false);
    }
  };

  // Handler for retrying screenshot capture
  const handleRetryScreenshot = async () => {
    setRetryingScreenshot(true);
    try {
      const retryFn = httpsCallable(functions, 'retryScreenshot');
      await retryFn({ bookmarkId: bookmark.id });
      // UI will auto-update via Firestore real-time listener
    } catch (error) {
      console.error('Screenshot retry error:', error);
      alert(error.message || 'Failed to capture screenshot');
    } finally {
      setRetryingScreenshot(false);
    }
  };

  // Handler for retrying metadata fetch
  const handleRetryMetadata = async () => {
    setRetryingMetadata(true);
    try {
      const retryFn = httpsCallable(functions, 'retryMetadata');
      await retryFn({ bookmarkId: bookmark.id });
      // UI will auto-update via Firestore real-time listener
    } catch (error) {
      console.error('Metadata retry error:', error);
      alert(error.message || 'Failed to fetch metadata');
    } finally {
      setRetryingMetadata(false);
    }
  };

  // Handler for retrying all failed operations
  const handleRetryAll = async () => {
    setRetryingAll(true);
    try {
      const retryFn = httpsCallable(functions, 'retryAll');
      const result = await retryFn({ bookmarkId: bookmark.id });
      if (!result.data.success) {
        alert(result.data.message || 'Some operations failed');
      }
      // UI will auto-update via Firestore real-time listener
    } catch (error) {
      console.error('Retry all error:', error);
      alert(error.message || 'Failed to retry operations');
    } finally {
      setRetryingAll(false);
    }
  };

  return (
    <div className="card animate-fade-in">
      {/* Screenshot or OpenGraph Image */}
      {(bookmark.screenshot || (bookmark.image && !imageError)) && (
        <div className="mb-4 rounded-lg overflow-hidden bg-gray-100">
          <img
            src={bookmark.screenshot || bookmark.image}
            alt={bookmark.title}
            className="w-full h-48 object-cover"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        </div>
      )}

      {/* Header with Favicon and Title */}
      <div className="flex items-start gap-3 mb-3">
        {faviconUrl && (
          <img
            src={faviconUrl}
            alt=""
            className="w-8 h-8 mt-1 flex-shrink-0"
            onError={(e) => e.target.style.display = 'none'}
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-gray-900 mb-1 break-words">
            {bookmark.title}
          </h3>
          {bookmark.siteName && (
            <p className="text-sm text-gray-500 mb-1">{bookmark.siteName}</p>
          )}
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-firebase-orange hover:text-firebase-amber text-sm break-all block"
          >
            {bookmark.url}
          </a>
        </div>
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

      {/* AI-Generated Description */}
      {bookmark.aiDescription && (
        <div className="mb-3 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-100">
          <p className="text-xs font-semibold text-purple-700 mb-1 flex items-center gap-1">
            <span>✨</span> AI Description
          </p>
          <p className="text-gray-700 text-sm">{bookmark.aiDescription}</p>
        </div>
      )}

      {/* Description */}
      {bookmark.desc && (
        <p className="text-gray-600 text-sm mb-3 line-clamp-3">{bookmark.desc}</p>
      )}

      {/* User Tags */}
      {Array.isArray(bookmark.tags) && bookmark.tags.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-500 mb-2">Your Tags:</p>
          <div className="flex flex-wrap gap-2">
            {bookmark.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* AI Suggested Tags (from Google NLP) */}
      {Array.isArray(bookmark.suggestedTags) && bookmark.suggestedTags.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-500 mb-2">
            AI Suggested Tags {bookmark.autoTagged && <span className="text-green-600">✓</span>}
          </p>
          <div className="flex flex-wrap gap-2">
            {bookmark.suggestedTags.map((tag, index) => (
              <button
                key={index}
                onClick={() => onApplyTag(bookmark.id, tag)}
                className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium hover:bg-purple-200 transition-colors"
                title="Click to add this tag"
              >
                ✨ {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI Enhanced Tags (from shared-ai-gateway) */}
      {Array.isArray(bookmark.aiEnhancedTags) && bookmark.aiEnhancedTags.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
            <span className="text-indigo-600">🧠</span> AI Enhanced Tags
          </p>
          <div className="flex flex-wrap gap-2">
            {bookmark.aiEnhancedTags.map((tag, index) => (
              <button
                key={index}
                onClick={() => onApplyTag(bookmark.id, tag)}
                className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full font-medium hover:bg-indigo-200 transition-colors"
                title="Click to add this tag"
              >
                🧠 {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Enhance with AI Button */}
      {bookmark.autoTagged && !bookmark.aiEnhanced && (
        <button
          onClick={handleEnhanceWithAI}
          disabled={enhancing}
          className="w-full mb-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {enhancing ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Enhancing...
            </>
          ) : (
            <>
              <span>✨</span> Enhance with AI
            </>
          )}
        </button>
      )}

      {/* Metadata Status Indicators */}
      <div className="flex items-center flex-wrap gap-3 text-xs text-gray-500 mb-4 pb-3 border-b border-gray-200">
        {bookmark.fetched && (
          <span className="flex items-center gap-1">
            <span className="text-green-500">✅</span> Metadata
          </span>
        )}
        {bookmark.screenshot && (
          <span className="flex items-center gap-1">
            <span className="text-blue-500">📸</span> Screenshot
          </span>
        )}
        {bookmark.autoTagged && (
          <span className="flex items-center gap-1">
            <span className="text-purple-500">🤖</span> AI Tagged
          </span>
        )}
        {bookmark.aiEnhanced && (
          <span className="flex items-center gap-1">
            <span className="text-indigo-500">✨</span> AI Enhanced
          </span>
        )}
        {bookmark.hasEmbedding && (
          <span className="flex items-center gap-1">
            <span className="text-emerald-500">🧬</span> Embedded
          </span>
        )}
        {bookmark.createdAt && (
          <span className="text-gray-400 ml-auto whitespace-nowrap">
            {new Date(bookmark.createdAt?.toDate?.() || bookmark.createdAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Expandable Details */}
      {(bookmark.fetchError || bookmark.screenshotError || bookmark.autoTagError || bookmark.aiEnhanceError) && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-gray-500 hover:text-gray-700 mb-3 flex items-center gap-1"
        >
          {expanded ? '▼' : '▶'} Show details
        </button>
      )}

      {expanded && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg text-xs space-y-3">
          {/* URL Error Warning */}
          {hasUrlError && (
            <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-700 font-medium flex items-center gap-1.5 mb-1">
                <span>⚠️</span> URL Issue Detected
              </p>
              <p className="text-amber-600 text-xs mb-2">
                If you've already fixed the URL, click "Retry All" below. Otherwise, edit the bookmark first.
              </p>
              {onEdit && (
                <button
                  onClick={() => onEdit(bookmark)}
                  className="px-3 py-1.5 bg-amber-500 text-white rounded text-xs font-medium hover:bg-amber-600 transition-all flex items-center gap-1.5"
                >
                  <span>✏️</span> Edit URL
                </button>
              )}
            </div>
          )}

          {/* Metadata Error */}
          {bookmark.fetchError && (
            <div>
              <p className="text-red-600 mb-2">
                <strong>Metadata error:</strong> {bookmark.fetchError}
              </p>
              <button
                onClick={handleRetryMetadata}
                disabled={retryingMetadata || retryingAll}
                className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded text-xs font-medium hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
              >
                {retryingMetadata ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Retrying...
                  </>
                ) : (
                  <>
                    <span>🔄</span> Retry Metadata
                  </>
                )}
              </button>
            </div>
          )}

          {/* Screenshot Error */}
          {bookmark.screenshotError && (
            <div>
              <p className="text-red-600 mb-2">
                <strong>Screenshot error:</strong> {bookmark.screenshotError}
              </p>
              <button
                onClick={handleRetryScreenshot}
                disabled={retryingScreenshot || retryingAll}
                className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded text-xs font-medium hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
              >
                {retryingScreenshot ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Retrying...
                  </>
                ) : (
                  <>
                    <span>📸</span> Retry Screenshot
                  </>
                )}
              </button>
            </div>
          )}

          {/* Auto-tag Error */}
          {bookmark.autoTagError && (
            <p className="text-red-600">
              <strong>Auto-tag error:</strong> {bookmark.autoTagError}
            </p>
          )}

          {/* AI Enhance Error */}
          {bookmark.aiEnhanceError && (
            <div>
              <p className="text-red-600 mb-2">
                <strong>AI enhance error:</strong> {bookmark.aiEnhanceError}
              </p>
              <button
                onClick={handleEnhanceWithAI}
                disabled={enhancing}
                className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded text-xs font-medium hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
              >
                {enhancing ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Retrying...
                  </>
                ) : (
                  <>
                    <span>✨</span> Retry AI Enhancement
                  </>
                )}
              </button>
            </div>
          )}

          {/* Retry All Button - shown when multiple errors exist */}
          {hasMultipleErrors && (
            <div className="pt-2 border-t border-gray-200">
              <button
                onClick={handleRetryAll}
                disabled={retryingAll || retryingMetadata || retryingScreenshot}
                className="w-full px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded text-xs font-medium hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
              >
                {retryingAll ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Retrying All...
                  </>
                ) : (
                  <>
                    <span>🔄</span> Retry All (Metadata + Screenshot)
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Smart Collections Actions */}
      <div className="flex gap-2 mb-4">
        {!bookmark.hasEmbedding ? (
          <button
            onClick={handleGenerateEmbedding}
            disabled={generatingEmbedding}
            className="flex-1 px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg text-sm font-medium hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {generatingEmbedding ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Generating...
              </>
            ) : (
              <>
                <span>🧬</span> Generate Embedding
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleFindSimilar}
            disabled={findingSimilar}
            className="flex-1 px-3 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg text-sm font-medium hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {findingSimilar ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Finding...
              </>
            ) : (
              <>
                <span>🔍</span> Find Similar
              </>
            )}
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t border-gray-200">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-firebase-blue hover:text-blue-700 text-sm font-medium"
        >
          🔗 Visit Site
        </a>
        <div className="flex gap-3">
          {onEdit && (
            <button
              onClick={() => onEdit(bookmark)}
              className="text-firebase-orange hover:text-firebase-amber text-sm font-medium"
            >
              ✏️ Edit
            </button>
          )}
          <button
            onClick={() => onDelete(bookmark.id)}
            className="text-red-600 hover:text-red-700 text-sm font-medium"
          >
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default BookmarkCard;
