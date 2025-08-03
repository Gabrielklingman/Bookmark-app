import React, { useState } from 'react';
import { db } from '../firebase/config';
import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const icons = {
  folder: '📁',
};

const BulkMoveToFolderModal = ({ onClose, folders, selectedBookmarkIds }) => {
  const { currentUser } = useAuth();
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const commonButtonClasses = "py-2 px-4 rounded-lg font-medium transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  const primaryButtonClasses = "bg-gradient-to-r from-accent-start to-white text-white hover:from-purple-700 hover:to-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:ring-offset-2"; // Changed text-text-primary to text-white
  const secondaryButtonClasses = "bg-bg-secondary text-text-secondary hover:bg-gray-200 border border-border-color focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"; // Use theme variables

  const handleMove = async () => {
    setError('');
    if (!selectedFolder) {
      setError('Please select a folder to move bookmarks to.');
      return;
    }
    if (!currentUser) {
      setError('You must be logged in to move bookmarks.');
      return;
    }
    if (selectedBookmarkIds.length === 0) {
      setError('No bookmarks selected for moving.');
      return;
    }

    setLoading(true);
    try {
      const batch = writeBatch(db);
      selectedBookmarkIds.forEach(bookmarkId => {
        const bookmarkRef = doc(db, 'users', currentUser.uid, 'bookmarks', bookmarkId);
        batch.update(bookmarkRef, {
          folderId: selectedFolder,
          isTrashed: false, // Ensure they are not trashed if moved to a folder
        });
      });
      await batch.commit();
      onClose();
    } catch (e) {
      console.error("Error moving bookmarks: ", e);
      setError('Failed to move bookmarks. Please try again.');
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
          Move {selectedBookmarkIds.length} Bookmarks
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-text-primary mb-3">Select Destination Folder</h3> {/* Use text-text-primary */}
          <div className="flex flex-wrap gap-3 max-h-48 overflow-y-auto custom-scrollbar p-1 -m-1">
            {folders.length > 0 ? (
              folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolder(folder.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition duration-200 text-sm font-medium ${loading ? 'opacity-50 cursor-not-allowed' : ''} ${selectedFolder === folder.id ? 'border-accent-start bg-purple-50 text-purple-800 shadow-sm' : 'border-border-color bg-bg-secondary text-text-secondary hover:bg-gray-100'}`} // Use theme variables
                  disabled={loading}
                >
                  <span className="text-lg">{icons.folder}</span>
                  <span>{folder.name}</span>
                </button>
              ))
            ) : (
              <p className="text-text-secondary text-sm">No custom folders available. Create one first!</p> // Use text-text-secondary
            )}
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button onClick={onClose} className={`${secondaryButtonClasses} flex-1`} disabled={loading}>
            Cancel
          </button>
          <button onClick={handleMove} className={`${primaryButtonClasses} flex-1`} disabled={loading || !selectedFolder}>
            {loading ? 'Moving...' : 'Move Here'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkMoveToFolderModal;