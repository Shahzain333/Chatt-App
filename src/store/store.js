import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import chatReducer from "./chatSlice";

export const store = configureStore({
    reducer: {
        auth: authReducer, // This means state.auth
        chat: chatReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['chat/setCurrentUser', 'chat/setChats', 'chat/setMessages'],
                ignoredPaths: [
                    'chat.currentUser.createdAt',
                    'chat.chats.lastMessageTimestamp', 
                    'chat.messages.timestamp'
                ],
            },
        }),
})


