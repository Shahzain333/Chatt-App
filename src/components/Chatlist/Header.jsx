import React from "react";
import defaultAvatar from "../../assets/default.jpg";
import { RiMore2Fill, RiCloseLine } from "react-icons/ri";

const Header = ({ currentUser, isMenuOpen, onToggleMenu }) => (
  <header className="flex items-center justify-between p-4 md:border-b md:border-gray-200">
    <div className="flex items-center gap-3">
      <img 
        src={currentUser?.image || defaultAvatar} 
        className="w-10 h-10 object-cover rounded-full" 
        alt={currentUser?.fullName || "Profile"} 
      />
      <span className="hidden md:block">
        <h3 className="font-semibold text-[#2A3D39] text-sm">{currentUser?.fullName || "ChatFrik user"}</h3>
        <p className="font-light text-[#2A3D39] text-xs">@{currentUser?.username || "chatfrik"}</p>
      </span>
    </div>
    
    <button 
      className="hidden md:flex items-center justify-center w-10 h-10 rounded-lg transition-colors cursor-pointer menu-button" 
      aria-label="More options" 
      onClick={onToggleMenu}
    >
      {isMenuOpen ? <RiCloseLine color="#01AA85" /> : <RiMore2Fill color="#01AA85" />}
    </button>
  </header>
);

export default Header;