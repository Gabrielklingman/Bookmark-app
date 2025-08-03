import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/config';
import { collection, getDocs, writeBatch, doc, serverTimestamp } from 'firebase/firestore';

const DataManagementModal = ({ onClose }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const commonButtonClasses = "py-3 px-6 rounded-xl font-semibold transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  const primaryButtonClasses = "bg-gradient-to-r from-accent-start to-white text-white hover:from-purple-700 hover:to-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:ring-offset-2"; // Changed text-text-primary to text-white
  const secondaryButtonClasses = "bg-bg-secondary text-text-secondary hover:bg-gray-200 border border-border-color focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2";

  const exportData = async () => {
    setError('');
    setSuccessMessage('');
    if (!currentUser) {
      setError('You must be logged in to export data.');
      return;
    }
    setLoading(true);
    try {
      const bookmarksSnapshot = await getDocs(collection(db, 'users', currentUser.uid, 'bookmarks'));
      const foldersSnapshot = await getDocs(collection(db, 'users', currentUser.uid, 'folders'));

      const bookmarks = bookmarksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const folders = foldersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const dataToExport = { bookmarks, folders };
      const jsonString = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `auramark_data_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccessMessage('Data exported successfully as JSON!');
    } catch (e) {
      console.error("Error exporting data:", e);
      setError('Failed to export data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const importData = async (event) => {
    setError('');
    setSuccessMessage('');
    if (!currentUser) {
      setError('You must be logged in to import data.');
      return;
    }
    const file = event.target.files[0];
    if (!file) {
      return;
    }
    if (file.type !== 'application/json') {
      setError('Please upload a JSON file.');
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        const { bookmarks, folders } = importedData;

        if (!Array.isArray(bookmarks) || !Array.isArray(folders)) {
          throw new Error('Invalid JSON structure. Expected "bookmarks" and "folders" arrays.');
        }

        const batch = writeBatch(db);
        const userBookmarksRef = collection(db, 'users', currentUser.uid, 'bookmarks');
        const userFoldersRef = collection(db, 'users', currentUser.uid, 'folders');

        // Import folders first to ensure parentId references are valid
        for (const folder of folders) {
          const folderRef = doc(userFoldersRef, folder.id); // Use original ID for consistency
          const { id, ...data } = folder;
          // Convert Firestore Timestamps back to Date objects if they are plain objects
          if (data.createdAt && data.createdAt._seconds) data.createdAt = new Date(data.createdAt._seconds * 1000);
          if (data.updatedAt && data.updatedAt._seconds) data.updatedAt = new Date(data.updatedAt._seconds * 1000);
          batch.set(folderRef, { ...data, updatedAt: serverTimestamp() }, { merge: true }); // Merge to avoid overwriting existing fields
        }

        // Import bookmarks
        for (const bookmark of bookmarks) {
          const bookmarkRef = doc(userBookmarksRef, bookmark.id); // Use original ID for consistency
          const { id, ...data } = bookmark;
          // Convert Firestore Timestamps back to Date objects if they are plain objects
          if (data.createdAt && data.createdAt._seconds) data.createdAt = new Date(data.createdAt._seconds * 1000);
          if (data.updatedAt && data.updatedAt._seconds) data.updatedAt = new Date(data.updatedAt._seconds * 1000);
          batch.set(bookmarkRef, { ...data, updatedAt: serverTimestamp() }, { merge: true }); // Merge to avoid overwriting existing fields
        }

        await batch.commit();
        setSuccessMessage('Data imported successfully!');
        event.target.value = ''; // Clear file input
      } catch (err) {
        console.error("Error importing data:", err);
        setError(`Failed to import data: ${err.message}. Please check file format.`);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-bg-primary rounded-xl p-8 shadow-2xl max-w-md w-full relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-text-primary text-2xl font-bold"
          aria-label="Close"
          disabled={loading}
        >
          &times;
        </button>

        <h2 className="text-3xl font-bold text-center text-text-primary mb-8">
          Data Management
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 border border-green-200 rounded-lg text-green-700 text-sm">
            {successMessage}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-text-primary mb-3">Export Data</h3>
            <p className="text-text-secondary text-sm mb-4">
              Download all your bookmarks and folders as a JSON file.
            </p>
            <button
              onClick={exportData}
              className={`${primaryButtonClasses} ${commonButtonClasses} w-full`}
              disabled={loading}
            >
              {loading ? 'Exporting...' : 'Export as JSON'}
            </button>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-text-primary mb-3">Import Data</h3>
            <p className="text-text-secondary text-sm mb-4">
              Upload a JSON file to import bookmarks and folders. Existing items with matching IDs will be updated.
            </p>
            <label htmlFor="import-file" className={`${secondaryButtonClasses} ${commonButtonClasses} w-full text-center cursor-pointer block`}>
              {loading ? 'Importing...' : 'Choose JSON File'}
              <input
                type="file"
                id="import-file"
                accept="application/json"
                onChange={importData}
                className="hidden"
                disabled={loading}
              />
            </label>
          </div>
        </div>

        <div className="flex justify-center mt-8">
          <button onClick={onClose} className={`${secondaryButtonClasses} ${commonButtonClasses} w-full`}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataManagementModal;