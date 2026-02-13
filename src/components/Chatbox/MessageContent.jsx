import React from 'react';
import { 
    RiDownloadLine,
    RiMusicLine,
    RiPauseCircleLine,
    RiPlayCircleLine,
    RiImageAddLine,
    RiVideoLine,
    RiFileTextLine,
    RiAttachmentLine,
    RiCloseLine
} from 'react-icons/ri';
import { formatTimestamp } from '../../utils/formatTimestamp';

const MessageContent = ({
    message,
    showTimestamp,
    audioRefs,
    playingAudio,
    toggleAudioPlay,
    handleDownload,
    formatFileSize,
    getFileIcon,
    setSelectedMessageForView
}) => {
    
    const hasAttachment = message.attachments && message.attachments.length > 0;
    const isVoiceMessage = hasAttachment && message.attachments.some(a => 
        a.type === 'audio' || a.mimeType?.includes('audio') || a.name?.includes('voice_message')
    );

    const renderVoiceMessage = (attachment, messageId) => (
        <div className='bg-gradient-to-r from-blue-50 to-indigo-50 p-3 sm:p-4 rounded-lg w-full'>
            <div className='flex items-center gap-1 sm:gap-3 w-full'>
                <div className="bg-blue-100 p-2 sm:p-3 rounded-full">
                    <RiMusicLine className="text-blue-600 text-[14px] md:text-xl" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[14px] sm:text-sm font-medium text-gray-800 truncate">
                        {attachment.file || 'Voice message'}
                    </p>
                    <p className="text-[10px] md:text-xs text-gray-500">
                        {formatFileSize(attachment.size)} • Voice message
                    </p>
                </div>
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleAudioPlay(messageId, attachment.url);
                    }}
                    className="p-1 sm:p-2 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors"
                    title={playingAudio === messageId ? "Pause" : "Play"}
                >
                    {playingAudio === messageId ? 
                        <RiPauseCircleLine className="text-blue-600 text-[14px] sm:text-xl" /> : 
                        <RiPlayCircleLine className="text-blue-600 text-[14px] sm:text-xl" />
                    }
                </button>
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(attachment.url, attachment.file || 'voice_message.webm');
                    }}
                    className="p-1 sm:p-2 hover:bg-gray-200 rounded-full"
                    title="Download"
                >
                    <RiDownloadLine className="text-gray-600 text-[14px] sm:text-xl" />
                </button>
            </div>
            <audio 
                ref={(el) => audioRefs.current[messageId] = el} 
                className="hidden" 
                src={attachment.url}
            />
        </div>
    );

    const renderImageAttachment = (attachment) => (
        <div className='relative group'>
            <img 
                src={attachment.url} 
                alt={attachment.name} 
                className="max-w-full rounded-lg cursor-pointer max-h-[300px] object-cover hover:opacity-95 transition-opacity" 
                onClick={(e) => {
                    e.stopPropagation();
                    setSelectedMessageForView({ url: attachment.url, type: 'image'});
                }}
            />
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(attachment.url, attachment.name);
                }} 
                className="absolute bottom-2 right-2 bg-black/70 hover:bg-black/90 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200" 
                title='Download'
            >
                <RiDownloadLine/>
            </button>
        </div>
    );

    const renderVideoAttachment = (attachment) => (
        <div className='relative rounded-lg overflow-hidden bg-black'>
            <video 
                className='max-w-full rounded-lg max-h-[300px]' 
                controls
                onClick={(e) => e.stopPropagation()}
            >
                <source src={attachment.url} type='video/mp4'/>
                Your browser does not support the video tag.
            </video>
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(attachment.url, attachment.name);
                }}
                className="absolute bottom-2 right-2 bg-black/70 hover:bg-black/90 text-white p-2 rounded-full"
                title="Download"
            >
                <RiDownloadLine />
            </button>
        </div>
    );

    const renderFileAttachment = (attachment) => (
        <div className='bg-gray-50 hover:bg-gray-100 p-4 rounded-lg max-w-[300px] border border-gray-200 transition-colors cursor-pointer group'>
            <div className='flex items-center gap-3'>
                <div className={`p-3 rounded-lg ${
                    attachment.type === 'file' && attachment.mimeType === 'application/pdf' 
                        ? 'bg-red-100' 
                        : 'bg-blue-100'
                }`}>
                    {getFileIcon(attachment)}
                </div>
                <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium text-gray-800 truncate'>
                        {attachment.name}
                    </p>
                    <p className='text-xs text-gray-500'>{formatFileSize(attachment.size)}</p>
                </div>
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(attachment.url, attachment.name);
                    }}
                    className="p-2 hover:bg-gray-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Download"
                >
                    <RiDownloadLine className="text-gray-600" />
                </button>
            </div>
        </div>
    );

    return (
        <div className=''>
            {hasAttachment && (
                <div className='space-y-3'>
                    {message.attachments.map((attachment, index) => (
                        <div key={index} className='relative'>
                            {isVoiceMessage ? (
                                renderVoiceMessage(attachment, message.id + index)
                            ) : attachment.type === 'image' ? (
                                renderImageAttachment(attachment)
                            ) : attachment.type === 'video' ? (
                                renderVideoAttachment(attachment)
                            ) : attachment.type === 'audio' || attachment.mimeType?.includes('audio') ? (
                                renderVoiceMessage(attachment, message.id + index)
                            ) : (
                                renderFileAttachment(attachment)
                            )}
                        </div>
                    ))}
                </div>
            )}

            {message.text && message.text !== 'Photo' && message.text !== 'Video' && 
             message.text !== 'Audio' && message.text !== 'File' && message.text !== 'Voice message' && (
                <p className='text-md break-words whitespace-pre-wrap max-w-full overflow-hidden'>
                    {message.text}
                </p>
            )}

            {showTimestamp && (
                <div className="text-right">
                    <span className='text-[10px] text-gray-500 align-super'>
                        {formatTimestamp(message.timestamp)}
                    </span>
                </div>
            )}
        </div>
    );
};

export default MessageContent;