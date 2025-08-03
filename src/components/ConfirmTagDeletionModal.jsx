import React from 'react';

const ConfirmTagDeletionModal = ({ onClose, tagToDelete, onConfirm, loading }) => {
  const commonButtonClasses = "py-3 px-6 rounded-xl font-semibold transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  const primaryButtonClasses = "bg-red-100 text-red-700 hover:bg-red-200 border border-red-300 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2";
  const secondaryButtonClasses = "bg-bg-secondary text-text-secondary hover:bg-gray-200 border border-border-color focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"; // Use theme variables

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
          Delete Tag "{tagToDelete}"?
        </h2>

        <p className="text-text-secondary text-center mb-6"> {/* Use text-text-secondary */}
          This will remove the tag "<span className="font-bold">{tagToDelete}</span>" from ALL bookmarks that currently have it.
          This action cannot be undone.
        </p>

        <div className="flex gap-4 mt-6">
          <button onClick={onClose} className={`${secondaryButtonClasses} ${commonButtonClasses} flex-1`} disabled={loading}>
            Cancel
          </button>
          <button onClick={onConfirm} className={`${primaryButtonClasses} ${commonButtonClasses} flex-1`} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete Tag'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmTagDeletionModal;