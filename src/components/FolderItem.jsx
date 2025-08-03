import React from 'react';
import { useDroppable } from '@dnd-kit/core';

const FolderItem = ({ folder, activeFolder, setActiveFolder, level = 0, onContextMenu }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: folder.id,
    data: { type: 'folder', folderId: folder.id },
  });

  const isActive = activeFolder === folder.id;

  return (
    <button
      ref={setNodeRef}
      onClick={() => setActiveFolder(folder.id)}
      onContextMenu={(e) => onContextMenu(e, folder)}
      className={`w-full flex items-center gap-3 p-2 rounded-lg text-left font-medium transition duration-200
        ${isActive
          ? 'bg-gradient-to-r from-accent-start to-accent-end text-white shadow-md'
          : 'text-text-secondary hover:bg-gray-200'
        }
        ${isOver ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
      `}
      style={{
        paddingLeft: `${(level * 20) + 16}px`,
      }}
    >
      <span className="text-lg">📁</span>
      <span className="text-base">{folder.name}</span>
    </button>
  );
};

export default FolderItem;