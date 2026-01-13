import React from "react";
import { RiDeleteBinLine } from "react-icons/ri";

const MobileMenu = ({ isOpen, onDeleteSelected, selectedUser, onClose }) => {
  
  if (!isOpen) return null;

  return (
    <div className="mobile-menu absolute top-16 md:top-14 right-4 bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-[160px] py-2">
      <ul className="space-y-1">
        <li>
          <button 
            onClick={onDeleteSelected} 
            className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-red-50 transition-colors text-red-600 disabled:opacity-50 disabled:cursor-not-allowed" 
            disabled={!selectedUser}
          >
            <RiDeleteBinLine className="text-red-500 text-lg" />
            <span className="text-sm font-medium">
              {selectedUser ? `Delete ${selectedUser.fullName || 'User'}` : 'Delete Chat'}
            </span>
          </button>
        </li>
      </ul>
      
      {!selectedUser && (
        <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-100 mt-2">
          Select a user first to delete chat
        </div>
      )}
    </div>
  );
};

export default MobileMenu;