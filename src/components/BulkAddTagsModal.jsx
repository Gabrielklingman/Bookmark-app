import React, { useState } from 'react';
import { db } from '../firebase/config';
import { doc, updateDoc, writeBatch, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const icons = {
  addTag: '➕',
};

const BulkAddTagsModal = ({ onClose, selectedBookmarkIds }) => {
  const { currentUser } = useAuth();
  const [currentTagInput, setCurrentTagInput] = useState('');
  const [tagsToAdd, setTagsToAdd] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const recentlyUsedTags = ['React', 'TailwindCSS', 'Firebase', 'Productivity', 'Reading', 'WebDev'];

  const commonInputClasses = "w-full p-3 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 transition duration-200 bg-bg-primary text-text-primary"; // Use theme variables
  const commonButtonClasses = "py-2 px-4 rounded-lg font-medium transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  const primaryButtonClasses = "bg-gradient-to-r from-accent-start to-white text-white hover:from-purple-700 hover:to-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:ring-offset-2"; // Changed text-text-primary to text-white
  const secondaryButtonClasses = "bg-bg-secondary text-text-secondary hover:bg-gray-200 border border-border-color focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"; // Use theme variables

  const handleAddTag = (tag) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tagsToAdd.includes(trimmedTag)) {
      setTagsToAdd([...tagsToAdd, trimmedTag]);
      setCurrentTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTagsToAdd(tagsToAdd.filter(tag => tag !== tagToRemove));
  };

  const handleApplyTags = async () => {
    setError('');
    if (tagsToAdd.length === 0) {
      setError('Please add at least one tag to apply.');
      return;
    }
    if (!currentUser) {
      setError('You must be logged in to add tags.');
      return;
    }
    if (selectedBookmarkIds.length === 0) {
      setError('No bookmarks selected for tagging.');
      return;
    }

    setLoading(true);
    try {
      const batch = writeBatch(db);
      selectedBookmarkIds.forEach(bookmarkId => {
        const bookmarkRef = doc(db, 'users', currentUser.uid, 'bookmarks', bookmarkId);
        // Use arrayUnion to add tags without creating duplicates
        batch.update(bookmarkRef, {
          tags: arrayUnion(...tagsToAdd)
        });
      });
      await batch.commit();
      onClose();
    } catch (e) {
      console.error("Error applying tags: ", e);
      setError('Failed to apply tags. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-bg-primary rounded-xl p-8 shadow-2xl max-w-md w-full relative my-8"> {/* Use bg-bg-primary */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-text-primary text-2xl font-bold" // Use theme variables
          aria-label="Close"
          disabled={loading}
        >
          &times;
        </button>

        <h2 className="text-2xl font-bold text-center text-text-primary mb-6"> {/* Use text-text-primary */}
          Add Tags to {selectedBookmarkIds.length} Bookmarks
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-text-primary mb-3">Tags to Add</h3> {/* Use text-text-primary */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="Type tag and press Enter"
              value={currentTagInput}
              onChange={(e) => setCurrentTagInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag(currentTagInput);
                }
              }}
              className={`${commonInputClasses} flex-grow`}
              disabled={loading}
            />
            <button
              onClick={() => handleAddTag(currentTagInput)}
              className={`p-3 rounded-lg bg-bg-secondary hover:bg-gray-200 text-text-secondary transition duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`} // Use theme variables
              aria-label="Add tag"
              disabled={loading}
            >
              {icons.addTag}
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {tagsToAdd.map((tag) => (
              <span
                key={tag}
                className="flex items-center bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-full font-medium cursor-pointer hover:bg-purple-200 transition duration-200"
                onClick={() => handleRemoveTag(tag)}
              >
                {tag} <span className="ml-1 text-xs">×</span>
              </span>
            ))}
          </div>
          <h4 className="text-md font-medium text-text-primary mb-2">Recently Used Tags:</h4> {/* Use text-text-primary */}
          <div className="flex flex-wrap gap-2">
            {recentlyUsedTags.map((tag) => (
              <button
                key={`recent-${tag}`}
                onClick={() => handleAddTag(tag)}
                className={`bg-bg-secondary text-text-secondary text-sm px-3 py-1 rounded-full font-medium hover:bg-gray-200 transition duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`} // Use theme variables
                disabled={loading}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button onClick={onClose} className={`${secondaryButtonClasses} flex-1`} disabled={loading}>
            Cancel
          </button>
          <button onClick={handleApplyTags} className={`${primaryButtonClasses} flex-1`} disabled={loading || tagsToAdd.length === 0}>
            {loading ? 'Applying...' : 'Apply Tags'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkAddTagsModal;