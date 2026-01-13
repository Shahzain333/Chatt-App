import React, { useState, useEffect } from "react";
import { RiSearchLine } from "react-icons/ri";

const FilterSection = ({ 
  showOnlyChats, 
  usersCount, 
  onToggleFilter, 
  onSearch,
  searchTerm = "", // Receive search term from parent
  isSearching = false
}) => { 

  const [searchUser, setSearchUser] = useState(searchTerm);
  
  // Sync with parent searchTerm
  useEffect(() => {
    setSearchUser(searchTerm);
  }, [searchTerm]);

  // Debounce search to avoid too many calls
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearch && searchUser !== searchTerm) {
        onSearch(searchUser);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchUser, onSearch, searchTerm]);

  const handleSearchUser = (e) => {
    const value = e.target.value;
    setSearchUser(value);
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(localSearch);
    }
  }

  const handleClearSearch = () => {
    setSearchUser("");
    if (onSearch) {
      onSearch("");
    }
  }

  return (
    <div className="px-2 py-1 border-b border-gray-200">
      {/* Search Bar */}
      <div className="mb-2">
        
        <form onSubmit={handleSearchSubmit} className="relative">
          
          <input 
            type="text" 
            placeholder="Search by name, username" 
            value={searchUser}
            onChange={handleSearchUser}
            className="border border-gray-300 rounded-lg pl-3 pr-10 py-2 text-sm 
            transition-colors w-full focus:outline-none focus:ring-1 focus:ring-gray-700"
            disabled={isSearching}
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 
            text-gray-400 hover:text-gray-600 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Search"
            title="Click to search"
            disabled={isSearching}
          >
            {isSearching ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
            ) : (
              <RiSearchLine size={18} />
            )}
          </button>
          
          {searchUser && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-10 top-1/2 transform -translate-y-1/2 
              text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              aria-label="Clear search"
              title="Clear search"
            >
              ×
            </button>
          )}
        </form>
      </div>
    
      {/* Filter Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">
            {searchUser.trim() ? `Search Results (${usersCount})` : 
             showOnlyChats ? `Chats (${usersCount})` : `All Users (${usersCount})`}
          </h3>
        </div>
      
        <button 
          onClick={onToggleFilter} 
          className="text-xs border border-gray-300 text-gray-700 px-3 py-1 rounded-lg 
          transition-colors hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!!searchUser.trim()}
          title={searchUser.trim() ? "Clear search to use filter" : ""}
        >
          {showOnlyChats ? "Show All Users" : "Show Only Chats"}
        </button>
      </div>
    </div>
  );
};

export default FilterSection;