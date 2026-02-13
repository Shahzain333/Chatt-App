import React, { useMemo } from 'react';
import MessageItem from './MessageItem';

const MessageList = ({ 
    messages, 
    currentUser, 
    selectedUser, 
    scrollRef,
    audioRefs,
    playingAudio,
    toggleAudioPlay,
    handleDownload,
    formatFileSize,
    getFileIcon,
    onEdit,
    onDelete,
    activeMessageId,
    setActiveMessageId,
    setSelectedMessageForView
}) => {
    const handleMessageClick = (messageId, e) => {
        e.stopPropagation();
        setActiveMessageId(activeMessageId === messageId ? null : messageId);
    };

    const sortedMessages = useMemo(() => {
        if (!messages || !Array.isArray(messages)) return [];
        return [...messages].sort((a, b) => {
            const aTime = new Date(a.timestamp || 0).getTime();
            const bTime = new Date(b.timestamp || 0).getTime();
            return aTime - bTime;
        });
    }, [messages]);

    return (
        <section className='flex-1 overflow-hidden px-3 pt-5'>
            <div ref={scrollRef} className='h-full overflow-y-auto custom-scrollbar'>
                <div className='min-h-full flex flex-col justify-end'>
                    {sortedMessages.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-gray-500 py-8">
                            <p>No messages yet. Start the conversation!</p>
                        </div>
                    ) : (
                        sortedMessages.map((msg, index) => (
                            <MessageItem 
                                key={msg.id || `msg-${index}`}
                                message={msg}
                                isOwnMessage={msg.sender === currentUser?.email}
                                currentUser={currentUser}
                                selectedUser={selectedUser}
                                activeMessageId={activeMessageId}
                                onMessageClick={handleMessageClick}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                audioRefs={audioRefs}
                                playingAudio={playingAudio}
                                toggleAudioPlay={toggleAudioPlay}
                                handleDownload={handleDownload}
                                formatFileSize={formatFileSize}
                                getFileIcon={getFileIcon}
                                setSelectedMessageForView={setSelectedMessageForView}
                            />
                        ))
                    )}
                </div>
            </div>
        </section>
    );
};

export default MessageList;