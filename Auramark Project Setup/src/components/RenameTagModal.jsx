import React, { useState, useEffect } from 'react';

const RenameTagModal = ({ oldTag, onRename, onClose, loading, error }) => {
  const [newTagName, setNewTagName] = useState(oldTag || '');

  useEffect(() => {
    setNewTagName(oldTag || '');
  }, [oldTag]);

  const commonInputClasses = "w-full p-3 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 transition duration-200 bg-bg-primary text-text-primary"; // Use theme variables
  const primaryButtonClasses = "w-full py-3 px-6 rounded-xl font-semibold bg-gradient-to-r from-accent-start to-white text-white hover:from-purple-700 hover:to-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:ring-offset-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"; // Changed text-text-primary to text-white
  const secondaryButtonClasses = "w-full py-3 px-6 rounded-xl text-text-secondary font-semibold bg-bg-secondary hover:bg-gray-200 border border-border-color focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"; // Use theme variables

  const handleSubmit = (e) => {
    e.preventDefault();
    onRename(oldTag, newTagName);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-bg-primary rounded-xl p-8 shadow-2xl max-w-sm w-full relative"> {/* Use bg-bg-primary */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-text-primary text-2xl font-bold" // Use theme variables
          aria-label="Close"
          disabled={loading}
        >
          &times;
        </button>

        <h2 className="text-2xl font-bold text-center text-text-primary mb-6"> {/* Use text-text-primary */}
          Rename Tag "{oldTag}"
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="new-tag-name" className="sr-only">New Tag Name</label>
            <input
              type="text"
              id="new-tag-name"
              placeholder="Enter new tag name"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              className={commonInputClasses}
              required
              disabled={loading}
            />
          </div>
          <div className="flex gap-4">
            <button type="button" onClick={onClose} className={secondaryButtonClasses} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className={primaryButtonClasses} disabled={loading || !newTagName.trim() || newTagName.trim() === oldTag}>
              {loading ? 'Renaming...' : 'Rename Tag'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RenameTagModal;