import React, { useState } from 'react';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore'; // Added updateDoc
import { useAuth } from '../contexts/AuthContext';

const icons = {
  folder: '📁',
};

const AddFolderModal = ({ onClose, initialFolder }) => { // Corrected component definition
  const { currentUser } = useAuth();
  const [folderName, setFolderName] = useState(initialFolder?.name || ''); // Initialize with existing name
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const commonInputClasses = "w-full p-3 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 transition duration-200 bg-bg-primary text-text-primary"; // Use theme variables
  const primaryButtonClasses = "w-full py-3 px-6 rounded-xl font-semibold bg-gradient-to-r from-accent-start to-white text-white hover:from-purple-700 hover:to-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:ring-offset-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"; // Changed text-text-primary to text-white
  const secondaryButtonClasses = "w-full py-3 px-6 rounded-xl text-text-secondary font-semibold bg-bg-secondary hover:bg-gray-200 border border-border-color focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"; // Use theme variables

  const handleSaveFolder = async () => {
    setError('');
    if (!folderName.trim()) {
      setError('Folder name cannot be empty.');
      return;
    }
    if (!currentUser) {
      setError('You must be logged in to create/edit folders.');
      return;
    }

    setLoading(true);
    try {
      if (initialFolder) {
        // Update existing folder
        const folderRef = doc(db, 'users', currentUser.uid, 'folders', initialFolder.id);
        await updateDoc(folderRef, {
          name: folderName.trim(),
          updatedAt: serverTimestamp(),
        });
        console.log("Folder updated successfully!");
      } else {
        // Add new folder
        await addDoc(collection(db, 'users', currentUser.uid, 'folders'), {
          name: folderName.trim(),
          parentId: initialFolder?.parentId || null, // Use parentId from initialFolder if creating subfolder
          order: 0, // Placeholder for future custom ordering
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        console.log("Folder added successfully!");
      }
      onClose(); // Close modal on success
    } catch (e) {
      console.error("Error saving folder: ", e);
      setError('Failed to save folder. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-bg-primary rounded-xl p-8 shadow-2xl max-w-sm w-full relative"> {/* Use bg-bg-primary */}
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-text-primary text-2xl font-bold" // Use theme variables
          aria-label="Close"
          disabled={loading}
        >
          &times;
        </button>

        <h2 className="text-2xl font-bold text-center text-text-primary mb-6"> {/* Use text-text-primary */}
          {initialFolder ? 'Rename Folder' : 'Create New Folder'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label htmlFor="folder-name" className="sr-only">Folder Name</label>
          <input
            type="text"
            id="folder-name"
            placeholder="Enter folder name"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            className={commonInputClasses}
            required
            disabled={loading}
          />
        </div>

        <div className="flex gap-4">
          <button onClick={onClose} className={secondaryButtonClasses} disabled={loading}>
            Cancel
          </button>
          <button onClick={handleSaveFolder} className={primaryButtonClasses} disabled={loading}>
            {loading ? (initialFolder ? 'Renaming...' : 'Creating...') : (initialFolder ? 'Rename Folder' : 'Create Folder')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddFolderModal;