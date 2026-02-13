import React from 'react';
import { RiEditLine, RiDeleteBinLine } from 'react-icons/ri';
import defaultAvatar from '../../assets/default.jpg';
import MessageContent from './MessageContent';

const MessageItem = ({
    message,
    isOwnMessage,
    currentUser,
    selectedUser,
    activeMessageId,
    onMessageClick,
    onEdit,
    onDelete,
    audioRefs,
    playingAudio,
    toggleAudioPlay,
    handleDownload,
    formatFileSize,
    getFileIcon,
    setSelectedMessageForView
}) => {
    if (isOwnMessage) {
        return (
            <div className="mb-1 relative">
                <div className="flex flex-col items-end w-full">
                    <div className="flex gap-3 me-2 max-w-[220px] sm:max-w-[380px]">
                        <div className="relative w-full">
                            <div 
                                className="bg-white pl-3 pr-3 pt-2 rounded-tl-2xl rounded-br-2xl rounded-bl-2xl shadow-sm message-content cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={(e) => onMessageClick(message.id, e)}
                            >
                                <MessageContent 
                                    message={message}
                                    showTimestamp={true}
                                    audioRefs={audioRefs}
                                    playingAudio={playingAudio}
                                    toggleAudioPlay={toggleAudioPlay}
                                    handleDownload={handleDownload}
                                    formatFileSize={formatFileSize}
                                    getFileIcon={getFileIcon}
                                    setSelectedMessageForView={setSelectedMessageForView}
                                />
                            </div>
                            
                            {activeMessageId === message.id && (
                                <div className="absolute right-0 -top-12 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex gap-2 z-10 message-actions">
                                    <button 
                                        onClick={() => onEdit(message)}
                                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                                        title="Edit"
                                    >
                                        <RiEditLine className="text-gray-600" />
                                    </button>
                                    <button 
                                        onClick={() => onDelete(message.id)}
                                        className="p-2 hover:bg-gray-100 rounded transition-colors text-red-500"
                                        title="Delete"
                                    >
                                        <RiDeleteBinLine />
                                    </button>
                                </div>
                            )}
                            
                            <p className="text-gray-400 text-xs mt-1 text-right">
                                {message.edited && <span className="ml-1 text-gray-500">(edited)</span>}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mb-1 relative">
            <div className="flex flex-col items-start w-full">
                <div className="flex gap-2 max-w-[220px] sm:max-w-[380px]">
                    {/* <img 
                        src={selectedUser?.image || defaultAvatar} 
                        className="h-8 w-8 object-cover rounded-full flex-shrink-0" 
                        alt={selectedUser?.fullname || "User"} 
                    /> */}
                    <div className="relative w-full">
                        <div 
                            className="bg-white pl-3 pr-3 pt-2 rounded-bl-2xl rounded-tr-2xl rounded-br-2xl shadow-sm message-content"
                        >
                            <MessageContent 
                                message={message}
                                showTimestamp={true}
                                audioRefs={audioRefs}
                                playingAudio={playingAudio}
                                toggleAudioPlay={toggleAudioPlay}
                                handleDownload={handleDownload}
                                formatFileSize={formatFileSize}
                                getFileIcon={getFileIcon}
                                setSelectedMessageForView={setSelectedMessageForView}
                            />
                        </div>
                        <p className="text-gray-400 text-xs mt-1">
                            {message.edited && <span className="ml-1 text-gray-500">(edited)</span>}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MessageItem;