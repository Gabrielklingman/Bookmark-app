import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

const BookmarkCard = ({ bookmark, onToggleFavorite, onRestore, onDeletePermanently, isInTrashView, onContextMenu, onClick }) => {
  const { title, notes, thumbnail, isFavorite, type, id, tags } = bookmark;

  // Make the card draggable
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: id, // Use the bookmark's ID as the draggable ID
    data: { type: 'bookmark', bookmarkId: id }, // Add type for bookmarks
    disabled: isInTrashView, // Disable dragging if in trash view
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: 'transform 0.2s ease-in-out', // Smooth transition for dragging
    zIndex: isDragging ? 10 : 1, // Bring dragged item to front
  };

  // Truncate notes for snippet display
  const notesSnippet = notes && notes.length > 100 ? notes.substring(0, 97) + '...' : notes;

  // The handlePreviewClick function is no longer needed as the preview area is removed.
  // However, if the user clicks on the card, it should still open the detail modal.
  // The main onClick handler on the card div will handle this.

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onContextMenu={onContextMenu} // Attach context menu handler
      onClick={() => onClick(bookmark)} // Attach onClick handler to open details for the rest of the card
      className={`bg-bg-primary rounded-xl shadow-custom-subtle p-4
                    ${isInTrashView ? 'cursor-default' : 'cursor-pointer'}
                    hover:shadow-lg hover:scale-[1.01] transition-all duration-200 ease-in-out
                    flex flex-col
                    ${isDragging ? 'opacity-50 border-2 border-accent-start' : ''}
                    `}>
      {/* Removed Content Preview Area */}

      {/* Title */}
      <h3 className="text-lg font-semibold text-text-primary mb-1 line-clamp-2">
        {title}
      </h3>

      {/* Notes Snippet */}
      {notes && (
        <p className="text-sm text-text-secondary mb-3 flex-grow line-clamp-3">
          {notesSnippet}
        </p>
      )}

      {/* Tags Display */}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {tags.map(tag => (
            <span key={tag} className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-medium">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Icons / Trash Actions */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-border-color">
        {isInTrashView ? (
          <div className="flex gap-2 w-full">
            <button
              onClick={(e) => { e.stopPropagation(); onRestore(id); }} // Stop propagation
              className="flex-1 py-2 px-3 rounded-lg bg-green-100 text-green-700 text-sm font-medium hover:bg-green-200 transition-colors duration-150"
            >
              Restore
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDeletePermanently(id); }} // Stop propagation
              className="flex-1 py-2 px-3 rounded-lg bg-red-100 text-red-700 text-sm font-medium hover:bg-red-200 transition-colors duration-150"
            >
              Delete
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            {/* Favorite Icon - now clickable */}
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent card click when clicking icon
                onToggleFavorite(id, !isFavorite);
              }}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors duration-150"
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              {isFavorite ? (
                <span className="text-yellow-500 text-xl">🌟</span>
              ) : (
                <span className="text-text-secondary text-xl">⭐</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookmarkCard;