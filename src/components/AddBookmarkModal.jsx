import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase/config';
import { collection, addDoc, updateDoc, serverTimestamp, doc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

// Placeholder icons (text-based)
const icons = {
  link: '🔗',
  text: '📝',
  starOutline: '⭐',
  starFilled: '🌟',
  folder: '📁',
  newFolder: '➕ Folder',
  tag: '🏷️',
  addTag: '➕',
};

const AddBookmarkModal = ({ onClose, folders, onNewFolderClick, initialBookmark }) => {
  const { currentUser } = useAuth();

  const [contentType, setContentType] = useState('link'); // 'link' or 'text'
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedFolder, setSelectedFolder] = useState(null); // Stores folder ID
  const [currentTagInput, setCurrentTagInput] = useState('');
  const [addedTags, setAddedTags] = useState([]);
  // Removed isFavorite state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Ref for the modal content area
  const modalContentRef = useRef(null);

  // Dummy Data for Recently Used Tags (Folders now come from props)
  const recentlyUsedTags = ['React', 'TailwindCSS', 'Firebase', 'Productivity', 'Reading', 'WebDev'];

  // Populate form fields if an initialBookmark is provided (for editing)
  useEffect(() => {
    if (initialBookmark) {
      setContentType(initialBookmark.type || 'link');
      setUrl(initialBookmark.url || '');
      setTitle(initialBookmark.title || '');
      setTextContent(initialBookmark.textContent || '');
      setNotes(initialBookmark.notes || '');
      setSelectedFolder(initialBookmark.folderId || null);
      setAddedTags(initialBookmark.tags || []);
      // Removed setIsFavorite from initialBookmark logic
    }
  }, [initialBookmark]);

  // Effect to handle clicks outside the modal and Escape key press
  useEffect(() => {
    const handleClickOutside = (event) => {
      // If the click is outside the modal content and not on the "Add New Bookmark" FAB
      // (which might trigger the modal to open, but we want to close it if it's already open)
      if (modalContentRef.current && !modalContentRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    // Add event listeners when the modal is open
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    // Clean up event listeners when the component unmounts
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onClose]); // Re-run effect if onClose changes (though it's usually stable)


  const commonInputClasses = "w-full p-3 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 transition duration-200 bg-bg-primary text-text-primary"; // Use theme variables
  const primaryButtonClasses = "w-full py-3 px-6 rounded-xl font-semibold bg-gradient-to-r from-accent-start to-accent-end text-white hover:from-blue-700 hover:to-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"; // Changed text-text-primary to text-white
  const secondaryButtonClasses = "w-full py-3 px-6 rounded-xl text-text-secondary font-semibold bg-bg-secondary hover:bg-gray-200 border border-border-color focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"; // Use theme variables

  const handleAddTag = (tag) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !addedTags.includes(trimmedTag)) {
      setAddedTags([...addedTags, trimmedTag]);
      setCurrentTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setAddedTags(addedTags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = async () => {
    setError('');
    setLoading(true);

    if (!currentUser) {
      setError('You must be logged in to add/edit bookmarks.');
      setLoading(false);
      return;
    }

    // Basic validation
    if (contentType === 'link' && !url.trim()) {
      setError('URL is required for link bookmarks.');
      setLoading(false);
      return;
    }
    if (contentType === 'text' && !textContent.trim()) {
      setError('Text content is required for text bookmarks.');
      setLoading(false);
      return;
    }
    if (!title.trim() && !url.trim() && !textContent.trim()) {
      setError('Title or content is required.');
      setLoading(false);
      return;
    }

    const bookmarkData = {
      userId: currentUser.uid,
      type: contentType,
      title: title.trim() || (contentType === 'link' ? url.trim() : textContent.trim().substring(0, 50) + '...'),
      notes: notes.trim(),
      isFavorite: false, // Default to false as the favorite option is removed
      folderId: selectedFolder,
      tags: addedTags,
      updatedAt: serverTimestamp(),
    };

    if (contentType === 'link') {
      bookmarkData.url = url.trim();
      // Removed thumbnail generation/setting
    } else {
      bookmarkData.textContent = textContent.trim();
      // Removed thumbnail setting
    }

    try {
      if (initialBookmark) {
        const bookmarkRef = doc(db, 'users', currentUser.uid, 'bookmarks', initialBookmark.id);
        await updateDoc(bookmarkRef, bookmarkData);
        console.log("Bookmark updated successfully!");
      } else {
        bookmarkData.createdAt = serverTimestamp();
        await addDoc(collection(db, 'users', currentUser.uid, 'bookmarks'), bookmarkData);
        console.log("Bookmark added successfully!");
      }
      onClose();
    } catch (e) {
      console.error("Error saving bookmark: ", e);
      setError('Failed to save bookmark. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div ref={modalContentRef} className="bg-bg-primary rounded-xl p-8 shadow-2xl max-w-2xl w-full relative my-8"> {/* Use bg-bg-primary */}
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-text-primary text-2xl font-bold" // Use theme variables
          aria-label="Close"
          disabled={loading}
        >
          &times;
        </button>

        <h2 className="text-3xl font-bold text-center text-text-primary mb-8"> {/* Use text-text-primary */}
          {initialBookmark ? 'Edit Bookmark' : 'Add New Bookmark'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Input Type Selection */}
        <div className="mb-6">
          <label className="block text-text-primary text-sm font-medium mb-2">Content Type</label> {/* Use text-text-primary */}
          <div className="flex gap-4">
            <button
              onClick={() => setContentType('link')}
              className={`flex-1 p-4 rounded-xl border-2 transition duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''} ${contentType === 'link' ? 'border-accent-start bg-blue-50 shadow-md' : 'border-border-color bg-bg-secondary hover:bg-gray-100'}`} // Use theme variables
              disabled={loading}
            >
              <span className="text-3xl mb-2 block">{icons.link}</span>
              <span className="font-semibold text-text-primary">Link</span> {/* Use text-text-primary */}
            </button>
            <button
              onClick={() => setContentType('text')}
              className={`flex-1 p-4 rounded-xl border-2 transition duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''} ${contentType === 'text' ? 'border-accent-start bg-blue-50 shadow-md' : 'border-border-color bg-bg-secondary hover:bg-gray-100'}`} // Use theme variables
              disabled={loading}
            >
              <span className="text-3xl mb-2 block">{icons.text}</span>
              <span className="font-semibold text-text-primary">Text</span> {/* Use text-text-primary */}
            </button>
          </div>
        </div>

        {/* Content Input Forms */}
        <div className="space-y-4 mb-6">
          {contentType === 'link' && (
            <div className="relative">
              <label htmlFor="bookmark-url" className="sr-only">URL</label>
              <input
                type="url"
                id="bookmark-url"
                placeholder="URL (e.g., https://example.com)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className={commonInputClasses}
                required
                disabled={loading}
              />
            </div>
          )}
          <div>
            <label htmlFor="bookmark-title" className="sr-only">Title (Optional)</label>
            <input
              type="text"
              id="bookmark-title"
              placeholder="Title (Optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={commonInputClasses}
              disabled={loading}
            />
          </div>
          {contentType === 'text' && (
            <div>
              <label htmlFor="bookmark-text-content" className="sr-only">Text Content</label>
              <textarea
                id="bookmark-text-content"
                placeholder="Your text content here..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className={`${commonInputClasses} h-32 resize-y`}
                required
                disabled={loading}
              ></textarea>
            </div>
          )}
        </div>

        {/* Notes Field - Conditionally rendered */}
        {contentType !== 'link' && (
          <div className="mb-6">
            <label htmlFor="bookmark-notes" className="sr-only">Notes/Description (Optional)</label>
            <textarea
              id="bookmark-notes"
              placeholder="Notes/Description (Optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`${commonInputClasses} h-24 resize-y`}
              disabled={loading}
            ></textarea>
          </div>
        )}

        {/* Folder Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-text-primary mb-3">Add to Folder</h3> {/* Use text-text-primary */}
          <input
            type="text"
            placeholder="Search folders..."
            className={`${commonInputClasses} mb-3`}
            disabled={loading}
          />
          <div className="flex flex-wrap gap-3 max-h-32 overflow-y-auto custom-scrollbar p-1 -m-1">
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => setSelectedFolder(folder.id === selectedFolder ? null : folder.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition duration-200 text-sm font-medium ${loading ? 'opacity-50 cursor-not-allowed' : ''} ${selectedFolder === folder.id ? 'border-accent-start bg-blue-50 text-blue-800 shadow-sm' : 'border-border-color bg-bg-secondary text-text-secondary hover:bg-gray-100'}`} // Use theme variables
                disabled={loading}
              >
                <span className="text-lg">{icons.folder}</span>
                <span>{folder.name}</span>
              </button>
            ))}
            <button
              onClick={onNewFolderClick}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 border-dashed border-border-color text-text-secondary hover:bg-gray-100 transition duration-200 text-sm font-medium ${loading ? 'opacity-50 cursor-not-allowed' : ''}`} // Use theme variables
              disabled={loading}
            >
              <span className="text-lg">{icons.newFolder}</span>
              <span>New Folder</span>
            </button>
          </div>
        </div>

        {/* Tagging Option */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-text-primary mb-3">Add Tags</h3> {/* Use text-text-primary */}
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
            {addedTags.map((tag) => (
              <span
                key={tag}
                className="flex items-center bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full font-medium cursor-pointer hover:bg-blue-200 transition duration-200"
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

        {/* Removed Status Toggles - Only Favorite */}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button onClick={onClose} className={secondaryButtonClasses} disabled={loading}>
            Cancel
          </button>
          <button onClick={handleSave} className={primaryButtonClasses} disabled={loading}>
            {loading ? (initialBookmark ? 'Updating...' : 'Saving...') : (initialBookmark ? 'Update Bookmark' : 'Save Bookmark')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddBookmarkModal;