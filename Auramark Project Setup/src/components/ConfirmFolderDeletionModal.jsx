import React, { useState } from 'react';

const ConfirmFolderDeletionModal = ({ onClose, folderName, bookmarkCount, onConfirmAction, loading }) => {
  const commonButtonClasses = "py-3 px-6 rounded-xl font-semibold transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  const primaryButtonClasses = "bg-gradient-to-r from-accent-start to-white text-white hover:from-purple-700 hover:to-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:ring-offset-2"; // Changed text-text-primary to text-white
  const secondaryButtonClasses = "bg-bg-secondary text-text-secondary hover:bg-gray-200 border border-border-color focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"; // Use theme variables
  const dangerButtonClasses = "bg-red-100 text-red-700 hover:bg-red-200 border border-red-300 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-bg-primary rounded-xl p-8 shadow-2xl max-w-md w-full relative"> {/* Use bg-bg-primary */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-text-primary text-2xl font-bold" // Use theme variables
          aria-label="Close"
          disabled={loading}
        >
          &times;
        </button>

        <h2 className="text-2xl font-bold text-center text-text-primary mb-6"> {/* Use text-text-primary */}
          Delete Folder: "{folderName}"
        </h2>

        <p className="text-text-secondary text-center mb-6"> {/* Use text-text-secondary */}
          This folder contains <span className="font-bold">{bookmarkCount} bookmark{bookmarkCount !== 1 ? 's' : ''}</span>.
          What would you like to do with them?
        </p>

        <div className="space-y-4 mb-6">
          <button
            onClick={() => onConfirmAction('trash')}
            className={`${primaryButtonClasses} ${commonButtonClasses} w-full`}
            disabled={loading}
          >
            Move to Trash
          </button>
          <button
            onClick={() => onConfirmAction('root')}
            className={`${secondaryButtonClasses} ${commonButtonClasses} w-full`}
            disabled={loading}
          >
            Move to All Bookmarks
          </button>
          <button
            onClick={() => onConfirmAction('delete')}
            className={`${dangerButtonClasses} ${commonButtonClasses} w-full`}
            disabled={loading}
          >
            Delete Permanently <span className="text-xs">(Cannot be undone)</span>
          </button>
        </div>

        <div className="flex justify-center">
          <button onClick={onClose} className={`${secondaryButtonClasses} ${commonButtonClasses} w-full`}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmFolderDeletionModal;