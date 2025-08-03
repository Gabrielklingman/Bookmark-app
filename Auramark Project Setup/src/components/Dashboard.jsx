import React, { useState, useEffect, useMemo } from 'react';
import BookmarkCard from './BookmarkCard';
import AddBookmarkModal from './AddBookmarkModal';
import AddFolderModal from './AddFolderModal';
import FolderItem from './FolderItem';
import ContextMenu from './ContextMenu';
import BulkMoveToFolderModal from './BulkMoveToFolderModal';
import BulkAddTagsModal from './BulkAddTagsModal';
import ConfirmFolderDeletionModal from './ConfirmFolderDeletionModal';
import ManageTagsModal from './ManageTagsModal';
import BookmarkDetailModal from './BookmarkDetailModal'; // New import
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/config';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, writeBatch, arrayUnion, arrayRemove, addDoc, serverTimestamp } from 'firebase/firestore'; // Added addDoc, serverTimestamp
import { useDroppable } from '@dnd-kit/core';

// Simple icon placeholders (text-based)
const icons = {
  allBookmarks: '📚',
  favorites: '⭐',
  recent: '⏰',
  trash: '🗑️',
  tags: '🏷️',
  plus: '+',
  logout: '🚪',
  folder: '📁',
  addFolder: '➕ Folder', // Still used for context menu option
  edit: '✏️',
  move: '➡️',
  favorite: '⭐',
  unfavorite: '⭐', // Using the same star for now, or could use an outline star emoji if available
  addTag: '➕ Tag',
  delete: '🗑️',
  rename: '✍️',
  createSubfolder: '➕ Subfolder',
  cancel: '✖️',
  manageTags: '⚙️',
  clearSearch: '✖️',
  settings: '⚙️',
  darkMode: '🌙',
  lightMode: '☀️',
};

// Recursive component to render folder tree
const FolderTree = ({ folders, parentId = null, activeFolder, setActiveFolder, level = 0, onContextMenu }) => {
  const nestedFolders = folders.filter(folder => folder.parentId === parentId);

  return (
    <>
      {nestedFolders.map(folder => (
        <React.Fragment key={folder.id}>
          <FolderItem
            folder={folder}
            activeFolder={activeFolder}
            setActiveFolder={setActiveFolder}
            level={level}
            onContextMenu={onContextMenu}
          />
          {/* Recursively render children */}
          <FolderTree
            folders={folders}
            parentId={folder.id}
            activeFolder={activeFolder}
            setActiveFolder={setActiveFolder}
            level={level + 1}
            onContextMenu={onContextMenu}
          />
        </React.Fragment>
      ))}
    </>
  );
};

