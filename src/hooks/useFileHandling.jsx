import { useState } from 'react';
import { toast } from 'sonner';
import { 
    RiImageAddLine, 
    RiVideoLine, 
    RiMusicLine, 
    RiFileTextLine, 
    RiAttachmentLine 
} from 'react-icons/ri';

const useFileHandling = ({ chatId, currentUser }) => {
    const [attachments, setAttachments] = useState([]);
    const [previewImage, setPreviewImage] = useState(null);
    const [uploadProgress, setUploadProgress] = useState({});

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = [];

        files.forEach(file => {
            if(file.size > 100 * 1024 * 1024) {
                toast.error(`File ${file.name} is too large (max 100MB)`);
                return;
            }

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

            const firstImage = validFiles.find(f => f.type.startsWith('image'));
            if(firstImage) {
                const reader = new FileReader();
                reader.onload = (e) => setPreviewImage(e.target.result);
                reader.readAsDataURL(firstImage);
            }
        }

        e.target.value = '';
    };

    const removeAttachment = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));

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
        if (file.type.startsWith('image')) return <RiImageAddLine className='text-blue-500'/>; 
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

    const handleDownload = async (url, filename) => {
        let blobUrl = null;
        try {
            const response = await fetch(url);
            if(!response.ok) {
                throw new Error(`Failed to fetch file: ${response.status}`);
            }

            const blob = await response.blob();
            blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            link.click();
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

    return {
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
    };
};

export default useFileHandling;