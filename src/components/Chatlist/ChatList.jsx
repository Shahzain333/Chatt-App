import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "sonner";
import firebaseService from "../../services/firebaseServices";
import { 
  setSelectedUser, 
  setLoading, 
  deleteChats, 
  setMessages,
} from "../../store/chatSlice";

// Import components
import Header from "./Header";
import MobileMenu from "./MobileMenu";
import FilterSection from "./FilterSection";
import UserList from "./UserList";
import LoadingScreen from "./LoadingScreen";
import SearchModal from "../../components/SearchModal";

// Import custom hooks
import { useChatUtils } from "../../hooks/useChatUtils";
import { useFirebaseData } from "../../hooks/useFirebaseData";
import { RiMessage2Fill } from "react-icons/ri";

function Chatlist() {
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showOnlyChats, setShowOnlyChats] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  
  const dispatch = useDispatch();
  const { chats, selectedUser, loading, allUsers } = useSelector(state => state.chat);
  const { currentUser } = useSelector(state => state.auth)
  
  // Initialize custom hooks
  const { getOtherUserFromChat, getChatIdForUser } = useChatUtils(currentUser);
  useFirebaseData(currentUser);

  // Sort chats by timestamp - now using camelCase properties
  const sortedChats = useMemo(() => {
    if (!Array.isArray(chats)) return [];
    return [...chats].sort((a, b) => {
      const getTime = (timestamp) => {
        if (!timestamp) return 0;
        if (typeof timestamp === 'string') {
          return new Date(timestamp).getTime();
        }
        if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
          return timestamp.seconds * 1000;
        }
        return 0;
      };
      
      const aTime = getTime(a.lastMessageTimestamp);
      const bTime = getTime(b.lastMessageTimestamp);
      return bTime - aTime;
    });
  }, [chats]);

  // Create a map of user IDs to their chat data - using camelCase
  const userToChatMap = useMemo(() => {
    const map = new Map();
    sortedChats.forEach(chat => {
      const otherUser = getOtherUserFromChat(chat);
      if (otherUser?.uid) {
        map.set(otherUser.uid, {
          chatId: chat.id,
          lastMessage: chat.lastMessage || "",
          lastMessageTimestamp: chat.lastMessageTimestamp
        });
      }
    });
    return map;
  }, [sortedChats, getOtherUserFromChat]);

  // Memoized search results - using camelCase
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    
    const normalizedSearchTerm = searchTerm.toLowerCase();
    
    return allUsers.filter(user => {
      const username = (user.username || '').toLowerCase();
      const fullName = (user.fullName || '').toLowerCase();
      
      return username.includes(normalizedSearchTerm) ||
             fullName.includes(normalizedSearchTerm);
    }).map(user => {
      const chatData = userToChatMap.get(user.uid);
      return chatData ? { 
        ...user, 
        chatId: chatData.chatId,
        lastMessage: chatData.lastMessage,
        lastMessageTimestamp: chatData.lastMessageTimestamp
      } : user;
    });
  }, [searchTerm, allUsers, userToChatMap]);

  // Handle search from FilterSection
  const handleSearch = useCallback((searchValue) => {
    if (typeof searchValue === 'object' && searchValue?.uid) {
      // If it's a user object, start chat immediately
      dispatch(setSelectedUser(searchValue));
      setActiveDropdown(null);
      setSearchTerm(""); // Clear search term
      return;
    }

    // Set search term (string or empty string)
    setSearchTerm(typeof searchValue === 'string' ? searchValue : "");
  }, [dispatch]);

  // Prepare users list - using camelCase properties
  const usersToDisplay = useMemo(() => {
    if (searchTerm.trim()) {

      return searchResults.sort((a, b) => {

        const aHasChat = !!a.chatId;
        const bHasChat = !!b.chatId;
        
        // Users with existing chats should appear first
        if (aHasChat && !bHasChat) return -1;
        if (!aHasChat && bHasChat) return 1;
        
        // If both have chats, sort by most recent message
        if (aHasChat && bHasChat) {
          const getTime = (timestamp) => {
            if (!timestamp) return 0;
            if (typeof timestamp === 'string') {
              return new Date(timestamp).getTime();
            }
            if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
              return timestamp.seconds * 1000;
            }
            return 0;
          };
          
          const aTime = getTime(a.lastMessageTimestamp);
          const bTime = getTime(b.lastMessageTimestamp);
        
          return bTime - aTime;
        }
        
        // If neither has chat, sort alphabetically
        return (a.fullName || "").localeCompare(b.fullName || "");
      });
    }

    if (showOnlyChats) {

      return sortedChats.map(chat => {
      
        const otherUser = getOtherUserFromChat(chat);
      
        if (!otherUser) return null;
        return {
          ...otherUser,
          chatId: chat.id,
          lastMessage: chat.lastMessage || "",
          lastMessageTimestamp: chat.lastMessageTimestamp
        };
    
      }).filter(Boolean);
    
    }
    
    return allUsers.map(user => {
      const chatData = userToChatMap.get(user.uid);
      return chatData ? { 
        ...user, 
        chatId: chatData.chatId,
        lastMessage: chatData.lastMessage,
        lastMessageTimestamp: chatData.lastMessageTimestamp
      } : user;
    }).sort((a, b) => {
      const aHasChat = !!a.chatId;
      const bHasChat = !!b.chatId;
      
      if (aHasChat && !bHasChat) return -1;
      if (!aHasChat && bHasChat) return 1;
      
      if (aHasChat && bHasChat) {
        const getTime = (timestamp) => {
          if (!timestamp) return 0;
          if (typeof timestamp === 'string') {
            return new Date(timestamp).getTime();
          }
          if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
            return timestamp.seconds * 1000;
          }
          return 0;
        };
        
        const aTime = getTime(a.lastMessageTimestamp);
        const bTime = getTime(b.lastMessageTimestamp);
        return bTime - aTime;
      }
      
      return (a.fullName || "").localeCompare(b.fullName || "");
    });
    
  }, [showOnlyChats, sortedChats, allUsers, userToChatMap, getOtherUserFromChat, searchTerm, searchResults]);
    
  // Start chat for user selection
  const startChat = useCallback((user) => {
    if (user?.uid) {
      dispatch(setSelectedUser(user));
      setActiveDropdown(null);
      
      // Clear search when selecting a user
      setSearchTerm("");
    }
  }, [dispatch]);

  // Unified delete chat handler
  const handleDeleteChat = useCallback(async (user, source = 'dropdown') => {
    const chatId = getChatIdForUser(user);
    
    if (!chatId) {
      toast.error("Cannot delete chat at this moment.", { duration: 3000 });
      return false;
    }

    toast(`Delete all chats with ${user?.fullName || 'this user'}?`, {
      description: 'This action cannot be undone. All messages will be permanently deleted.',
      duration: 3000,
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            
            dispatch(setLoading(true));
            dispatch(deleteChats(chatId));
            await firebaseService.deleteChats(chatId);
            dispatch(setLoading(false));
            
            if (selectedUser?.uid === user.uid) {
              dispatch(setSelectedUser(null));
              dispatch(setMessages([]));
            }
            
            // Clear search if the deleted user was in search results
            if (searchTerm.trim()) {
              setSearchTerm("");
            }
            
            toast.success(`Chat with ${user?.fullName || 'user'} deleted successfully!`, {
              duration: 3000,
            });
            
            if (source === 'dropdown') {
              setActiveDropdown(null);
            } else if (source === 'mobileMenu') {
              setIsMobileMenuOpen(false);
            }
            
            return true;
          
          } catch (error) {
            console.error('Error deleting chat:', error);
            toast.error('Failed to delete chat. Please try again.', { duration: 3000 });
            return false;
          
          } finally {
            dispatch(setLoading(false));
          }
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {
          if (source === 'dropdown') {
            setActiveDropdown(null);
          } else if (source === 'mobileMenu') {
            setIsMobileMenuOpen(false);
          }
        },
      },
    });
    
    return true; 
  }, [dispatch, getChatIdForUser, selectedUser, searchTerm]);

  const toggleUserDropdown = useCallback((userId, e) => {
    e.stopPropagation();
    setActiveDropdown(prev => prev === userId ? null : userId);
  }, []);

  const handleDeleteUserChat = useCallback((user, e) => {
    e?.stopPropagation();
    setActiveDropdown(null);
    handleDeleteChat(user, 'dropdown');
  }, [handleDeleteChat]);

  const handleDeleteSelectedUserChats = useCallback(() => {
    if (!selectedUser) {
      toast.info("Please select a user first.", { duration: 3000 });
      setIsMobileMenuOpen(false);
      return;
    }
    setIsMobileMenuOpen(false);
    handleDeleteChat(selectedUser, 'mobileMenu');
  }, [selectedUser, handleDeleteChat]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isMobileMenuOpen) {
        const menu = document.querySelector('.mobile-menu');
        const menuButton = document.querySelector('.menu-button');
        if (menu && menuButton && !menu.contains(e.target) && !menuButton.contains(e.target)) {
          setIsMobileMenuOpen(false);
        }
      }
      if (activeDropdown && !e.target.closest('.user-dropdown')) {
        setActiveDropdown(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen, activeDropdown]);

  const handleSearchUser = () => {
    setIsSearchModalOpen(true);
  }

  if (loading && allUsers.length === 0) {
    return <LoadingScreen message="Loading users..."/>;
  }

  return (
      <section className="flex flex-col h-full w-full bg-white border-r 
      border-gray-200 relative">
        <Header 
          currentUser={currentUser} 
          isMenuOpen={isMobileMenuOpen} 
          onToggleMenu={() => setIsMobileMenuOpen(prev => !prev)} 
        />
        
        <MobileMenu 
          isOpen={isMobileMenuOpen}
          onDeleteSelected={handleDeleteSelectedUserChats}
          selectedUser={selectedUser}
          onClose={() => setIsMobileMenuOpen(false)}
        />

        <FilterSection 
          showOnlyChats={showOnlyChats}
          usersCount={usersToDisplay.length}
          onToggleFilter={() => setShowOnlyChats(prev => !prev)}
          onSearch={handleSearch}
          searchTerm={searchTerm}
          isSearching={false}
        />

        <UserList 
          users={usersToDisplay}
          selectedUser={selectedUser}
          activeDropdown={activeDropdown}
          onSelectUser={startChat}
          onDeleteUserChat={handleDeleteUserChat}
          onToggleDropdown={toggleUserDropdown}
        />

        <button className="bg-[#01AA85] h-12 w-12 p-2 rounded-xl absolute bottom-18 sm:bottom-28 md:bottom-18 lg:bottom-16 
        right-4 flex items-center justify-center shadow-lg cursor-pointer transition-colors text-white"
        onClick={handleSearchUser}>
          <RiMessage2Fill size={24}/>
        </button>

        <SearchModal 
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
          onSearch={startChat}
        />

    </section>
  );
}

export default Chatlist;