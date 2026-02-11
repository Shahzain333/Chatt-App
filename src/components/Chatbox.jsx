import React, { useState, useEffect, useMemo, useRef } from 'react';
import defaultAvatar from '../assets/default.jpg';
import { 
    RiSendPlaneFill, 
    RiArrowLeftLine, 
    RiEditLine, 
    RiDeleteBinLine, 
    RiCheckLine, 
    RiCloseLine, 
    RiMore2Fill, 
    RiImageAddLine, 
    RiVideoLine, 
    RiMusicLine, 
    RiFileTextLine, 
    RiAttachmentLine, 
    RiDownloadLine,
    RiImageLine,
    RiCloseCircleFill,
    RiMic2Fill,
    RiPauseCircleLine,
    RiPlayCircleLine
} from 'react-icons/ri';
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
} from '../store/chatSlice';
import LoadingScreen from './Chatlist/LoadingScreen';
import { toast } from 'sonner';

function Chatbox({ onBack }) {
    
    const [messageText, setMessageText] = useState('');
    const [editingMessage, setEditingMessage] = useState(null);
    const [activeMessageId, setActiveMessageId] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const [attachments, setAttachments] = useState([]);
    const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [uploadProgress, setUploadProgress] = useState({});
    const [selectedMessageForView, setSelectedMessageForView] = useState(null);
    const [playingAudio, setPlayingAudio] = useState(null);
    
    // Voice recording states
    const [isRecording, setIsRecording] = useState(false);
    const [isRecordingAllowed, setIsRecordingAllowed] = useState(false);
    
    const scrollRef = useRef(null);

    // File Send Refs
    const fileInputRef = useRef(null);
    const attachmentMenuRef = useRef(null);
    const audioRefs = useRef({});
    
    // Voice recording refs
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    
    const dispatch = useDispatch();
    const { messages, selectedUser, loading } = useSelector(state => state.chat);
    const { currentUser } = useSelector(state => state.auth);
    
    const chatId = useMemo(() => {
        if (!selectedUser?.uid || !currentUser?.uid) return null;
        return currentUser.uid < selectedUser.uid 
            ? `${currentUser.uid}_${selectedUser.uid}`
            : `${selectedUser.uid}_${currentUser.uid}`;
    }, [selectedUser, currentUser]);

    // Check microphone permissions on mount
    useEffect(() => {
        checkMicrophonePermission();
        
        return () => {
            // Cleanup recording if active when component unmounts
            if (isRecording) {
                stopRecording();
            }
        };
    }, []);

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
        setAttachments([]);
        setPreviewImage(null);
        setUploadProgress({});
        
        // Stop all audio when switching chats
        Object.values(audioRefs.current).forEach(audio => {
            if(audio) {
                audio.pause();
                audio.currentTime = 0;
            }
        });
        setPlayingAudio(null);
        
        // Stop recording if active
        if (isRecording) {
            stopRecording();
        }

    }, [selectedUser?.uid]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            const menu = document.querySelector('.mobile-menu');
            const menuButton = document.querySelector('.menu-button');
            const attachmentButton = document.querySelector('.attachment-button');

            if (menu && menuButton && !menu.contains(e.target) && !menuButton.contains(e.target)) {
                setIsMobileMenuOpen(false);
            }

            if(attachmentButton && !attachmentButton.contains(e.target)) {
                setIsMobileMenuOpen(false);
            }

            // Close attachment options
            if(attachmentMenuRef.current && 
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

    // Check microphone permission
    const checkMicrophonePermission = async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                toast.error('Your browser does not support voice recording');
                setIsRecordingAllowed(false);
                return;
            }
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            setIsRecordingAllowed(true);
        } catch (error) {
            console.error('Microphone permission error:', error);
            setIsRecordingAllowed(false);
            toast.error('Microphone access is required for voice messages');
        }
    };

    // ========================== Voice Message Feature =================================
    const startRecording = async () => {
        try {
            if (!isRecordingAllowed) {
                await checkMicrophonePermission();
                if (!isRecordingAllowed) return;
            }

            audioChunksRef.current = [];
            setMessageText('Recording...');
            setIsRecording(true);
            toast.info('Recording started... Speak now! Click stop to send.');

            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });

            const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm;codecs=opus' 
                : MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '';

            if (!mimeType) {
                toast.error('Your browser does not support audio recording');
                setIsRecording(false);
                setMessageText('');
                return;
            }

            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = async () => {
                if (audioChunksRef.current.length === 0) {
                    toast.error('No audio recorded');
                    return;
                }
                
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                await sendVoiceMessage(audioBlob);
                
                // Stop all tracks
                stream.getTracks().forEach(track => {
                    track.stop();
                    track.enabled = false;
                });
            };

            mediaRecorderRef.current.onerror = (event) => {
                console.error('MediaRecorder error:', event.error);
                toast.error('Recording error occurred');
                stopRecording();
            };

            mediaRecorderRef.current.start(100); // Collect data every 100ms

        } catch (error) {
            console.error('Error starting recording:', error);
            toast.error('Failed to start recording: ' + error.message);
            setIsRecording(false);
            setMessageText('');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            
            // Stop all tracks if they exist
            if (mediaRecorderRef.current.stream) {
                mediaRecorderRef.current.stream.getTracks().forEach(track => {
                    track.stop();
                    track.enabled = false;
                });
            }
        }
        setMessageText('');
    };

    const sendVoiceMessage = async (audioBlob) => {
        if (!audioBlob || !selectedUser?.uid || !currentUser?.uid || !chatId) {
            toast.error('No recording to send');
            return;
        }

        try {
            setIsSending(true);
            
            // Create a unique filename
            const timestamp = new Date().getTime();
            const filename = `voice_message_${timestamp}.webm`;
            
            // Create a file from blob
            const audioFile = new File([audioBlob], filename, { 
                type: audioBlob.type,
                lastModified: timestamp 
            });

            // Upload the voice message
            const uploadedAttachment = await firebaseService.uploadFile(audioFile, chatId, currentUser.uid);

            // Send message with voice attachment
            await firebaseService.sendMessage(
                'Voice message', 
                chatId, 
                currentUser.uid, 
                selectedUser.uid,
                [uploadedAttachment]
            );

            // Add to Redux for immediate UI update
            const newMessage = {
                id: chatId,
                text: 'Voice message',
                sender: currentUser.email,
                attachments: [uploadedAttachment],
                timestamp: new Date().toISOString(),
            };
            
            dispatch(addMessage(newMessage));

            toast.success('Voice message sent!');

        } catch (error) {
            console.error('Error sending voice message:', error);
            toast.error('Failed to send voice message: ' + error.message);
        } finally {
            setIsSending(false);
        }
    };

    // Toggle Audio Play for received voice messages
    const toggleAudioPlay = (messageId, audioUrl) => {
        const audioElement = audioRefs.current[messageId];

        if (!audioElement) return;

        if (playingAudio === messageId) {
            audioElement.pause();
            setPlayingAudio(null);
        } else {
            // Stop currently playing audio
            if (playingAudio) {
                const currentAudio = audioRefs.current[playingAudio];
                if (currentAudio) {
                    currentAudio.pause();
                    currentAudio.currentTime = 0;
                }
            }

            audioElement.play();
            setPlayingAudio(messageId);

            // Reset when audio ends
            audioElement.onended = () => {
                setPlayingAudio(null);
            };
            
            audioElement.onerror = () => {
                toast.error('Failed to play audio');
                setPlayingAudio(null);
            };
        }
    };

    // ===================== File Handling =======================
    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = [];

        files.forEach(file => {
            // Check file size (max 100MB)
            if(file.size > 100 * 1024 * 1024) {
                toast.error(`File ${file.name} is too large (max 100MB)`);
                return;
            }

            // Check file type
            const fileType = file.type.split('/')[0];
            
            if(['image','video','audio'].includes(fileType) || 
               file.type === 'application/pdf' ||
               file.type === 'application/msword' ||
               file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                validFiles.push(file);
            } else {
                toast.error(`File type ${file.type} is not supported`);
            }
        });

        if(validFiles.length > 0) {
            setAttachments(prev => [...prev, ...validFiles]);

            // Preview first Image
            const firstImage = validFiles.find(f => f.type.startsWith('image'));
            if(firstImage) {
                const reader = new FileReader();
                reader.onload = (e) => setPreviewImage(e.target.result);
                reader.readAsDataURL(firstImage);
            }
        }

        e.target.value = '';
    };

    // Remove Attachments File 
    const removeAttachment = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));

        // Update Preview if needed
        if(attachments[index]?.type.startsWith('image')) {
            const nextImage = attachments.find((a,i) => i !== index && a.type.startsWith('image'));
            
            if(nextImage) {
                const reader = new FileReader();
                reader.onload = (e) => setPreviewImage(e.target.result);
                reader.readAsDataURL(nextImage);
            } else {
                setPreviewImage(null);
            }
        }
    };

    const getFileIcon = (file) => {
        if (file.type.startsWith('image')) return <RiImageAddLine className="text-blue-500" />;
        if (file.type.startsWith('video')) return <RiVideoLine className="text-purple-500" />;
        if (file.type.startsWith('audio')) return <RiMusicLine className="text-green-500" />;
        if (file.type === 'application/pdf') return <RiFileTextLine className="text-red-500" />;
        if (file.type?.includes('document') || file.type?.includes('word')) return <RiFileTextLine className="text-blue-600" />;
        return <RiAttachmentLine className="text-gray-500" />;
    };

    const formatFileSize = (bytes) => {
        if(!bytes) return '0 B';
        if(bytes < 1024) return bytes + ' B';
        if(bytes < 1024 * 1024) return (bytes/ 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    // Download File / Images
    const handleDownload = async (url, filename) => {
        let blobUrl = null
        try {

            const response = await fetch(url)

            if(!response.ok) {
                throw new Error(`Failed to fetch file: ${response.status}`);
            }

            const blob = await response.blob()
            blobUrl = window.URL.createObjectURL(blob)

            // Create and use link without appending to DOM
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            // document.body.appendChild(link);
            link.click();
            
            // Cleanup
            // setTimeout(() => {
            //     document.body.removeChild(link);
            //     window.URL.revokeObjectURL(blob)
            // }, 100)

            toast.success('Downloaded');

        } catch (error) {
            console.error('Error downloading file:', error);
            toast.error('Failed to download file');
        } finally {
            if(blobUrl) {
                setTimeout(() => {
                    window.URL.revokeObjectURL(blobUrl);
                }, 0);
            }
        }
    };
    
    // ============================== Handle Messages ====================================
    const handleMessage = async (e) => {
        e.preventDefault();

        if ((!messageText.trim() && attachments.length === 0 ) || !selectedUser?.uid || !currentUser?.uid || !chatId || isSending || isRecording) {
            return;
        }

        try {
            setIsSending(true);
            let uploadedAttachments = [];

            // Upload File if any
            if(attachments.length > 0) {
                for(let i = 0; i < attachments.length; i++) {
                    const file = attachments[i];
                    const progressKey = `${Date.now()}-${i}`;

                    setUploadProgress(prev => ({
                        ...prev,
                        [progressKey]: 0
                    }));

                    try {
                        const uploadFile = await firebaseService.uploadFile(file, chatId, currentUser?.uid);
                        uploadedAttachments.push(uploadFile);

                        // upload progress to 100%
                        setUploadProgress(prev => ({
                            ...prev,
                            [progressKey]: 100
                        }));

                        // Remove progress after a delay
                        setTimeout(() => {
                            setUploadProgress(prev => {
                                const newProgress = { ...prev };
                                delete newProgress[progressKey];
                                return newProgress;
                            });
                        }, 5000);

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
                }
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
                
                const newMessage = {
                    id: chatId,
                    text: messageText.trim(),
                    sender: currentUser.email,
                    attachments: uploadedAttachments,
                    timestamp: new Date().toISOString(),
                };
                
                dispatch(addMessage(newMessage));
               
                const successMessage = uploadedAttachments.length > 0 
                    ? `${uploadedAttachments.length} file${uploadedAttachments.length > 1 ? 's' : ''} sent!` 
                    : 'Message sent!';

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
            setUploadProgress({});
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

    // Render voice message UI
    const renderVoiceMessage = (attachment, messageId) => {
        return (
            <div className='bg-gradient-to-r from-blue-50 to-indigo-50 p-3 sm:p-4 rounded-lg w-full '>
                <div className='flex items-center gap-1 sm:gap-3 w-full'>
                    
                    <div className="bg-blue-100 p-2 sm:p-3 rounded-full">
                        <RiMusicLine className="text-blue-600 text-[14px] md:text-xl" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className=" text-[14px] sm:text-sm font-medium text-gray-800 truncate">
                            {attachment.file || 'Voice message'}
                        </p>
                        <p className="text-[10px] md:text-xs text-gray-500">
                            {formatFileSize(attachment.size)} • Voice message
                        </p>
                    </div>

                    <button 
                        onClick={() => toggleAudioPlay(messageId, attachment.url)}
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
    };

    // Render Message Content
    const renderMessageContent = (msg, showTimestamp = false) => {
        
        const hasAttachment = msg.attachments && msg.attachments.length > 0;

        // Check if message is a voice message
        const isVoiceMessage = hasAttachment && msg.attachments.some(a => 
            a.type === 'audio' || a.mimeType?.includes('audio') || a.name?.includes('voice_message')
        );

        return (
            <div className=''>
                {hasAttachment && (
                    <div className='space-y-3'>
                        {msg.attachments.map((attachment, index) => (
                            <div key={index} className='relative'>
                                {isVoiceMessage ? (
                                    renderVoiceMessage(attachment, msg.id + index)
                                ) : attachment.type === 'image' ? (
                                    <div className='relative group'>
                                        <img 
                                            src={attachment.url} 
                                            alt={attachment.name} 
                                            className="max-w-full rounded-lg cursor-pointer max-h-[300px] object-cover hover:opacity-95 transition-opacity" 
                                            onClick={() => setSelectedMessageForView({ url: attachment.url, type: 'image'})}
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
                                ) : attachment.type === 'video' ? (
                                    <div className='relative rounded-lg overflow-hidden bg-black'>
                                        <video 
                                            className='max-w-full rounded-lg max-h-[300px]' 
                                            controls
                                            poster="https://images.unsplash.com/photo-1536240478700-b869070f9279?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80"
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
                                ) : attachment.type === 'audio' || attachment.mimeType?.includes('audio') ? (
                                    // Regular audio file UI (not voice message)
                                    // <div className='bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg max-w-[300px] border border-purple-100'>
                                    //     <div className='flex items-center gap-3'>
                                    //         <div className="bg-purple-100 p-3 rounded-full">
                                    //             <RiMusicLine className="text-purple-600 text-xl" />
                                    //         </div>
                                    //         <div className="flex-1">
                                    //             <p className="text-sm font-medium text-gray-800 truncate">
                                    //                 {attachment.name || 'Audio file'}
                                    //             </p>
                                    //             <p className="text-xs text-gray-500">
                                    //                 {formatFileSize(attachment.size)} • Audio
                                    //             </p>
                                    //         </div>
                                    //         <audio 
                                    //             ref={(el) => audioRefs.current[msg.id + index] = el} 
                                    //             className="hidden" 
                                    //             src={attachment.url}
                                    //         />
                                    //         <button 
                                    //             onClick={() => {
                                    //                 const audioUrl = attachment.url;
                                    //                 const audioElement = audioRefs.current[msg.id + index];
                                    //                 if (playingAudio === (msg.id + index)) {
                                    //                     audioElement?.pause();
                                    //                     setPlayingAudio(null);
                                    //                 } else {
                                    //                     if (playingAudio) {
                                    //                         const currentAudio = audioRefs.current[playingAudio];
                                    //                         currentAudio?.pause();
                                    //                         currentAudio.currentTime = 0;
                                    //                     }
                                    //                     audioElement?.play();
                                    //                     setPlayingAudio(msg.id + index);
                                    //                     audioElement.onended = () => setPlayingAudio(null);
                                    //                 }
                                    //             }}
                                    //             className="p-2 bg-purple-100 hover:bg-purple-200 rounded-full transition-colors"
                                    //             title={playingAudio === (msg.id + index) ? "Pause" : "Play"}
                                    //         >
                                    //             {playingAudio === (msg.id + index) ? 
                                    //                 <RiPauseCircleLine className="text-purple-600 text-xl" /> : 
                                    //                 <RiPlayCircleLine className="text-purple-600 text-xl" />
                                    //             }
                                    //         </button>
                                    //         <button 
                                    //             onClick={(e) => {
                                    //                 e.stopPropagation();
                                    //                 handleDownload(attachment.url, attachment.name || 'audio_file.mp3');
                                    //             }}
                                    //             className="p-2 hover:bg-gray-200 rounded-full"
                                    //             title="Download"
                                    //         >
                                    //             <RiDownloadLine className="text-gray-600" />
                                    //         </button>
                                    //     </div>
                                    // </div>
                                    renderVoiceMessage(attachment, msg.id + index)
                                ) : (
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
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {msg.text && msg.text !== 'Photo' && msg.text !== 'Video' && msg.text !== 'Audio' && 
                 msg.text !== 'File' && msg.text !== 'Voice message' && (
                    <p className='text-md break-words whitespace-pre-wrap max-w-full overflow-hidden'>
                        {msg.text}
                    </p>
                )}

                {/* Show timestamp only if showTimestamp is true */}
                {showTimestamp && (
                    <div className="text-right">
                        <span className='text-[10px] text-gray-500 align-super'>
                            {formatTimestamp(msg.timestamp)}
                        </span>
                    </div>
                )}
            </div>
        );
    };

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
                        disabled={isSending || isRecording}
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
                    disabled={isSending || isRecording}
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

            {/* Main Chat Area */}
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
                                    <div key={msg.id || `msg-${index}`} className="mb-1 relative">
                                        {msg.sender === currentUser?.email ? (
                                            <div className="flex flex-col items-end w-full">
                                                <div className="flex gap-3 me-2 max-w-[220px] sm:max-w-[380px]">

                                                    <div className="relative w-full">
                                                        <div 
                                                            className="bg-white pl-3 pr-3 pt-2 pb-1 rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl shadow-sm message-content cursor-pointer hover:bg-gray-50 transition-colors"
                                                            onClick={(e) => handleMessageClick(msg.id, e)}
                                                        >
                                                            {renderMessageContent(msg, true)}
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
                                            // Other User's Messages
                                            // <div className="flex flex-col items-start w-full">
                                                
                                            //     <div className="flex gap-2 sm:gap-3 max-w-[220px] sm:max-w-[380px]">
                                                   
                                            //         <img 
                                            //             src={selectedUser?.image || defaultAvatar} 
                                            //             className="h-8 w-8 object-cover rounded-full flex-shrink-0" 
                                            //             alt={selectedUser?.fullname || "User"} 
                                            //         />
                                                    
                                            //         <div className="relative w-full">
                                            //             <div className="bg-white pl-3 pr-3 pt-2 pb-1 rounded-tr-2xl rounded-tl-2xl rounded-br-2xl shadow-sm message-content w-full">
                                            //                 {renderMessageContent(msg, true)}
                                            //             </div>
                                            //             <p className="text-gray-400 text-xs mt-1">
                                            //                 {msg.edited && <span className="ml-1 text-gray-500">(edited)</span>}
                                            //             </p>
                                            //         </div>
                                            //     </div>
                                            // </div>
                                            <div className="flex flex-col items-start w-full">
                                                <div className="flex gap-2 max-w-[220px] sm:max-w-[380px]">

                                                    <div className="relative w-full">
                                                        
                                                        <div 
                                                            className="bg-white pl-3 pr-3 pt-2 pb-1 rounded-bl-2xl rounded-tr-2xl rounded-br-2xl shadow-sm message-content cursor-pointer hover:bg-gray-50 transition-colors"
                                                            onClick={(e) => handleMessageClick(msg.id, e)}
                                                        >
                                                            {renderMessageContent(msg, true)}
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

                {/* Attachment Preview Section */}
                {previewImage && (
                    <div className='px-4 pt-3 bg-transparent'>
                        <div className='bg-white rounded-xl border border-gray-200 p-3 shadow-sm'>
                            <div className='flex items-center justify-between mb-2'>
                                <div className='flex items-center gap-2'>
                                    <RiImageLine className="text-blue-500" />
                                    <span className="text-sm font-medium text-gray-700">Image Preview</span>
                                </div>
                                <button onClick={() => {
                                        setPreviewImage(null);
                                        setAttachments([]);
                                    }} className='text-gray-400 hover:text-red-500 transition-colors p-1'>
                                    <RiCloseCircleFill className="text-lg"/>
                                </button>
                            </div>
                            <div className="relative">
                                <img src={previewImage} alt='preview' className="w-full rounded-lg max-h-[200px] object-cover"/>
                                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                                    {attachments[0]?.name || 'image.jpg'}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Multiple Attachments Preview */}
                {attachments.length > 0 && !previewImage && (
                    <div className='px-4 pt-3 bg-transparent'>
                        <div className='bg-white rounded-xl border border-gray-200 p-3 shadow-sm'>
                            <div className='flex items-center gap-2 mb-2'>
                                <RiAttachmentLine className="text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">Attachments ({attachments.length})</span>
                                <button onClick={() => {
                                        setAttachments([]);
                                        setPreviewImage(null);
                                    }}
                                    className="ml-auto text-gray-400 hover:text-red-500 text-sm"
                                >
                                    Clear all
                                </button>
                            </div>
                            <div className='flex flex-wrap gap-2'>
                                {attachments.map((file,index) => (
                                    <div key={index} className='flex items-center gap-2 bg-gray-50 hover:bg-gray-100 p-2 rounded-lg border border-gray-200 transition-colors'>
                                        {getFileIcon(file)}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-gray-800 truncate max-w-[120px]">
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {formatFileSize(file.size)}
                                            </p>
                                        </div>
                                        <button onClick={() => removeAttachment(index)}
                                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                        >
                                            <RiCloseCircleFill />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Upload Progress */}
                {Object.keys(uploadProgress).length > 0 && (
                    <div className='px-4 pt-3 bg-transparent'>
                        <div className='bg-white rounded-xl border border-gray-200 p-3 shadow-sm'>
                            <div className='flex items-center gap-2 mb-2'>
                                <span className="text-sm font-medium text-gray-700">Uploading...</span>
                            </div>
                            <div className='space-y-2'>
                                {Object.entries(uploadProgress).map(([key,progress]) => (
                                    <div key={key} className='space-y-1'>
                                        <div className='flex justify-between text-xs text-gray-600'>
                                            <span>File {key.split('-')[1]}</span>
                                            <span>{Math.round(progress)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Message Input Form */}
                <div className='p-4 w-full bg-white flex-shrink-0'>
                    <form onSubmit={handleMessage} className='flex items-center bg-green-200 h-[55px] w-full px-2 rounded-lg relative shadow-lg'>
                        {/* Hidden file input */}
                        <input
                           type='file'
                           ref={fileInputRef}
                           multiple
                           accept='image/*,video/*,audio/*,.pdf,.doc,.docx,.txt'
                           onChange={handleFileSelect}
                           className='hidden'
                        />

                        {/* Attachment Button with Options Menu */}
                        <div className='relative'>
                            <button 
                                type='button' 
                                className='p-2 text-gray-600 hover:text-teal-600 transition-colors attachment-button'
                                onClick={() => setShowAttachmentOptions(!showAttachmentOptions)} 
                                disabled={isSending || isRecording}
                            >
                                <RiAttachmentLine className='text-xl'/>
                            </button>

                            {/* Attachment Options Menu */}
                            {showAttachmentOptions && (
                                <div ref={attachmentMenuRef} className='absolute bottom-14 left-0 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-2 min-w-[200px]'>
                                    <button 
                                        type='button' 
                                        className='flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors' 
                                        onClick={() => {
                                            fileInputRef.current.click();
                                            setShowAttachmentOptions(false);
                                        }}
                                    >
                                        <div className="bg-blue-100 p-2 rounded-lg group-hover:bg-blue-200 transition-colors">
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
                                        <div className="bg-green-100 p-2 rounded-lg group-hover:bg-green-200 transition-colors">
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
                                        <div className="bg-purple-100 p-2 rounded-lg group-hover:bg-purple-200 transition-colors">
                                            <RiMusicLine className="text-purple-600 text-lg" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">Audio File</p>
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>
                            
                        {/* Text Input */}
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
                            {/* Voice/Send Button */}
                            {isRecording ? (
                                // Stop recording button (shown when recording)
                                <button 
                                    type="button"
                                    onClick={stopRecording}
                                    className="p-2 rounded-full bg-red-100 hover:bg-red-200 transition-colors min-w-[40px] cursor-pointer"
                                    aria-label="Stop recording"
                                >
                                    <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                                </button>
                            ) : (
                                // Normal buttons (when not recording)
                                <>
                                    {(messageText.trim() || attachments.length > 0) && (
                                        <>
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
                                        // Voice button (shown when input is empty and not editing)
                                        <button
                                            type="button"
                                            onClick={startRecording}
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
            </main>

            {/* Media Viewer Modal */}
            {selectedMessageForView && (
                <div className='fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4'>
                    <button 
                        className='absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full transition-colors' 
                        onClick={() => setSelectedMessageForView(null)}
                    >
                        <RiCloseLine className="text-2xl" />
                    </button>

                    {selectedMessageForView.type === 'image' ? (
                        <img src={selectedMessageForView.url} alt='Full view' className='max-w-full max-h-[90vh] object-contain' />
                    ) : selectedMessageForView.type === 'video' ? (
                        <video 
                            src={selectedMessageForView.url}
                            controls
                            autoPlay
                            className="max-w-full max-h-[90vh]"
                        />
                    ) : null}
                </div>
            )}

            {/* CSS Styles */}
            <style jsx>{`
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

                /* Message text wrapping and truncation */
                .message-content {
                    word-break: break-word;
                    overflow-wrap: break-word;
                    min-width: 0; /* Important for flex/grid truncation */
                }
                
                /* For very long single words/URLs */
                .break-all-long {
                    word-break: break-all;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                    
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out;
                }
            `}</style>

        </section>
    );
}

export default Chatbox;