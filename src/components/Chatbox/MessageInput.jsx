import React, { useRef } from 'react';
import { 
    RiSendPlaneFill, 
    RiAttachmentLine, 
    RiImageAddLine, 
    RiFileTextLine, 
    RiMusicLine, 
    RiCloseLine, 
    RiCheckLine,
    RiMic2Fill
} from 'react-icons/ri';

const MessageInput = ({
    messageText,
    setMessageText,
    editingMessage,
    isSending,
    isRecording,
    isRecordingAllowed,
    attachments,
    onSend,
    onCancelEdit,
    onFileSelect,
    onStartRecording,
    onStopRecording,
    showAttachmentOptions,
    setShowAttachmentOptions,
    attachmentMenuRef
}) => {
    const fileInputRef = useRef(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSend(e);
    };

    return (
        <div className='p-4 w-full bg-white flex-shrink-0'>
            <form onSubmit={handleSubmit} className='flex items-center bg-green-200 h-[55px] w-full px-2 rounded-lg relative shadow-lg'>
                <input
                    type='file'
                    ref={fileInputRef}
                    multiple
                    accept='image/*,video/*,audio/*,.pdf,.doc,.docx,.txt'
                    onChange={onFileSelect}
                    className='hidden'
                />

                <div className='relative'>
                    <button 
                        type='button' 
                        className='p-2 text-gray-600 hover:text-teal-600 transition-colors attachment-button'
                        onClick={() => setShowAttachmentOptions(!showAttachmentOptions)} 
                        disabled={isSending || isRecording}
                    >
                        <RiAttachmentLine className='text-xl'/>
                    </button>

                    {showAttachmentOptions && (
                        <div 
                            ref={attachmentMenuRef} 
                            className='absolute bottom-14 left-0 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-2 min-w-[200px]'
                        >
                            <button 
                                type='button' 
                                className='flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors' 
                                onClick={() => {
                                    fileInputRef.current.accept = 'image/*,video/*';
                                    fileInputRef.current.click();
                                    setShowAttachmentOptions(false);
                                }}
                            >
                                <div className="bg-blue-100 p-2 rounded-lg">
                                    <RiImageAddLine className="text-blue-600 text-lg" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-800">Photos & Videos</p>
                                </div>
                            </button>

                            <button 
                                type='button' 
                                className='flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors' 
                                onClick={() => {
                                    fileInputRef.current.accept = '.pdf,.doc,.docx,.txt';
                                    fileInputRef.current.click();
                                    setShowAttachmentOptions(false);
                                }}
                            >
                                <div className="bg-green-100 p-2 rounded-lg">
                                    <RiFileTextLine className="text-green-600 text-lg" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-800">Document</p>
                                </div>
                            </button>

                            <button 
                                type='button' 
                                className='flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors' 
                                onClick={() => {
                                    fileInputRef.current.accept = 'audio/*';
                                    fileInputRef.current.click();
                                    setShowAttachmentOptions(false);
                                }}
                            >
                                <div className="bg-purple-100 p-2 rounded-lg">
                                    <RiMusicLine className="text-purple-600 text-lg" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-800">Audio File</p>
                                </div>
                            </button>
                        </div>
                    )}
                </div>
                    
                <input 
                    type='text'
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={
                        isRecording ? 'Recording... Click stop to send' : 
                        editingMessage ? 'Edit your message...' : 
                        (isSending ? 'Sending message...' : 'Write Your Message...')
                    }
                    className='h-full text-[#2A3D39] outline-none text-base pl-3 pr-[100px] rounded-lg w-[98%] disabled:opacity-50 bg-transparent'
                    disabled={isSending || isRecording}
                    readOnly={isRecording}
                />
                
                <div className="absolute right-5 flex gap-1">
                    {isRecording ? (
                        <button 
                            type="button"
                            onClick={onStopRecording}
                            className="p-2 rounded-full bg-red-100 hover:bg-red-200 transition-colors min-w-[40px] cursor-pointer"
                            aria-label="Stop recording"
                        >
                            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                        </button>
                    ) : (
                        <>
                            {(messageText.trim() || attachments.length > 0) && (
                                <>
                                    {editingMessage && (
                                        <button
                                            type="button"
                                            onClick={onCancelEdit}
                                            className="p-2 hover:bg-red-100 rounded transition-colors"
                                            title="Cancel edit"
                                            disabled={isSending}
                                        >
                                            <RiCloseLine className="text-red-500" />
                                        </button>
                                    )}
                                    <button 
                                        type='submit' 
                                        disabled={(!messageText.trim() && attachments.length === 0) || isSending}
                                        className='flex items-center justify-center p-2 rounded-full bg-[#D9f2ed] hover:bg-[#c8eae3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[40px] cursor-pointer'
                                        aria-label={editingMessage ? "Update message" : (isSending ? "Sending message..." : "Send message")}
                                    >
                                        {isSending ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
                                        ) : editingMessage ? (
                                            <RiCheckLine color="#01AA85" />
                                        ) : (
                                            <RiSendPlaneFill color="#01AA85" />
                                        )}
                                    </button>
                                </>
                            )}
                            {!messageText.trim() && attachments.length === 0 && !editingMessage && (
                                <button
                                    type="button"
                                    onClick={onStartRecording}
                                    disabled={!isRecordingAllowed || isSending}
                                    className="p-2 rounded-full bg-[#D9f2ed] hover:bg-[#c8eae3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[40px] cursor-pointer"
                                    title={isRecordingAllowed ? "Record voice message" : "Microphone access required"}
                                >
                                    <RiMic2Fill color="#01AA85" className="text-xl" />
                                </button>
                            )}
                        </>
                    )}
                </div>
            </form>
        </div>
    );
};

export default MessageInput;