import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Dashboard from './components/Dashboard';
import AuthForms from './components/AuthForms';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { db } from './firebase/config';
import { doc, updateDoc } from 'firebase/firestore';

// Component to handle conditional rendering based on auth state
const AppContent = () => {
  const { currentUser } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Initialize dark mode from localStorage or default to false
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });

  // Effect to apply/remove 'dark' class to body and save preference
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Enable drag after 8px movement
      },
    })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!active || !over || !currentUser) {
      return; // No active draggable or no valid drop target, or not logged in
    }

    const draggedId = active.id;
    const draggedType = active.data?.type; // Get type of dragged item
    const targetId = over.id;
    const targetType = over.data?.type; // Get type of drop target

    if (draggedId === targetId) {
      return; // Dropped on itself
    }

    try {
      if (draggedType === 'bookmark') {
        const bookmarkRef = doc(db, 'users', currentUser.uid, 'bookmarks', draggedId);
        let updateData = {};

        if (targetType === 'folder') { // Dropped on a custom folder
          updateData = {
            folderId: targetId,
            isTrashed: false, // Ensure it's not trashed if moved to a folder
          };
        } else if (targetId === 'Trash') { // Dropped on the Trash static folder
          updateData = {
            isTrashed: true,
            folderId: null, // Remove from any specific folder
          };
        } else if (targetId === 'All Bookmarks' || targetId === 'Favorites' || targetId === 'Recent' || targetId === 'Tags') {
          // Dropped on other static folders (e.g., All Bookmarks)
          // This implies removing it from trash and any custom folder.
          updateData = {
            isTrashed: false,
            folderId: null,
          };
        }

        if (Object.keys(updateData).length > 0) {
          await updateDoc(bookmarkRef, updateData);
          console.log(`Bookmark ${draggedId} moved to ${targetId}`);
        }
      } else if (draggedType === 'folder') {
        // Handle folder drag and drop
        const draggedFolderRef = doc(db, 'users', currentUser.uid, 'folders', draggedId);
        let newParentId = null; // Default to root

        if (targetType === 'folder') {
          // Dropped on another custom folder
          // Prevent dropping a folder into itself or its descendants
          // For simplicity, I'll just check if targetId is the same as draggedId.
          if (draggedId === targetId) {
            console.warn("Cannot drop a folder onto itself.");
            return;
          }
          newParentId = targetId;
        } else if (targetId === 'All Bookmarks') {
          // Dropped on "All Bookmarks" static folder, implies moving to root
          newParentId = null;
        } else {
          // Dropped on other static folders (Favorites, Recent, Trash, Tags) or outside valid targets
          // For folders, these are not valid drop targets for nesting.
          console.warn(`Folder ${draggedId} cannot be dropped on ${targetId}.`);
          return;
        }

        await updateDoc(draggedFolderRef, {
          parentId: newParentId,
        });
        console.log(`Folder ${draggedId} moved to parent ${newParentId}`);
      }
    } catch (error) {
      console.error("Error during drag and drop:", error);
      // Optionally show an error message to the user
    }
  };

  // If user is not authenticated, show auth forms
  if (!currentUser) {
    return <AuthForms onClose={() => {}} />;
  }

  // If user is authenticated, show the main dashboard wrapped in DndContext
  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <Dashboard isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} /> {/* Pass dark mode props */}
    </DndContext>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;