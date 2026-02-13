import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';

// Components
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import MediaViewer from './MediaViewer';
import AttachmentPreview from './AttachmentPreview';
import UploadProgress from './UploadProgress';
import EmptyChatState from './EmptyChatState';
import LoadingScreen from '../Chatlist/LoadingScreen';

// Hooks
import useVoiceRecording from '../../hooks/useVoiceRecording';
import useFileHandling from '../../hooks/useFileHandling';
import useMessageActions from '../../hooks/useMessageActions';

// Services & Utils
import firebaseService from '../../services/firebaseServices';
import { 
    setMessages, 
    setSelectedUser, 
    setLoading,
} from '../../store/chatSlice';

function Chatbox({ onBack }) {
    const dispatch = useDispatch();
    const { messages, selectedUser, loading } = useSelector(state => state.chat);
    const { currentUser } = useSelector(state => state.auth);
    
    // Message states
    const [messageText, setMessageText] = useState('');
    const [editingMessage, setEditingMessage] = useState(null);
    const [isSending, setIsSending] = useState(false);
    
    // UI states
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
    const [activeMessageId, setActiveMessageId] = useState(null);
    const [selectedMessageForView, setSelectedMessageForView] = useState(null);
    
    // Refs
    const scrollRef = useRef(null);
    const attachmentMenuRef = useRef(null);
    
    const chatId = useMemo(() => {
        if (!selectedUser?.uid || !currentUser?.uid) return null;
        return currentUser.uid < selectedUser.uid 
            ? `${currentUser.uid}_${selectedUser.uid}`
            : `${selectedUser.uid}_${currentUser.uid}`;
    }, [selectedUser, currentUser]);

    // Custom Hooks
    const {
        attachments,
        previewImage,
        uploadProgress,
        setAttachments,
        setPreviewImage,
        setUploadProgress,
        handleFileSelect,
        removeAttachment,
        getFileIcon,
        formatFileSize,
        handleDownload,
    } = useFileHandling({ chatId, currentUser });

    const {
        isRecording,
        isRecordingAllowed,
        playingAudio,
        audioRefs,
        startRecording,
        stopRecording,
        toggleAudioPlay,
    } = useVoiceRecording({ 
        chatId, 
        currentUser, 
        selectedUser,
        setIsSending,
        dispatch 
    });

    const {
        handleSendMessage,
        handleEdit,
        handleDelete,
        cancelEdit,
    } = useMessageActions({
        chatId,
        currentUser,
        selectedUser,
        messageText,
        editingMessage,
        attachments,
        isSending,
        setIsSending,
        setMessageText,
        setEditingMessage,
        setAttachments,
        setPreviewImage,
        setUploadProgress,
        dispatch,
    });

    // ========== CLICK OUTSIDE HANDLERS ==========
    
    // Close mobile menu and attachment options when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            const menu = document.querySelector('.mobile-menu');
            const menuButton = document.querySelector('.menu-button');

            // Close mobile menu
            if (menu && menuButton && !menu.contains(e.target) && !menuButton.contains(e.target)) {
                setIsMobileMenuOpen(false);
            }

            // Close attachment options
            if (attachmentMenuRef.current && 
                !attachmentMenuRef.current.contains(e.target) &&
                !e.target.closest('.attachment-button')) {
                setShowAttachmentOptions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Close message actions when clicking outside
    useEffect(() => {
        const handleClickOutsideMessage = (e) => {
            if (activeMessageId && 
                !e.target.closest('.message-content') && 
                !e.target.closest('.message-actions')) {
                setActiveMessageId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutsideMessage);
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutsideMessage);
        };
    }, [activeMessageId]);

    // Messages listener
    useEffect(() => {
        if (chatId && selectedUser) {
            dispatch(setLoading(true));
            const unsubscribe = firebaseService.listenForMessages(chatId, (newMessages) => {
                const parsedMessages = newMessages?.map(msg => ({
                    ...msg,
                    attachments: msg.attachments ? JSON.parse(msg.attachments) : []
                })) || [];

                dispatch(setMessages(parsedMessages));
                dispatch(setLoading(false));
            });
            
            return () => {
                unsubscribe();
                dispatch(setLoading(false));
            };
        } else {
            dispatch(setMessages([]));
            dispatch(setLoading(false));
        }
    }, [chatId, selectedUser, dispatch]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current && !loading) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    // Clear state when user changes
    useEffect(() => {
        setMessageText('');
        setEditingMessage(null);
        setIsSending(false);
        setAttachments([]);
        setPreviewImage(null);
        setUploadProgress({});
        setActiveMessageId(null);
        setIsMobileMenuOpen(false);
        setShowAttachmentOptions(false);
        
        // Stop all audio
        Object.values(audioRefs.current).forEach(audio => {
            if(audio) {
                audio.pause();
                audio.currentTime = 0;
            }
        });
        
        if (isRecording) {
            stopRecording();
        }
    }, [selectedUser?.uid]);

    const handleBack = () => {
        dispatch(setSelectedUser(null));
        if (onBack && typeof onBack === 'function') {
            onBack();
        }
    };

    if (loading && messages.length === 0) {
        return <LoadingScreen message="Loading messages..." />;
    }

    if (!selectedUser) {
        return <EmptyChatState />;
    }

    return (
        <section className='flex flex-col h-full w-full app-background'>
            
            <ChatHeader 
                selectedUser={selectedUser}
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                onBack={handleBack}
                chatId={chatId}
                isSending={isSending}
                isRecording={isRecording}
            />

            <main className='flex flex-col flex-1 w-full overflow-hidden'>
                
                <MessageList 
                    messages={messages}
                    currentUser={currentUser}
                    selectedUser={selectedUser}
                    scrollRef={scrollRef}
                    audioRefs={audioRefs}
                    playingAudio={playingAudio}
                    toggleAudioPlay={toggleAudioPlay}
                    handleDownload={handleDownload}
                    formatFileSize={formatFileSize}
                    getFileIcon={getFileIcon}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    activeMessageId={activeMessageId}
                    setActiveMessageId={setActiveMessageId}
                    setSelectedMessageForView={setSelectedMessageForView}
                />

                <AttachmentPreview 
                    attachments={attachments}
                    previewImage={previewImage}
                    onClearAll={() => {
                        setAttachments([]);
                        setPreviewImage(null);
                    }}
                    onRemoveAttachment={removeAttachment}
                    getFileIcon={getFileIcon}
                    formatFileSize={formatFileSize}
                />

                <UploadProgress uploadProgress={uploadProgress} />

                <MessageInput 
                    messageText={messageText}
                    setMessageText={setMessageText}
                    editingMessage={editingMessage}
                    isSending={isSending}
                    isRecording={isRecording}
                    isRecordingAllowed={isRecordingAllowed}
                    attachments={attachments}
                    onSend={handleSendMessage}
                    onCancelEdit={cancelEdit}
                    onFileSelect={handleFileSelect}
                    onStartRecording={startRecording}
                    onStopRecording={stopRecording}
                    showAttachmentOptions={showAttachmentOptions}
                    setShowAttachmentOptions={setShowAttachmentOptions}
                    attachmentMenuRef={attachmentMenuRef}
                />
            </main>

            <MediaViewer 
                selectedMessageForView={selectedMessageForView}
                setSelectedMessageForView={setSelectedMessageForView}
            />

            {/* <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
                .message-content {
                    word-break: break-word;
                    overflow-wrap: break-word;
                    min-width: 0;
                }
            `}</style> */}

        </section>
    );
}

export default Chatbox;