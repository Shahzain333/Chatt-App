import React from 'react';
import { 
    RiArrowLeftLine, 
    RiMore2Fill, 
    RiCloseLine,
    RiDeleteBinLine 
} from 'react-icons/ri';
import defaultAvatar from '../../assets/default.jpg';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
import firebaseService from '../../services/firebaseServices';
import { deleteChats, setMessages, setSelectedUser, setLoading } from '../../store/chatSlice';

const ChatHeader = ({ 
    selectedUser, 
    isMobileMenuOpen, 
    setIsMobileMenuOpen, 
    onBack, 
    chatId,
    isSending,
    isRecording 
}) => {
    const dispatch = useDispatch();

    const handleDeleteSelectedUserChats = async () => {
        if (!selectedUser) {
            toast.info("Please select a user first to delete the chat.");
            setIsMobileMenuOpen(false);
            return;
        }

        setIsMobileMenuOpen(false);

        toast(`Are you sure you want to delete all chats with ${selectedUser?.fullname || 'this user'}?`, {
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
                        
                        toast.success(`Chat with ${selectedUser?.fullname || 'user'} deleted successfully!`);
                    } catch (error) {
                        console.error('Error deleting chat:', error);
                        toast.error('Failed to delete chat. Please try again.');
                    } finally {
                        dispatch(setLoading(false));
                    }
                },
            },
            cancel: {
                label: 'Cancel',
                onClick: () => setIsMobileMenuOpen(false),
            },
        });
    };

    return (
        <header className='flex justify-between border-b border-gray-400 w-full h-[75px] p-4 
            bg-white flex-shrink-0 relative'>
            <main className='flex items-center gap-2'>
                <button 
                    onClick={onBack} 
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
                    alt={selectedUser?.username || "User"} 
                />
                
                <div className='flex-1'>
                    <h3 className='font-semibold text-[#2A3D39] sm:text-lg text-[16px]'>
                        {selectedUser?.username || "Chatfrik User"}
                    </h3>
                    <p className='font-light text-[#2A3D39] sm:text-sm text-[14px]'>
                        @{selectedUser?.email.split('@')[0] || "chatfrik"}
                    </p>
                </div>
            </main>

            <button 
                className="flex items-center justify-center w-10 h-10 rounded-lg transition-colors cursor-pointer menu-button"
                aria-label="More options"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
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
    );
};

export default ChatHeader;