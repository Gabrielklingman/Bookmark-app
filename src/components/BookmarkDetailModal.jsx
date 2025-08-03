import React, { useEffect, useRef } from 'react';

const BookmarkDetailModal = ({ bookmark, onClose, onEdit }) => {
  if (!bookmark) return null;

  const modalContentRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // If the click is outside the modal content, close the modal
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

  const { title, url, textContent, notes, tags, isFavorite, type, createdAt, updatedAt } = bookmark;

  const commonButtonClasses = "py-2 px-4 rounded-lg font-medium transition duration-200";
  const primaryButtonClasses = "bg-gradient-to-r from-accent-start to-white text-white hover:from-purple-700 hover:to-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:ring-offset-2";
  const secondaryButtonClasses = "bg-bg-secondary text-text-secondary hover:bg-gray-200 border border-border-color focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2";

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp instanceof Date ? timestamp : (timestamp.toDate ? timestamp.toDate() : new Date(timestamp));
    return date.toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div ref={modalContentRef} className="bg-bg-primary rounded-xl p-8 shadow-2xl max-w-2xl w-full relative my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-text-primary text-2xl font-bold"
          aria-label="Close"
        >
          &times;
        </button>

        <h2 className="text-3xl font-bold text-center text-text-primary mb-8">
          Bookmark Details
        </h2>

        <div className="space-y-6">
          {/* Title */}
          <div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">Title</h3>
            <p className="text-text-secondary bg-bg-secondary p-3 rounded-lg border border-border-color">{title || 'No title provided'}</p>
          </div>

          {/* URL / Text Content */}
          {type === 'link' && url && (
            <div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">URL</h3>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-600 hover:underline bg-bg-secondary p-3 rounded-lg border border-border-color break-words"
              >
                {url}
              </a>
            </div>
          )}
          {type === 'text' && textContent && (
            <div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">Content</h3>
              <div className="text-text-secondary bg-bg-secondary p-3 rounded-lg border border-border-color whitespace-pre-wrap max-h-60 overflow-y-auto custom-scrollbar">
                {textContent}
              </div>
            </div>
          )}

          {/* Notes */}
          {notes && (
            <div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">Notes</h3>
              <div className="text-text-secondary bg-bg-secondary p-3 rounded-lg border border-border-color whitespace-pre-wrap max-h-40 overflow-y-auto custom-scrollbar">
                {notes}
              </div>
            </div>
          )}

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span key={tag} className="bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-full font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center gap-4">
            <span className="text-text-primary font-semibold">Favorite:</span>
            <span className={`text-2xl ${isFavorite ? 'text-yellow-500' : 'text-text-secondary'}`}>
              {isFavorite ? '🌟' : '⭐'}
            </span>
          </div>

          {/* Timestamps */}
          <div className="text-sm text-text-secondary space-y-1">
            <p>Created: {formatDate(createdAt)}</p>
            <p>Last Updated: {formatDate(updatedAt)}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <button onClick={onClose} className={`${secondaryButtonClasses} flex-1`}>
            Close
          </button>
          <button onClick={() => onEdit(bookmark)} className={`${primaryButtonClasses} flex-1`}>
            Edit Bookmark
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookmarkDetailModal;