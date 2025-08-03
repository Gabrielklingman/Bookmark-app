import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/config';
import { doc, updateDoc, writeBatch, arrayRemove, arrayUnion } from 'firebase/firestore';
import RenameTagModal from './RenameTagModal';
import ConfirmTagDeletionModal from './ConfirmTagDeletionModal';

const icons = {
  rename: '✍️',
  delete: '🗑️',
};

const ManageTagsModal = ({ onClose, uniqueTags, bookmarks }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [tagToRename, setTagToRename] = useState(null);
  const [showConfirmDeleteTagModal, setShowConfirmDeleteTagModal] = useState(false);
  const [tagToDelete, setTagToDelete] = useState(null);

  const handleRenameTag = async (oldTag, newTag) => {
    setError('');
    if (!newTag.trim()) {
      setError('New tag name cannot be empty.');
      return;
    }
    if (newTag === oldTag) {
      onCloseRenameModal();
      return; // No change
    }
    if (uniqueTags.includes(newTag)) {
      setError(`Tag "${newTag}" already exists.`);
      return;
    }

    setLoading(true);
    try {
      const batch = writeBatch(db);
      bookmarks.forEach(bookmark => {
        if (bookmark.tags && bookmark.tags.includes(oldTag)) {
          const bookmarkRef = doc(db, 'users', currentUser.uid, 'bookmarks', bookmark.id);
          batch.update(bookmarkRef, {
            tags: arrayRemove(oldTag)
          });
          batch.update(bookmarkRef, {
            tags: arrayUnion(newTag.trim())
          });
        }
      });
      await batch.commit();
      console.log(`Tag "${oldTag}" renamed to "${newTag}" successfully.`);
      onCloseRenameModal();
    } catch (e) {
      console.error("Error renaming tag: ", e);
      setError('Failed to rename tag. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTag = async (tag) => {
    setError('');
    setLoading(true);
    try {
      const batch = writeBatch(db);
      bookmarks.forEach(bookmark => {
        if (bookmark.tags && bookmark.tags.includes(tag)) {
          const bookmarkRef = doc(db, 'users', currentUser.uid, 'bookmarks', bookmark.id);
          batch.update(bookmarkRef, {
            tags: arrayRemove(tag)
          });
        }
      });
      await batch.commit();
      console.log(`Tag "${tag}" deleted successfully from all bookmarks.`);
      onCloseConfirmDeleteTagModal();
    } catch (e) {
      console.error("Error deleting tag: ", e);
      setError('Failed to delete tag. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onCloseRenameModal = () => {
    setShowRenameModal(false);
    setTagToRename(null);
    setError(''); // Clear error when closing
  };

  const onCloseConfirmDeleteTagModal = () => {
    setShowConfirmDeleteTagModal(false);
    setTagToDelete(null);
    setError(''); // Clear error when closing
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-bg-primary rounded-xl p-8 shadow-2xl max-w-2xl w-full relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-text-primary text-2xl font-bold"
          aria-label="Close"
          disabled={loading}
        >
          &times;
        </button>

        <h2 className="text-3xl font-bold text-center text-text-primary mb-8">
          Manage Tags
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center text-text-secondary mb-4">
            Performing tag operation...
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-text-primary mb-3">All Unique Tags ({uniqueTags.length})</h3>
          {uniqueTags.length > 0 ? (
            <div className="flex flex-wrap gap-3 max-h-64 overflow-y-auto custom-scrollbar p-1 -m-1">
              {uniqueTags.map(tag => (
                <div
                  key={tag}
                  className="flex items-center bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-full font-medium group relative"
                >
                  <span>{tag}</span>
                  <div className="ml-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => { setTagToRename(tag); setShowRenameModal(true); }}
                      className="p-1 rounded-full hover:bg-purple-200 text-purple-700"
                      title="Rename Tag"
                      disabled={loading}
                    >
                      {icons.rename}
                    </button>
                    <button
                      onClick={() => { setTagToDelete(tag); setShowConfirmDeleteTagModal(true); }}
                      className="p-1 rounded-full hover:bg-red-200 text-red-700"
                      title="Delete Tag"
                      disabled={loading}
                    >
                      {icons.delete}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-secondary text-sm p-3">No tags found across your bookmarks yet.</p>
          )}
        </div>

        <div className="flex justify-center mt-6">
          <button
            onClick={onClose}
            className="py-3 px-6 rounded-xl text-text-secondary font-semibold bg-bg-secondary hover:bg-gray-200 border border-border-color focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition duration-200"
          >
            Done
          </button>
        </div>
      </div>

      {showRenameModal && (
        <RenameTagModal
          oldTag={tagToRename}
          onRename={handleRenameTag}
          onClose={onCloseRenameModal}
          loading={loading}
          error={error}
        />
      )}

      {showConfirmDeleteTagModal && (
        <ConfirmTagDeletionModal
          tagToDelete={tagToDelete}
          onConfirm={() => handleDeleteTag(tagToDelete)}
          onClose={onCloseConfirmDeleteTagModal}
          loading={loading}
        />
      )}
    </div>
  );
};

export default ManageTagsModal;