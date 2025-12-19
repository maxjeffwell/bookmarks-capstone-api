import React, { useState } from 'react';

function BookmarkCard({ bookmark, onDelete, onApplyTag, onEdit }) {
  const [expanded, setExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);

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
                🏷️ {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* AI Suggested Tags */}
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
        {bookmark.createdAt && (
          <span className="text-gray-400 ml-auto whitespace-nowrap">
            {new Date(bookmark.createdAt?.toDate?.() || bookmark.createdAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Expandable Details */}
      {(bookmark.fetchError || bookmark.screenshotError || bookmark.autoTagError) && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-gray-500 hover:text-gray-700 mb-3 flex items-center gap-1"
        >
          {expanded ? '▼' : '▶'} Show details
        </button>
      )}

      {expanded && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg text-xs">
          {bookmark.fetchError && (
            <p className="text-red-600 mb-2">
              <strong>Metadata error:</strong> {bookmark.fetchError}
            </p>
          )}
          {bookmark.screenshotError && (
            <p className="text-red-600 mb-2">
              <strong>Screenshot error:</strong> {bookmark.screenshotError}
            </p>
          )}
          {bookmark.autoTagError && (
            <p className="text-red-600">
              <strong>Auto-tag error:</strong> {bookmark.autoTagError}
            </p>
          )}
        </div>
      )}

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