const Dashboard = ({ isDarkMode, toggleDarkMode }) => {
  const [activeFolder, setActiveFolder] = useState('All Bookmarks');
  const [showAddBookmarkModal, setShowAddBookmarkModal] = useState(false);
  const [showAddFolderModal, setShowAddFolderModal] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [customFolders, setCustomFolders] = useState([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(true);
  const [loadingFolders, setLoadingFolders] = useState(true);
  const [recentTimeframe, setRecentTimeframe] = useState('24h');
  const [bookmarkToEdit, setBookmarkToEdit] = useState(null);
  const [folderToEdit, setFolderToEdit] = useState(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, options: [], data: null });

  // States for bulk actions
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedBookmarkIds, setSelectedBookmarkIds] = useState([]);
  const [showBulkMoveModal, setShowBulkMoveModal] = useState(false);
  const [showBulkAddTagsModal, setShowBulkAddTagsModal] = useState(false);

  // New states for advanced folder deletion
  const [showConfirmFolderDeletionModal, setShowConfirmFolderDeletionModal] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState(null);

  // New states for tag management
  const [showManageTagsModal, setShowManageTagsModal] = useState(false);

  // New state for search functionality
  const [searchTerm, setSearchTerm] = useState('');

  // Removed state for data management modal
  // const [showDataManagementModal, setShowDataManagementModal] = useState(false);

  // New state for bookmark detail modal
  const [showBookmarkDetailModal, setShowBookmarkDetailModal] = useState(false);
  const [selectedBookmarkForDetail, setSelectedBookmarkForDetail] = useState(null);

  // New state for inline folder creation
  const [newFolderName, setNewFolderName] = useState('');
  const [folderCreationError, setFolderCreationError] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const { currentUser, logout } = useAuth();

  // Fetch bookmarks from Firestore in real-time
  useEffect(() => {
    if (!currentUser) {
      setBookmarks([]);
      setLoadingBookmarks(false);
      return;
    }

    setLoadingBookmarks(true);
    const bookmarksCollectionRef = collection(db, 'users', currentUser.uid, 'bookmarks');
    const q = query(bookmarksCollectionRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedBookmarks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate() : doc.data().updatedAt
      }));
      setBookmarks(fetchedBookmarks);
      setLoadingBookmarks(false);
    }, (error) => {
      console.error("Error fetching bookmarks: ", error);
      setLoadingBookmarks(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Fetch custom folders from Firestore in real-time
  useEffect(() => {
    if (!currentUser) {
      setCustomFolders([]);
      setLoadingFolders(false);
      return;
    }

    setLoadingFolders(true);
    const foldersCollectionRef = collection(db, 'users', currentUser.uid, 'folders');
    const q = query(foldersCollectionRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedFolders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCustomFolders(fetchedFolders);
      setLoadingFolders(false);
    }, (error) => {
      console.error("Error fetching folders: ", error);
      setLoadingFolders(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Derive unique tags from all bookmarks
  const uniqueTags = useMemo(() => {
    const tagsSet = new Set();
    bookmarks.forEach(bookmark => {
      if (bookmark.tags && Array.isArray(bookmark.tags)) {
        bookmark.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet).sort((a, b) => a.localeCompare(b));
  }, [bookmarks]);

  const staticFolders = [
    { name: 'All Bookmarks', icon: icons.allBookmarks, id: 'All Bookmarks' },
    { name: 'Favorites', icon: icons.favorites, id: 'Favorites' },
    { name: 'Recent', icon: icons.recent, id: 'Recent' },
    { name: 'Trash', icon: icons.trash, id: 'Trash' },
    { name: 'Tags', icon: icons.tags, id: 'Tags' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // --- Bookmark Actions ---
  const toggleFavorite = async (bookmarkId, currentFavoriteStatus) => {
    if (!currentUser) return;
    try {
      const bookmarkRef = doc(db, 'users', currentUser.uid, 'bookmarks', bookmarkId);
      await updateDoc(bookmarkRef, { isFavorite: currentFavoriteStatus });
    } catch (error) { console.error("Error toggling favorite status:", error); }
  };

  const restoreBookmark = async (bookmarkId) => {
    if (!currentUser) return;
    try {
      const bookmarkRef = doc(db, 'users', currentUser.uid, 'bookmarks', bookmarkId);
      await updateDoc(bookmarkRef, { isTrashed: false, folderId: null });
    } catch (error) { console.error("Error restoring bookmark:", error); }
  };

  const deleteBookmarkPermanently = async (bookmarkId) => {
    if (!currentUser) return;
    if (window.confirm("Are you sure you want to permanently delete this bookmark? This action cannot be undone.")) {
      try {
        const bookmarkRef = doc(db, 'users', currentUser.uid, 'bookmarks', bookmarkId);
        await deleteDoc(bookmarkRef);
      } catch (error) { console.error("Error deleting bookmark permanently:", error); }
    }
  };

  const moveBookmarkToTrash = async (bookmarkId) => {
    if (!currentUser) return;
    try {
      const bookmarkRef = doc(db, 'users', currentUser.uid, 'bookmarks', bookmarkId);
      await updateDoc(bookmarkRef, { isTrashed: true, folderId: null });
    } catch (error) { console.error("Error moving bookmark to trash:", error); }
  };

  const handleEditBookmark = (bookmark) => {
    setBookmarkToEdit(bookmark);
    setShowAddBookmarkModal(true);
    setShowBookmarkDetailModal(false); // Close detail modal if open
  };

  // --- Bookmark Detail Modal Handlers ---
  const handleOpenBookmarkDetail = (bookmark) => {
    setSelectedBookmarkForDetail(bookmark);
    setShowBookmarkDetailModal(true);
  };

  const handleCloseBookmarkDetail = () => {
    setSelectedBookmarkForDetail(null);
    setShowBookmarkDetailModal(false);
  };

  // --- Folder Actions ---
  const handleRenameFolder = (folder) => {
    setFolderToEdit(folder);
    setShowAddFolderModal(true);
  };

  // Refactored handleDeleteFolder to prompt user
  const handleDeleteFolder = async (folder) => {
    if (!currentUser) return;

    const bookmarksInFolder = bookmarks.filter(b => b.folderId === folder.id);
    if (bookmarksInFolder.length > 0) {
      setFolderToDelete(folder);
      setShowConfirmFolderDeletionModal(true);
    } else {
      // If no bookmarks, proceed with simple deletion
      if (window.confirm(`Are you sure you want to delete the folder "${folder.name}"?`)) {
        await executeFolderDeletionAction(folder.id, 'delete_folder_only');
      }
    }
  };

  const executeFolderDeletionAction = async (folderId, actionType) => {
    if (!currentUser) return;

    try {
      const batch = writeBatch(db);

      // Handle bookmarks within the folder
      bookmarks.filter(b => b.folderId === folderId).forEach(bookmark => {
        const bookmarkRef = doc(db, 'users', currentUser.uid, 'bookmarks', bookmark.id);
        if (actionType === 'trash') {
          batch.update(bookmarkRef, { isTrashed: true, folderId: null });
        } else if (actionType === 'root') {
          batch.update(bookmarkRef, { isTrashed: false, folderId: null });
        } else if (actionType === 'delete') {
          batch.delete(bookmarkRef);
        }
      });

      // Move child folders out of this folder (make them root folders)
      customFolders.filter(f => f.parentId === folderId).forEach(childFolder => {
        const childFolderRef = doc(db, 'users', currentUser.uid, 'folders', childFolder.id);
        batch.update(childFolderRef, { parentId: null });
      });

      // Delete the folder itself
      const folderRef = doc(db, 'users', currentUser.uid, 'folders', folderId);
      batch.delete(folderRef);

      await batch.commit();
      console.log(`Folder ${folderId} and its contents handled by action: ${actionType}.`);
      if (activeFolder === folderId) {
        setActiveFolder('All Bookmarks'); // Redirect if current folder is deleted
      }
    } catch (error) {
      console.error("Error during folder deletion action:", error);
      alert("Failed to delete folder and/or its contents. Please try again.");
    } finally {
      setShowConfirmFolderDeletionModal(false);
      setFolderToDelete(null);
    }
  };

  const handleCreateSubfolder = (parentFolderId) => {
    setFolderToEdit({ parentId: parentFolderId });
    setShowAddFolderModal(true);
  };

  // --- Inline Folder Creation ---
  const handleCreateRootFolder = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setFolderCreationError('');
      const trimmedFolderName = newFolderName.trim();

      if (!trimmedFolderName) {
        setFolderCreationError('Folder name cannot be empty.');
        return;
      }
      if (!currentUser) {
        setFolderCreationError('You must be logged in to create folders.');
        return;
      }
      if (customFolders.some(f => f.name.toLowerCase() === trimmedFolderName.toLowerCase())) {
        setFolderCreationError('A folder with this name already exists.');
        return;
      }

      setIsCreatingFolder(true);
      try {
        await addDoc(collection(db, 'users', currentUser.uid, 'folders'), {
          name: trimmedFolderName,
          parentId: null, // Root folder
          order: 0, // Placeholder for future custom ordering
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setNewFolderName(''); // Clear input on success
        console.log("Root folder added successfully!");
      } catch (e) {
        console.error("Error creating root folder: ", e);
        setFolderCreationError('Failed to create folder. Please try again.');
      } finally {
        setIsCreatingFolder(false);
      }
    }
  };

  // --- Context Menu Handlers ---
  const handleBookmarkCardContextMenu = (event, bookmark) => {
    event.preventDefault();
    if (selectionMode) return;

    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      data: bookmark,
      options: [
        { label: 'Edit', icon: icons.edit, onClick: () => handleEditBookmark(bookmark) },
        { label: bookmark.isFavorite ? 'Unfavorite' : 'Mark as Favorite', icon: bookmark.isFavorite ? icons.unfavorite : icons.favorite, onClick: () => toggleFavorite(bookmark.id, !bookmark.isFavorite) },
        { label: 'Move to Folder', icon: icons.move, onClick: () => { setBookmarkToEdit(bookmark); setShowAddBookmarkModal(true); } },
        { label: 'Add/Remove Tags', icon: icons.addTag, onClick: () => { setBookmarkToEdit(bookmark); setShowAddBookmarkModal(true); } },
        { label: 'Move to Trash', icon: icons.delete, onClick: () => moveBookmarkToTrash(bookmark.id) },
      ],
    });
  };

  const handleFolderItemContextMenu = (event, folder) => {
    event.preventDefault();
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      data: folder,
      options: [
        { label: 'Rename', icon: icons.rename, onClick: () => handleRenameFolder(folder) },
        { label: 'Delete', icon: icons.delete, onClick: () => handleDeleteFolder(folder) }, // Pass folder object
        { label: 'Create Subfolder', icon: icons.createSubfolder, onClick: () => handleCreateSubfolder(folder.id) },
      ],
    });
  };

  const handleTagsFolderContextMenu = (event) => {
    event.preventDefault();
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      data: null, // No specific data for static folder
      options: [
        { label: 'Manage Tags', icon: icons.manageTags, onClick: () => setShowManageTagsModal(true) },
      ],
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu({ ...contextMenu, visible: false });
  };

  // --- Bulk Actions Logic ---
  const toggleSelectionMode = () => {
    setSelectionMode(prev => !prev);
    setSelectedBookmarkIds([]);
  };

  const toggleBookmarkSelection = (bookmarkId) => {
    setSelectedBookmarkIds(prev =>
      prev.includes(bookmarkId)
        ? prev.filter(id => id !== bookmarkId)
        : [...prev, bookmarkId]
    );
  };

  const handleBulkDelete = async () => {
    if (!currentUser || selectedBookmarkIds.length === 0) return;
    if (window.confirm(`Are you sure you want to move ${selectedBookmarkIds.length} selected bookmark(s) to Trash?`)) {
      const batch = writeBatch(db);
      selectedBookmarkIds.forEach(id => {
        const bookmarkRef = doc(db, 'users', currentUser.uid, 'bookmarks', id);
        batch.update(bookmarkRef, { isTrashed: true, folderId: null });
      });
      try {
        await batch.commit();
        console.log(`Moved ${selectedBookmarkIds.length} bookmarks to trash.`);
        handleCancelSelection();
      } catch (error) {
        console.error("Error during bulk delete:", error);
      }
    }
  };

  const handleCancelSelection = () => {
    setSelectionMode(false);
    setSelectedBookmarkIds([]);
  };

  // Filter bookmarks based on active folder, recent timeframe, AND search term
  const filteredBookmarks = useMemo(() => {
    let currentFiltered = bookmarks.filter(bookmark => {
      if (activeFolder === 'All Bookmarks') {
        return !bookmark.isTrashed;
      }
      if (activeFolder === 'Favorites') {
        return bookmark.isFavorite && !bookmark.isTrashed;
      }
      if (activeFolder === 'Recent') {
        if (!bookmark.createdAt) return false;

        const now = new Date();
        const bookmarkDate = bookmark.createdAt;
        let cutoffDate = new Date();

        if (recentTimeframe === '24h') {
          cutoffDate.setDate(now.getDate() - 1);
        } else if (recentTimeframe === '7d') {
          cutoffDate.setDate(now.getDate() - 7);
        } else if (recentTimeframe === '30d') {
          cutoffDate.setDate(now.getDate() - 30);
        }
        return bookmarkDate >= cutoffDate && !bookmark.isTrashed;
      }
      if (activeFolder === 'Trash') {
        return bookmark.isTrashed;
      }
      if (customFolders.some(f => f.id === activeFolder)) {
        return bookmark.folderId === activeFolder && !bookmark.isTrashed;
      }
      if (uniqueTags.includes(activeFolder)) {
        return bookmark.tags && bookmark.tags.includes(activeFolder) && !bookmark.isTrashed;
      }
      return false;
    });

    // Apply search filter if searchTerm is present
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      currentFiltered = currentFiltered.filter(bookmark => {
        const titleMatch = bookmark.title?.toLowerCase().includes(lowerCaseSearchTerm);
        const urlMatch = bookmark.url?.toLowerCase().includes(lowerCaseSearchTerm);
        const textContentMatch = bookmark.textContent?.toLowerCase().includes(lowerCaseSearchTerm);
        const notesMatch = bookmark.notes?.toLowerCase().includes(lowerCaseSearchTerm);
        const tagsMatch = bookmark.tags?.some(tag => tag.toLowerCase().includes(lowerCaseSearchTerm));

        return titleMatch || urlMatch || textContentMatch || notesMatch || tagsMatch;
      });
    }

    return currentFiltered;
  }, [bookmarks, activeFolder, recentTimeframe, customFolders, uniqueTags, searchTerm]);

  const hasBookmarks = filteredBookmarks.length > 0;

  // Droppable component for static sidebar folders (only droppable, not draggable)
  const DroppableStaticFolder = ({ folder, children }) => {
    const { isOver, setNodeRef } = useDroppable({
      id: folder.id,
      data: { type: 'static-folder', folderId: folder.id },
    });

    const isActiveFolder = activeFolder === folder.id || activeFolder === folder.name;

    return (
      <button
        ref={setNodeRef}
        onClick={() => setActiveFolder(folder.id || folder.name)}
        onContextMenu={folder.id === 'Tags' ? handleTagsFolderContextMenu : undefined}
        className={`w-full flex items-center gap-3 p-2 rounded-lg text-left font-medium transition duration-200
          ${isActiveFolder
            ? 'bg-gradient-to-r from-accent-start to-accent-end text-white shadow-md'
            : 'text-text-secondary hover:bg-gray-200'
          }
          ${isOver ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
        `}
      >
        <span className="text-lg">{children}</span> {/* Reduced icon size */}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-bg-primary p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 md:gap-8
                      h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)]">
        {/* Left Sidebar */}
        <aside className="w-full md:w-64 bg-bg-secondary rounded-xl p-6 shadow-sm flex-shrink-0 flex flex-col">
          {/* User Info */}
          <div className="mb-4 p-3 bg-bg-primary rounded-lg shadow-sm">
            <p className="text-sm text-text-secondary truncate">
              Welcome, {currentUser?.email}
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-6 relative">
            <input
              type="text"
              placeholder="Search bookmarks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 pr-10 rounded-lg border border-border-color focus:outline-none focus:ring-2 focus:ring-blue-300 transition duration-200 bg-bg-primary text-text-primary"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary text-xl"
                aria-label="Clear search"
              >
                {icons.clearSearch}
              </button>
            )}
          </div>

          {/* Static Folder List */}
          <nav className="space-y-1 mb-6"> {/* Reduced space-y */}
            {staticFolders.map((folder) => (
              <React.Fragment key={folder.id}>
                <DroppableStaticFolder folder={folder}>
                  {folder.icon} <span className="text-base">{folder.name}</span> {/* Added space here */}
                </DroppableStaticFolder>
                {/* Render dynamic tag subfolders if 'Tags' is active */}
                {folder.id === 'Tags' && activeFolder === 'Tags' && uniqueTags.length > 0 && (
                  <div className="pl-6 space-y-1 mt-1"> {/* Reduced space-y */}
                    {uniqueTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => setActiveFolder(tag)}
                        className={`w-full flex items-center gap-3 p-2 rounded-lg text-left text-sm font-medium transition duration-200
                          ${activeFolder === tag
                            ? 'bg-gradient-to-r from-accent-start to-accent-end text-white shadow-md'
                            : 'text-text-secondary hover:bg-gray-200'
                          }
                        `}
                      >
                        <span className="text-lg">#</span>
                        <span>{tag}</span>
                      </button>
                    ))}
                  </div>
                )}
              </React.Fragment>
            ))}
          </nav>

          {/* Custom Folders Section */}
          <div className="flex-grow">
            <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center justify-between">
              Custom Folders
            </h3>
            {/* New Folder Input */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="New Folder"
                value={newFolderName}
                onChange={(e) => {
                  setNewFolderName(e.target.value);
                  setFolderCreationError(''); // Clear error on change
                }}
                onKeyPress={handleCreateRootFolder}
                className="w-full p-3 rounded-lg border border-border-color focus:outline-none focus:ring-2 focus:ring-blue-300 transition duration-200 bg-bg-primary text-text-primary"
                disabled={isCreatingFolder}
              />
              {folderCreationError && (
                <p className="text-red-500 text-xs mt-1">{folderCreationError}</p>
              )}
            </div>

            {loadingFolders ? (
              <div className="text-text-secondary text-sm p-3">Loading folders...</div>
            ) : customFolders.length > 0 ? (
              <nav className="space-y-1"> {/* Reduced space-y */}
                {/* Render custom folders using FolderTree */}
                <FolderTree
                  folders={customFolders}
                  activeFolder={activeFolder}
                  setActiveFolder={setActiveFolder}
                  onContextMenu={handleFolderItemContextMenu}
                />
              </nav>
            ) : (
              <p className="text-text-secondary text-sm p-3">No custom folders yet.</p>
            )}
          </div>

          {/* Settings & Logout Buttons */}
          <div className="mt-4 space-y-2">
            {/* Removed Settings & Data Button */}
            {/* <button
              onClick={() => setShowDataManagementModal(true)}
              className="w-full flex items-center gap-3 p-3 rounded-lg text-left font-medium transition duration-200
                         text-text-secondary hover:bg-gray-200"
            >
              <span className="text-xl">{icons.settings}</span>
              <span>Settings & Data</span>
            </button> */}

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="w-full flex items-center gap-3 p-3 rounded-lg text-left font-medium transition duration-200
                         text-text-secondary hover:bg-gray-200"
            >
              <span className="text-xl">{isDarkMode ? icons.lightMode : icons.darkMode}</span>
              <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-3 rounded-lg text-left font-medium transition duration-200
                         text-red-600 hover:bg-red-50 border border-red-200"
            >
              <span className="text-xl">{icons.logout}</span>
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 bg-bg-primary rounded-xl p-6 shadow-custom-subtle flex flex-col relative">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-text-primary">
              {activeFolder === 'All Bookmarks' ? 'All Bookmarks' :
               activeFolder === 'Favorites' ? 'Favorites' :
               activeFolder === 'Recent' ? 'Recent Bookmarks' :
               activeFolder === 'Trash' ? 'Trash' :
               activeFolder === 'Tags' ? 'All Tags' :
               customFolders.find(f => f.id === activeFolder)?.name || activeFolder || 'Bookmarks'}
            </h2>
            <div className="flex items-center gap-4">
              {activeFolder === 'Recent' && (
                <div className="flex gap-2 bg-gray-100 rounded-full p-1">
                  <button
                    onClick={() => setRecentTimeframe('24h')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition duration-200
                      ${recentTimeframe === '24h' ? 'bg-bg-primary shadow-sm text-blue-700' : 'text-text-secondary hover:bg-gray-200'}`}
                  >
                    24h
                  </button>
                  <button
                    onClick={() => setRecentTimeframe('7d')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition duration-200
                      ${recentTimeframe === '7d' ? 'bg-bg-primary shadow-sm text-blue-700' : 'text-text-secondary hover:bg-gray-200'}`}
                  >
                    7 Days
                  </button>
                  <button
                    onClick={() => setRecentTimeframe('30d')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition duration-200
                      ${recentTimeframe === '30d' ? 'bg-bg-primary shadow-sm text-blue-700' : 'text-text-secondary hover:bg-gray-200'}`}
                  >
                    30 Days
                  </button>
                </div>
              )}
              {/* Removed the "Select" button */}
            </div>
          </div>

          {/* Temporary Action Bar */}
          {selectionMode && selectedBookmarkIds.length > 0 && (
            <div className="sticky top-0 bg-blue-50 p-3 rounded-lg shadow-md mb-6 flex flex-wrap items-center justify-between gap-3 z-30">
              <span className="text-blue-800 font-semibold">
                {selectedBookmarkIds.length} item{selectedBookmarkIds.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowBulkMoveModal(true)}
                  className="px-4 py-2 rounded-full bg-blue-200 text-blue-800 text-sm font-medium hover:bg-blue-300 transition-colors"
                >
                  Move Selected
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 rounded-full bg-red-200 text-red-800 text-sm font-medium hover:bg-red-300 transition-colors"
                >
                  Delete Selected
                </button>
                <button
                  onClick={() => setShowBulkAddTagsModal(true)}
                  className="px-4 py-2 rounded-full bg-blue-200 text-blue-800 text-sm font-medium hover:bg-blue-300 transition-colors"
                >
                  Add Tags to Selected
                </button>
                <button
                  onClick={handleCancelSelection}
                  className="px-4 py-2 rounded-full bg-gray-200 text-gray-800 text-sm font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {loadingBookmarks ? (
            <div className="flex-1 flex items-center justify-center text-text-secondary">
              Loading bookmarks...
            </div>
          ) : hasBookmarks ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredBookmarks.map((bookmark) => (
                <BookmarkCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  onToggleFavorite={toggleFavorite}
                  onRestore={restoreBookmark}
                  onDeletePermanently={deleteBookmarkPermanently}
                  isInTrashView={activeFolder === 'Trash'}
                  onContextMenu={(e) => handleBookmarkCardContextMenu(e, bookmark)}
                  selectionMode={selectionMode}
                  isSelected={selectedBookmarkIds.includes(bookmark.id)}
                  onToggleSelection={toggleBookmarkSelection}
                  onClick={handleOpenBookmarkDetail}
                />
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center p-8">
                <p className="text-text-secondary text-xl mb-4">
                  {searchTerm
                    ? `No bookmarks found matching "${searchTerm}".`
                    : activeFolder === 'Favorites' ? 'No favorite bookmarks yet!' :
                      activeFolder === 'Recent' ? 'No recent bookmarks found.' :
                      activeFolder === 'Trash' ? 'Trash is empty.' :
                      activeFolder === 'Tags' ? 'No tags found across your bookmarks.' :
                      uniqueTags.includes(activeFolder) ? `No bookmarks with tag "${activeFolder}" yet.` :
                      'No bookmarks here yet!'}
                </p>
                {activeFolder !== 'Trash' && (
                  <button
                    onClick={() => { setBookmarkToEdit(null); setShowAddBookmarkModal(true); }}
                    className="bg-gradient-to-r from-accent-start to-accent-end text-white font-semibold py-3 px-6 rounded-xl shadow-md
                                   hover:from-blue-700 hover:to-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 transition duration-200">
                    <span className="text-2xl mr-2 text-white">{icons.plus}</span> Add Your First Bookmark
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Floating Action Button (FAB) - Only show if not in Trash view and not in selection mode */}
          {activeFolder !== 'Trash' && !selectionMode && (
            <button
              onClick={() => { setBookmarkToEdit(null); setShowAddBookmarkModal(true); }}
              className="fixed bottom-8 right-8 bg-gradient-to-r from-accent-start to-accent-end text-white p-4 rounded-full shadow-lg text-3xl
                         hover:scale-105 transition-transform duration-200 ease-in-out z-40"
              aria-label="Add new bookmark"
            >
              <span className="text-3xl text-white">{icons.plus}</span>
            </button>
          )}
        </main>
      </div>

      {/* Add/Edit Bookmark Modal */}
      {showAddBookmarkModal && (
        <AddBookmarkModal
          onClose={() => { setShowAddBookmarkModal(false); setBookmarkToEdit(null); }}
          folders={customFolders}
          onNewFolderClick={() => {
            setShowAddBookmarkModal(false);
            setFolderToEdit(null);
            setShowAddFolderModal(true);
          }}
          initialBookmark={bookmarkToEdit}
        />
      )}

      {/* Add/Edit Folder Modal */}
      {showAddFolderModal && (
        <AddFolderModal
          onClose={() => { setShowAddFolderModal(false); setFolderToEdit(null); }}
          initialFolder={folderToEdit}
        />
      )}

      {/* Bulk Move To Folder Modal */}
      {showBulkMoveModal && (
        <BulkMoveToFolderModal
          onClose={() => { setShowBulkMoveModal(false); handleCancelSelection(); }}
          folders={customFolders}
          selectedBookmarkIds={selectedBookmarkIds}
        />
      )}

      {/* Bulk Add Tags Modal */}
      {showBulkAddTagsModal && (
        <BulkAddTagsModal
          onClose={() => { setShowBulkAddTagsModal(false); handleCancelSelection(); }}
          selectedBookmarkIds={selectedBookmarkIds}
        />
      )}

      {/* Confirm Folder Deletion Modal */}
      {showConfirmFolderDeletionModal && folderToDelete && (
        <ConfirmFolderDeletionModal
          onClose={() => { setShowConfirmFolderDeletionModal(false); setFolderToDelete(null); }}
          folderName={folderToDelete.name}
          bookmarkCount={bookmarks.filter(b => b.folderId === folderToDelete.id).length}
          onConfirmAction={(actionType) => executeFolderDeletionAction(folderToDelete.id, actionType)}
          loading={false}
        />
      )}

      {/* Manage Tags Modal */}
      {showManageTagsModal && (
        <ManageTagsModal
          onClose={() => setShowManageTagsModal(false)}
          uniqueTags={uniqueTags}
          bookmarks={bookmarks}
        />
      )}

      {/* Removed Data Management Modal */}
      {/* {showDataManagementModal && (
        <DataManagementModal
          onClose={() => setShowDataManagementModal(false)}
        />
      )} */}

      {/* Bookmark Detail Modal */}
      {showBookmarkDetailModal && selectedBookmarkForDetail && (
        <BookmarkDetailModal
          bookmark={selectedBookmarkForDetail}
          onClose={handleCloseBookmarkDetail}
          onEdit={handleEditBookmark} // Pass handleEditBookmark to allow editing from detail view
        />
      )}

      {/* Context Menu */}
      {contextMenu.visible && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          options={contextMenu.options}
          onClose={handleCloseContextMenu}
        />
      )}
    </div>
  );
};

export default Dashboard;