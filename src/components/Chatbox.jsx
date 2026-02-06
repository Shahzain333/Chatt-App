import React, { useState, useEffect, useMemo, useRef } from 'react';
import defaultAvatar from '../assets/default.jpg';
import { RiSendPlaneFill, RiArrowLeftLine, RiEditLine, RiDeleteBinLine, 
    RiCheckLine, RiCloseLine, RiMore2Fill, RiImageAddLine, RiVideoLine, 
    RiMusicLine, RiFileTextLine, RiAttachmentLine, 
    RiDownloadLine} from 'react-icons/ri';
import Logo from '../assets/logo.png';
import { formatTimestamp } from '../utils/formatTimestamp';
import firebaseService from '../services/firebaseServices';
import { useDispatch, useSelector } from 'react-redux';
import { 
  addMessage,
  setMessages, 
  setSelectedUser, 
  setLoading,
  updateMessage,
  deleteMessage,
  deleteChats,
  //setChats
} from '../store/chatSlice';
import LoadingScreen from './Chatlist/LoadingScreen';
import { toast } from 'sonner';

function Chatbox({ onBack }) {
    
    const [messageText, setMessageText] = useState('');
    const [editingMessage, setEditingMessage] = useState(null);
    const [activeMessageId, setActiveMessageId] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const [attachments, setAttachments] = useState([])
    const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [uploadProgress, setUploadProgress] = useState({});
    const [selectedMessageForView, setSelectedMessageForView] = useState(null);
    const [playingAudio, setPlayingAudio] = useState(null);
    const [fullscreenImage, setFullscreenImage] = useState(null);
    
    const scrollRef = useRef(null);
    const fileInputRef = useRef(null);
    const attachmentMenuRef = useRef(null);
    const audioRefs = useRef({})
    
    const dispatch = useDispatch();
    const { messages, selectedUser, loading } = useSelector(state => state.chat);
    const { currentUser } = useSelector(state => state.auth);
    
    const chatId = useMemo(() => {
        if (!selectedUser?.uid || !currentUser?.uid) return null;
        return currentUser.uid < selectedUser.uid 
            ? `${currentUser.uid}_${selectedUser.uid}`
            : `${selectedUser.uid}_${currentUser.uid}`;
    }, [selectedUser, currentUser]);

    // Messages listener
    useEffect(() => {
        if (chatId && selectedUser) {
            dispatch(setLoading(true));
            const unsubscribe = firebaseService.listenForMessages(chatId, (newMessages) => {
                // Parse attachments from JSON string
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

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollRef.current && !loading) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    // Clear Input and editing state When selectedUser change
    useEffect(() => {
        setMessageText('');
        setEditingMessage(null);
        setActiveMessageId(null);
        setIsSending(false);
        setAttachments([])
        setPreviewImage(null)
        setUploadProgress({})
        // Stop all audio when switching chats
        Object.values(audioRefs.current).forEach(audio => {
            if(audio) {
                audio.pause()
                audio.currentTime = 0
            }
        })
        setPlayingAudio(null);

    }, [selectedUser?.uid]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            const menu = document.querySelector('.mobile-menu');
            const menuButton = document.querySelector('.menu-button');

            if (menu && menuButton && !menu.contains(e.target) && !menuButton.contains(e.target)) {
                setIsMobileMenuOpen(false);
            }

            // Close attachment options
            if(attachmentMenuRef.current && 
                !attachmentMenuRef.current.contains(e.target) &&
                !e.target.closet('attachment-button')) {
                    setShowAttachmentOptions(false)
            }

        };

        // Only add event listener when menu is open
        // if (isMobileMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        //}

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };

    }, []);

    // Close message actions when clicking outside
    useEffect(() => {
        const handleClickOutsideMessage = (e) => {
            if (activeMessageId && !e.target.closest('.message-content') && !e.target.closest('.message-actions')) {
                setActiveMessageId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutsideMessage);
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutsideMessage);
        };
    }, [activeMessageId]);

    // Sorted Messages Function
    const sortedMessages = useMemo(() => {
        if (!messages || !Array.isArray(messages)) return [];
        
        return [...messages].sort((a, b) => {
            const aTime = new Date(a.timestamp || 0).getTime();
            const bTime = new Date(b.timestamp || 0).getTime();
            return aTime - bTime;
        });

    }, [messages]);

    // ===================== Filing Work =======================
    const handleFileSelect = (e) => {
        
        const  files = Array.from(e.target.files)
        const validFiles = []

        files.forEach(file => {
            // Check file size (max 100MB)
            if(file.size > 100 * 1024 * 1024) {
                toast.error(`File ${file.name} is too large (max 100MB)`)
                return
            }

            // check file type
            const fileType = file.type.split('/')[0]
            
            if(['image','video','audio'].includes(fileType) || file.type === 'application/pdf' ||
                file.type === 'application/msword' ||
                file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                    validFiles.push(file)
            } else {
                toast.error(`File type ${file.type} is not supported`);
            }

        })

        if(validFiles.length > 0) {
            setAttachments(prev => [...prev, ...validFiles])

            // Preview first Image
            const firstImage = validFiles.find(f => f.type.startsWith('image'))
            if(firstImage) {
                const reader = new FileReader()
                reader.onload = (e) => setPreviewImage(e.target.result)
                reader.readAsDataURL(firstImage)
            }
        }

        e.target.value = ''

    }

    const removeAttachment = (index) => {
        
        setAttachments(prev => prev.filter((_, i) => i !== index))

        // Update Preview if needed
        if(attachments[index]?.type.startsWith('image')) {
            
            const nextImage = attachments.find((a,i) => i !== index && a.type.startsWith('image'))
            
            if(nextImage) {
                const reader = new FileReader()
                reader.onload = (e) => setPreviewImage(e.target.result)
                reader.readAsDataURL(nextImage)
            } else {
                setPreviewImage(null)
            }

        }

    }

    const getFileIcon = (file) => {
        if (file.type.startsWith('image')) return <RiImageAddLine className="text-blue-500" />;
        if (file.type.startsWith('video')) return <RiVideoLine className="text-purple-500" />;
        if (file.type.startsWith('audio')) return <RiMusicLine className="text-green-500" />;
        if (file.type === 'application/pdf') return <RiFileTextLine className="text-red-500" />;
        if (file.type?.includes('document') || file.type?.includes('word')) return <RiFileTextLine className="text-blue-600" />;
        return <RiAttachmentLine className="text-gray-500" />;
    } 

    const formatFileSize = (bytes) => {
        if(!bytes) return '0 B'
        if(bytes < 1024) return bytes + ' B'
        if(bytes < 1024 * 1024) return (bytes/ 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB' 
    }
    
    const handleMessage = async (e) => {
        e.preventDefault();

        if ((!messageText.trim() && attachments.length === 0 ) || !selectedUser?.uid || !currentUser?.uid || !chatId || isSending) {
            return;
        }

        try {
            setIsSending(true);
            let uploadedAttachments = []

            // Upload File if any
            if(attachments.length > 0) {
                for(let i = 0; i < attachments.length; i++) {
                    
                    const file = attachments[i];
                    const progressKey = `${Date.now()}-${i}`

                    setUploadProgress(prev => ({
                        ...prev,
                        [progressKey]: 0
                    }))

                }
            }

            try {
                const uploadFile = await firebaseService.uploadFile(file, chatId, currentUser?.uid)
                uploadedAttachments.push(uploadFile)

                // upload progress to 100%
                setUploadProgress(prev => ({
                    ...prev,
                    [progressKey]: 100
                }))

                // Remove progress after a delay
                setTimeout(() => {
                    setUploadProgress(prev => {
                        const newProgress = { ...prev }
                        delete newProgress[progressKey];
                        return newProgress;
                    })
                }, 5000)

            } catch (uploadError) {
                console.error('Error uploading file:', uploadError);
                toast.error(`Failed to upload ${file.name}`);
                // Remove the failed progress
                setUploadProgress(prev => {
                    const newProgress = { ...prev };
                    delete newProgress[progressKey];
                    return newProgress;
                });
            }
            
            if (editingMessage) {
                // Update existing message
                await firebaseService.updateMessage(chatId, editingMessage.id, messageText.trim(), uploadedAttachments);
                
                // Update in Redux for immediate UI
                dispatch(updateMessage({
                    messageId: editingMessage.id,
                    newText: messageText.trim(),
                    attachments: uploadedAttachments
                }));
                
                setEditingMessage(null);

                toast.success('Message updated successfully', {
                    duration: 3000,
                });

            } else {
                // Send new message
                await firebaseService.sendMessage(
                    messageText.trim(), 
                    chatId, 
                    currentUser.uid, 
                    selectedUser.uid,
                    uploadedAttachments
                );
                
                //const tempMessageId = `temp-${Date.now()}`;
                const newMessage = {
                    id: chatId,
                    text: messageText.trim(),
                    sender: currentUser.email,
                    attachments: uploadedAttachments,
                    timestamp: new Date().toISOString(),
                };

                // Create a chat update object
                // const chatUpdate = {
                //     id: chatId,
                //     lastMessage: messageText.trim(),
                //     lastMessageTimestamp: new Date().toISOString(),
                //     otherUser: {
                //         uid: selectedUser.uid,
                //         email: selectedUser.email,
                //         username: selectedUser.username,
                //         fullName: selectedUser.fullname || selectedUser.fullName || "",
                //         image: selectedUser.image || ""
                //     }
                // };
                
                dispatch(addMessage(newMessage));
                //dispatch(setChats(chatUpdate))
                
                const successMessage = uploadedAttachments.length > 0 ? `${uploadedAttachments.length} 
                file${uploadedAttachments.length > 1 ? 's' : ''} sent!` : 'Message sent!';

                toast.success(successMessage, {
                    duration: 3000,
                });

            }
            
            // Clear form
            setMessageText('');
            setAttachments([]);
            setPreviewImage(null);
            
        } catch (error) {
            console.error("Error sending message:", error);
            toast.error('Failed to send message. Please try again.');
        } finally {
            setIsSending(false);
            setUploadProgress({})
        }
    };

    const handleBack = () => {
        dispatch(setSelectedUser(null));
        if (onBack && typeof onBack === 'function') {
            onBack();
        }
    };

    const handleMessageClick = (messageId, e) => {
        e.stopPropagation();
        setActiveMessageId(activeMessageId === messageId ? null : messageId);
    };

    const handleEdit = (message) => {
        setEditingMessage(message);
        setMessageText(message.text);
        setActiveMessageId(null);
    };

    const handleDelete = async (messageId) => {
        setActiveMessageId(null);

        toast(`Are you sure you want to delete this message?`, {
            description: 'This action cannot be undone.',
            duration: 3000,
            action: {
                label: 'Delete',
                onClick: async () => {
                    try {
                        dispatch(setLoading(true));
                        
                        // REMOVE FROM REDUX (for instant UI update)
                        dispatch(deleteMessage(messageId));

                        await firebaseService.deleteMessage(chatId, messageId);

                        toast.success('Message deleted successfully!', {
                            duration: 3000,
                        });

                    } catch (error) {
                        console.error('Error deleting message:', error);
                        
                        toast.error('Failed to delete message. Please try again.', {
                            duration: 3000,
                        });

                    } finally {
                        dispatch(setLoading(false));
                    }
                }
            },
            cancel: {
                label: 'Cancel',
                onClick: () => {
                    setActiveMessageId(null);
                }
            },
        });
    };

    const handleDownload = async (url, filename) =>{
        try {
            const link = document.createElement('a')
            link.href = url
            link.download = filename
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            toast.success('Download started')
        } catch (error) {
            console.error('Error downloading file:', error);
            toast.error('Failed to download file');
        }
    }

    const cancelEdit = () => {
        setEditingMessage(null);
        setMessageText('');
    };

    // Delete chats
    const handleDeleteSelectedUserChats = async () => {
        
        if (!selectedUser || !currentUser) {
            toast.info("Please select a user first to delete the chat.", {
                duration: 3000,
            });
            setIsMobileMenuOpen(false);
            return;
        }

        setIsMobileMenuOpen(false);

        toast(`Are you sure you want to delete all chats and messages with 
            ${selectedUser?.fullname || 'this user'}?`,{
                description: 'This action cannot be undone. All messages will be permanently deleted.',
                duration: 3000,
                action: {
                    label: 'Delete',
                    onClick: async () => {
                        try {
                            dispatch(setLoading(true));
                            dispatch(deleteChats(chatId));
                            await firebaseService.deleteChats(chatId);
                            dispatch(setSelectedUser(null));
                            dispatch(setMessages([]));
                            setIsMobileMenuOpen(false);
                            
                            // Toast for successful delete
                            toast.success(`Chat with ${selectedUser?.fullname || 'user'} deleted successfully!`, {
                                duration: 3000,
                            });

                        } catch (error) {
                            console.error('Error deleting chat:', error);
                            toast.error('Failed to delete chat. Please try again.', {
                                duration: 3000,
                            });
                        } finally {
                            dispatch(setLoading(false));
                        }
                    },
                },
                cancel: {
                    label: 'Cancel',
                    onClick: () => {
                        setIsMobileMenuOpen(false);
                    },
                },
            }
        );
    };

    // Toggle Audio Play
    const toggleAudioPlay = (messageId, audioUrl) => {

        const audioElement = audioRefs.current[messageId]

        if(!audioElement) return

        if(playingAudio === messageId) {
            audioElement.pause()
            setPlayingAudio(null)
        } else {
            // Stop currently playing audio
            if(playingAudio) {
                const currentAudio = audioRefs.current[playingAudio]

                if(currentAudio) {
                    currentAudio.pause()
                    currentAudio.currentTime = 0
                }

            }

            audioElement.play()
            setPlayingAudio(messageId)

            // Reset When Audio Ends
            audioElement.onended = () => {
                setPlayingAudio(null)
            }

        }

    }

    // Render message content with attachments
    const renderMessageContent = (msg) => {
        
        const hasAttachment = msg.attachments && msg.attachments.length > 0

        return (
            <div className='space-y-2'>
                {hasAttachment && (
                    <div className='space-y-3'>
                        {msg.attachments.map((attachment,index) => (
                            <div key={index} className='relative'>
                                
                                {attachment.type === 'image' ? (
                                    
                                    <div className='relative group'>
                                        <img src={attachment.url} alt={attachment.name} className="max-w-full rounded-lg cursor-pointer 
                                            max-h-[300px] object-cover hover:opacity-95 transition-opacity" onClick={() => 
                                            setSelectedMessageForView({ url: attachment.url, type: 'image'})}
                                        />
                                        <button onClick={(e) => {
                                            e.stopPropagation()
                                            handleDownload(attachment.url, attachment.name)
                                        }} className="absolute bottom-2 right-2 bg-black/70 hover:bg-black/90 text-white p-2 rounded-full 
                                        opacity-0 group-hover:opacity-100 transition-all duration-200" title='Download'>
                                            <RiDownloadLine/>
                                        </button>
                                    </div>

                                ) : attachment.type === 'video' ? (
                                    
                                    <div className='relative rounded-lg overflow-hidden bg-black'>
                                        <video className='max-w-full rounded-lg max-h-[300px]' controls
                                            poster="https://images.unsplash.com/photo-1536240478700-b869070f9279?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80">
                                                <source src={attachment.url} type='video/mp4'/>
                                                Your browser does not support the video tag.
                                        </video>
                                        <button onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownload(attachment.url, attachment.name);
                                            }}
                                            className="absolute bottom-2 right-2 bg-black/70 hover:bg-black/90 text-white p-2 rounded-full"
                                            title="Download"
                                        >
                                            <RiDownloadLine />
                                        </button>
                                    </div>

                                ) : attachment.type === 'audio' ? (
                                    
                                    <div className='bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg max-w-[300px]'>
                                        <div className='flex items-center gap-3'>
                                            
                                            <div className="bg-blue-100 p-3 rounded-full">
                                                <RiMusicLine className="text-blue-600 text-xl" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-800 truncate">{attachment.name}</p>
                                                <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                                            </div>
                                            <button onClick={() => toggleAudioPlay(msg.id + index, attachment.url)}
                                            className="p-2 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors">
                                                { playingAudio === msg.id + index ? <RiPauseCircleLine className="text-blue-600 text-xl" /> : 
                                                    <RiPlayCircleLine className="text-blue-600 text-xl" />
                                                }
                                            </button>
                                            <button onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDownload(attachment.url, attachment.name);
                                                }}
                                                className="p-2 hover:bg-gray-200 rounded-full"
                                                title="Download"
                                            >
                                                <RiDownloadLine className="text-gray-600" />
                                            </button>
                                        </div>

                                        <audio ref={(el) => audioRefs.current[msg.id + index] = el} className="hidden" src={attachment.url}/>

                                    </div>

                                ) : (
                                    <div></div>
                                )}

                            </div>
                        ))}
                    </div>
                )}
            </div>
        )

    }

    // Show loading state
    if (loading && messages.length === 0) {
        return <LoadingScreen message="Loading messages..." />;
    }

    if (!selectedUser) {
        return (
            <section className="h-screen w-full bg-[#e5f6f3]">
                <div className="flex flex-col justify-center items-center h-full">
                    <img src={Logo} alt="Chatfrik Logo" width={100} />
                    <h1 className="text-3xl font-bold text-teal-700 mt-5">Welcome to Chatfrik</h1>
                    <p className="text-gray-500">Connect and chat with friends easily, securely, fast and free</p>
                </div>
            </section>
        );
    }

    const toggleMenuList = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    return (
        <section className='flex flex-col h-full w-full app-background'>
            
            {/* Header Of ChatBox */}
            <header className='flex justify-between border-b border-gray-400 w-full h-[75px] p-4 
            bg-white flex-shrink-0 relative'>
                <main className='flex items-center gap-2'>
                    <button 
                        onClick={handleBack} 
                        className='flex items-center justify-center text-gray-600 
                        hover:bg-gray-100 rounded-full transition-colors p-1 cursor-pointer'
                        aria-label="Back to chat list"
                        disabled={isSending}
                    >
                        <RiArrowLeftLine className='text-2xl' />
                    </button>

                    <img 
                        src={selectedUser?.image || defaultAvatar} 
                        className='w-11 h-11 object-cover rounded-full' 
                        alt={selectedUser?.fullname || "User"} 
                    />
                    
                    <div className='flex-1'>
                        <h3 className='font-semibold text-[#2A3D39] text-lg'>
                            {selectedUser?.fullname || "Chatfrik User"}
                        </h3>
                        <p className='font-light text-[#2A3D39] text-sm'>
                            @{selectedUser?.username || "chatfrik"}
                        </p>
                    </div>
                </main>

                <button 
                    className="flex items-center justify-center w-10 h-10
                    rounded-lg transition-colors cursor-pointer menu-button"
                    aria-label="More options"
                    onClick={toggleMenuList}
                    disabled={isSending}
                >
                    {isMobileMenuOpen ? <RiCloseLine color="#01AA85" /> : <RiMore2Fill color="#01AA85" />}
                </button>

                {isMobileMenuOpen && (
                    <div className="mobile-menu absolute top-16 right-4 md:top-14 md:right-4 bg-white border 
                    border-gray-200 rounded-lg shadow-xl z-50 min-w-[120px] py-2">
                        <ul className="space-y-1">
                            <li>
                                <button 
                                    className="flex items-center gap-3 w-full px-4 py-3 text-left 
                                    hover:bg-red-50 transition-colors text-red-600" 
                                    onClick={handleDeleteSelectedUserChats}
                                >
                                    <RiDeleteBinLine className="text-red-500 text-lg" />
                                    <span className="text-sm font-medium">Delete Chat</span>
                                </button>
                            </li>
                        </ul>
                    </div>
                )}
            </header>

            <main className='flex flex-col flex-1 w-full overflow-hidden'>
                
                <section className='flex-1 overflow-hidden px-3 pt-5'>
                    
                    <div ref={scrollRef} className='h-full overflow-y-auto custom-scrollbar'>
                        
                        <div className='min-h-full flex flex-col justify-end'>
                            {sortedMessages.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center text-gray-500 py-8">
                                    <p>No messages yet. Start the conversation!</p>
                                </div>
                            ) : (
                                sortedMessages.map((msg, index) => (
                                    <div key={msg.id || `msg-${index}`} className="mb-4 relative">
                                        {msg.sender === currentUser?.email ? (
                                            <div className="flex flex-col items-end w-full">
                                                <div className="flex gap-3 me-5 max-w-[80%]">
                                                    <div className="relative">
                                                        <div 
                                                            className="bg-white p-3 rounded-lg shadow-sm message-content cursor-pointer hover:bg-gray-50 transition-colors"
                                                            onClick={(e) => handleMessageClick(msg.id, e)}
                                                        >
                                                            <p className='text-md'>
                                                                {msg.text || ''}
                                                                <span className='ml-2 text-[10px] text-gray-500 align-super'>
                                                                    {formatTimestamp(msg.timestamp)}
                                                                </span>
                                                            </p>
                                                        </div>
                                                        
                                                        {/* Edit/Delete Actions for sender's messages */}
                                                        {activeMessageId === msg.id && (
                                                            <div className="absolute right-0 -top-12 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex gap-2 z-10 message-actions">
                                                                <button 
                                                                    onClick={() => handleEdit(msg)}
                                                                    className="p-2 hover:bg-gray-100 rounded transition-colors"
                                                                    title="Edit"
                                                                >
                                                                    <RiEditLine className="text-gray-600" />
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleDelete(msg.id)}
                                                                    className="p-2 hover:bg-gray-100 rounded transition-colors text-red-500"
                                                                    title="Delete"
                                                                >
                                                                    <RiDeleteBinLine />
                                                                </button>
                                                            </div>
                                                        )}
                                                        
                                                        <p className="text-gray-400 text-xs mt-1 text-right">
                                                            {msg.edited && <span className="ml-1 text-gray-500">(edited)</span>}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-start w-full">
                                                <div className="flex gap-3 max-w-[80%] ms-5">
                                                    <img 
                                                        src={selectedUser?.image || defaultAvatar} 
                                                        className="h-8 w-8 object-cover rounded-full mt-1" 
                                                        alt={selectedUser?.fullname || "User"} 
                                                    />
                                                    <div className="relative">
                                                        <div className="bg-white p-3 rounded-lg shadow-sm message-content">
                                                            <p className='text-md'>
                                                                {msg.text || ''}
                                                                <span className='ml-2 text-[10px] text-gray-500 align-super'>
                                                                    {formatTimestamp(msg.timestamp)}
                                                                </span>
                                                            </p>
                                                        </div>
                                                        <p className="text-gray-400 text-xs mt-1">
                                                            {msg.edited && <span className="ml-1 text-gray-500">(edited)</span>}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    
                </section>

                {/* Form */}
                <div className='p-4 w-full bg-white flex-shrink-0'>
                    
                    <form onSubmit={handleMessage} className='flex items-center bg-green-200 
                    h-[55px] w-full px-2 rounded-lg relative shadow-lg'>

                        {/* Hidden file input */}
                        <input
                           type='file'
                           ref={fileInputRef}
                           multiple
                           accept='image/*,video/*,audio/*,.pdf'
                           onChange={handleFileSelect}
                           className='hidden'
                        />

                        {/* Attachment Button with Options Menu */}
                        <div className='relative'>
                            
                            <button type='button' className='p-2 text-gray-600 hover:text-teal-600 transition-colors attachment-button'
                            onClick={() => setShowAttachmentOptions(!showAttachmentOptions)} disabled={isSending}>
                                <RiAttachmentLine className='text-xl'/>
                            </button>

                            {/* Attachment Options Menu */}
                            {showAttachmentOptions && (
                                <div ref={attachmentMenuRef} className='absolute bottom-14 left-0 bg-white border border-gray-200 rounded-lg 
                                    shadow-xl z-50 py-2 min-w-[200px]'>

                                    <button type='button' className='flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 
                                    transition-colors' 
                                    onClick={() => {
                                        fileInputRef.current.click()
                                        setShowAttachmentOptions(false)
                                    }}>
                                        <RiImageAddLine className='text-blue-500'/>
                                        <span className='text-sm'>Photos & Videos</span>
                                    </button>

                                    <button type='button' className='flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 
                                    transition-colors' 
                                    onClick={() => {
                                        fileInputRef.current.accept = '.pdf,.doc,.docx,.txt'
                                        fileInputRef.current.click()
                                        setShowAttachmentOptions(false)
                                    }}>
                                        <RiFileTextLine className='text-green-500'/>
                                        <span className='text-sm'>Documents</span>
                                    </button>

                                    <button type='button' className='flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 
                                    transition-colors' 
                                    onClick={() => {
                                        fileInputRef.current.accept = 'audio/*'
                                        fileInputRef.current.click()
                                        setShowAttachmentOptions(false)
                                    }}>
                                        <RiFileTextLine className='text-purple-500'/>
                                        <span className='text-sm'>Audio</span>
                                    </button>
                                
                                </div>
                            
                            )}

                        </div>

                        <input 
                            type='text'
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            placeholder={editingMessage ? 'Edit your message...' : (isSending ? 'Sending message...' : 'Write Your Message....')}
                            className='h-full text-[#2A3D39] outline-none text-base pl-3 pr-[50px] rounded-lg w-[98%] disabled:opacity-50 bg-transparent'
                            disabled={isSending}
                        />
                        <div className="absolute right-5 flex gap-1">
                            {editingMessage && (
                                <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="p-2 hover:bg-red-100 rounded transition-colors"
                                    title="Cancel edit"
                                    disabled={isSending}
                                >
                                    <RiCloseLine className="text-red-500" />
                                </button>
                            )}
                            <button 
                                type='submit' 
                                disabled={!messageText.trim() || isSending}
                                className='flex items-center justify-center p-2 rounded-full 
                                bg-[#D9f2ed] hover:bg-[#c8eae3] disabled:opacity-50 
                                disabled:cursor-not-allowed transition-colors min-w-[40px] cursor-pointer'
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
                        </div>

                    </form>
            
                </div>

            </main>

        </section>
    );
}

export default Chatbox;