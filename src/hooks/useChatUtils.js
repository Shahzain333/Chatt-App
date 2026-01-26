import { useCallback } from "react";

export const useChatUtils = (currentUser) => {
  // Generate chat ID (same as Firebase uses)
  const generateChatId = useCallback((uid1, uid2) => {
    if (!uid1 || !uid2) return null;
    return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
  }, []);

  // Get other user from chat document - updated for new structure
  const getOtherUserFromChat = useCallback((chat) => {
    if (!chat) return null;
    
    // If chat has user property (from our new structure)
    if (chat.user) {
      return chat.user;
    }
    
    // Fallback to old structure if needed
    if (chat.users && Array.isArray(chat.users)) {
      if (!currentUser?.email) return chat.users[0] || null;
      const otherUser = chat.users.find(user => user?.email && user.email !== currentUser.email) || chat.users[0] || null;
      console.log('Found user in chat.users array:', otherUser);
      return otherUser;
    }
    
    //console.log('No user found in chat object');
    return null;
  }, [currentUser]);

  // Get chat ID for a specific user
  const getChatIdForUser = useCallback((user) => 
    generateChatId(user?.uid, currentUser?.uid),
    [currentUser?.uid, generateChatId]
  );

  return { generateChatId, getOtherUserFromChat, getChatIdForUser };
};