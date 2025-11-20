import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

function EditBookmarkModal({ bookmark, onClose }) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: bookmark.title || '',
    url: bookmark.url || '',
    desc: bookmark.desc || '',
    rating: bookmark.rating || 3,
    tags: bookmark.tags ? bookmark.tags.join(', ') : '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const bookmarkRef = doc(db, `users/${user.uid}/bookmarks`, bookmark.id);

      const updates = {
        title: formData.title,
        url: formData.url,
        desc: formData.desc,
        rating: parseInt(formData.rating),
        tags: formData.tags
          ? formData.tags.split(',').map(t => t.trim()).filter(t => t)
          : [],
      };

      await updateDoc(bookmarkRef, updates);

      onClose();
    } catch (error) {
      console.error('Error updating bookmark:', error);
      alert('Failed to update bookmark');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-60">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">✏️ Edit Bookmark</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">
                📝 Title
              </label>
              <input
                type="text"
                id="edit-title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter bookmark title"
                required
              />
            </div>
            <div>
              <label htmlFor="edit-url" className="block text-sm font-medium text-gray-700 mb-1">
                🔗 URL
              </label>
              <input
                type="url"
                id="edit-url"
                name="url"
                value={formData.url}
                onChange={handleChange}
                className="input-field"
                placeholder="https://example.com"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="edit-desc" className="block text-sm font-medium text-gray-700 mb-1">
              💬 Description
            </label>
            <textarea
              id="edit-desc"
              name="desc"
              value={formData.desc}
              onChange={handleChange}
              rows="3"
              className="input-field"
              placeholder="Optional description"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-tags" className="block text-sm font-medium text-gray-700 mb-1">
                🏷️ Tags (comma-separated)
              </label>
              <input
                type="text"
                id="edit-tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="input-field"
                placeholder="work, productivity, tools"
              />
            </div>
            <div>
              <label htmlFor="edit-rating" className="block text-sm font-medium text-gray-700 mb-1">
                ⭐ Rating
              </label>
              <select
                id="edit-rating"
                name="rating"
                value={formData.rating}
                onChange={handleChange}
                className="input-field"
              >
                <option value="5">5 stars</option>
                <option value="4">4 stars</option>
                <option value="3">3 stars</option>
                <option value="2">2 stars</option>
                <option value="1">1 star</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-firebase disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={saving}
            >
              {saving ? 'Saving...' : '💾 Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditBookmarkModal;
