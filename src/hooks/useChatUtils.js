import { useCallback, useMemo } from "react";

export const useChatUtils = (currentUser) => {
  // Generate chat ID (same as Firebase uses)
  const generateChatId = useCallback((uid1, uid2) => {
    if (!uid1 || !uid2) return null;
    return uid1 < uid2 ? `${uid1}-${uid2}` : `${uid2}-${uid1}`;
  }, []);

  // Get other user from chat document
  const getOtherUserFromChat = useCallback((chat) => {
    if (!chat?.users || !currentUser?.email) return chat?.users?.[0] || null;
    return chat.users.find(user => user?.email && user.email !== currentUser.email) || chat.users[0] || null;
  }, [currentUser]);

  // Get chat ID for a specific user
  const getChatIdForUser = useCallback((user) => 
    generateChatId(user?.uid, currentUser?.uid),
    [currentUser?.uid, generateChatId]
  );

  return { generateChatId, getOtherUserFromChat, getChatIdForUser };
};