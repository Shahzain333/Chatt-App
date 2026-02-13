import { toast } from 'sonner';
import firebaseService from '../services/firebaseServices';
import { addMessage, updateMessage, deleteMessage, setLoading } from '../store/chatSlice';

const useMessageActions = ({
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
}) => {
    
    const uploadAttachments = async () => {
        const uploadedAttachments = [];

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

                setUploadProgress(prev => ({
                    ...prev,
                    [progressKey]: 100
                }));

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
                setUploadProgress(prev => {
                    const newProgress = { ...prev };
                    delete newProgress[progressKey];
                    return newProgress;
                });
            }
        }

        return uploadedAttachments;
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();

        if ((!messageText.trim() && attachments.length === 0) || 
            !selectedUser?.uid || !currentUser?.uid || !chatId || isSending) {
            return;
        }

        try {
            setIsSending(true);
            let uploadedAttachments = [];

            if(attachments.length > 0) {
                uploadedAttachments = await uploadAttachments();
            }
            
            if (editingMessage) {
                await firebaseService.updateMessage(chatId, editingMessage.id, messageText.trim(), uploadedAttachments);
                
                dispatch(updateMessage({
                    messageId: editingMessage.id,
                    newText: messageText.trim(),
                    attachments: uploadedAttachments
                }));
                
                setEditingMessage(null);
                toast.success('Message updated successfully');
            } else {
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

                toast.success(successMessage);
            }
            
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

    const handleEdit = (message) => {
        setEditingMessage(message);
        setMessageText(message.text);
    };

    const handleDelete = async (messageId) => {
        toast(`Are you sure you want to delete this message?`, {
            description: 'This action cannot be undone.',
            duration: 3000,
            action: {
                label: 'Delete',
                onClick: async () => {
                    try {
                        dispatch(setLoading(true));
                        dispatch(deleteMessage(messageId));
                        await firebaseService.deleteMessage(chatId, messageId);
                        toast.success('Message deleted successfully!');
                    } catch (error) {
                        console.error('Error deleting message:', error);
                        toast.error('Failed to delete message. Please try again.');
                    } finally {
                        dispatch(setLoading(false));
                    }
                }
            },
            cancel: {
                label: 'Cancel',
                onClick: () => {}
            },
        });
    };

    const cancelEdit = () => {
        setEditingMessage(null);
        setMessageText('');
    };

    return {
        handleSendMessage,
        handleEdit,
        handleDelete,
        cancelEdit,
    };
};

export default useMessageActions;