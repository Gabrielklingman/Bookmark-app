import React, { useEffect, useRef } from 'react';

const ContextMenu = ({ x, y, options, onClose }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position to keep menu within viewport
  const style = {
    top: y,
    left: x,
  };

  // Basic check to prevent menu from going off-screen (can be improved)
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (rect.right > viewportWidth) {
        style.left = x - rect.width;
      }
      if (rect.bottom > viewportHeight) {
        style.top = y - rect.height;
      }
    }
  }, [x, y, options]);


  return (
    <div
      ref={menuRef}
      className="fixed bg-bg-primary rounded-lg shadow-lg py-2 z-50 border border-border-color min-w-[160px]" // Use theme variables
      style={style}
    >
      {options.map((option, index) => (
        <button
          key={index}
          onClick={() => {
            option.onClick();
            onClose(); // Close menu after option is clicked
          }}
          className="w-full text-left px-4 py-2 text-text-secondary hover:bg-gray-100 flex items-center gap-2" // Use theme variable
          disabled={option.disabled}
        >
          {option.icon && <span className="text-lg">{option.icon}</span>}
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
};

export default ContextMenu;