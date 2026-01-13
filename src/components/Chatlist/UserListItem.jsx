import React from "react";
import defaultAvatar from "../../assets/default.jpg";
import { RiDeleteBinLine, RiArrowDownSLine } from "react-icons/ri";
import { formatTimestamp } from "../../utils/formatTimestamp";

const UserListItem = ({ 
  user, 
  isActive, 
  showDropdown, 
  onSelect, 
  onToggleDropdown, 
  onDelete 
}) => {

  const hasChat = !!user.chatId;

  return (
    <div className={`relative flex items-center w-full p-4 border-b border-gray-100 
      hover:bg-gray-100 transition-colors ${isActive ? 'bg-green-100' : ''}`}>
      
      <button className="flex items-center flex-1 text-left" onClick={() => onSelect(user)}>
        <UserAvatar user={user} />
        <UserInfo user={user} hasChat={hasChat} />
      </button>

      {hasChat && (
        <UserDropdown 
          user={user}
          showDropdown={showDropdown}
          onToggleDropdown={onToggleDropdown}
          onDelete={onDelete}
        />
      )}

    </div>
  );
};

const UserAvatar = ({ user }) => (
  <div className="relative flex-shrink-0">
    <img 
      src={user?.image || defaultAvatar} 
      className="h-12 w-12 rounded-full object-cover" 
      alt={user?.fullname || "User"} 
    />
    {user.status === 'online' && (
      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
    )}
  </div>
);

const UserInfo = ({ user, hasChat }) => (
  <div className="flex-1 min-w-0 ml-3">
    
    <div className="flex justify-between items-start">
      
      <h4 className="font-semibold text-gray-900 text-sm truncate">
        {user?.fullName || user?.fullname || "ChatFrik User"}
      </h4>
      
      {user.lastMessageTimestamp && (
        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
          {formatTimestamp(user.lastMessageTimestamp)}
        </span>
      )}

    </div>
    
    <p className="text-gray-600 text-sm truncate mt-1">
      {hasChat ? (user.lastMessage || "No messages yet") : "Click to start chatting"}
    </p>
    
    {!hasChat && (
      <span className="absolute top-2 right-2 mt-1 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
        New
      </span>
    )}
  </div>
);

// const UserStatus = ({ user, hasChat }) => (
//   <div className="flex items-center gap-2 mt-1">
//     {user.status && (
//       <span className={`text-xs px-2 py-0.5 rounded-full ${user.status === 'online' ? 
//         'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
//         {user.status === 'online' ? 'Online' : 'Offline'}
//       </span>
//     )}
    
//     {!hasChat && (
//       <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">New</span>
//     )}
//   </div>
// );

const UserDropdown = ({ user, showDropdown, onToggleDropdown, onDelete }) => (
  <div className="relative user-dropdown">
   
    <button 
      onClick={(e) => onToggleDropdown(user.uid, e)} 
      className="p-2 rounded-full hover:bg-gray-200 transition-colors" 
      aria-label="More options"
    >
      <RiArrowDownSLine className={`text-gray-500 transition-transform ${showDropdown ? 
        'rotate-180' : ''}`} size={18} />
   
    </button>
    
    {showDropdown && (
      <div className="absolute right-0 top-10 z-50 bg-white border border-gray-200 
        rounded-lg shadow-xl min-w-[140px] py-2 user-dropdown">
        <button 
          onClick={(e) => onDelete(user, e)} 
          className="flex items-center gap-2 w-full px-4 py-3 text-left hover:bg-red-50 
          transition-colors text-red-600"
        >
          <RiDeleteBinLine className="text-red-500" />
          <span className="text-sm font-medium">Delete Chat</span>
        </button>
      </div>
    )}
  </div>
);

export default UserListItem;