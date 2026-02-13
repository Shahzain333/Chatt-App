import React from 'react';
import { RiImageLine, RiAttachmentLine, RiCloseCircleFill } from 'react-icons/ri';

const AttachmentPreview = ({ 
    attachments, 
    previewImage, 
    onClearAll, 
    onRemoveAttachment,
    getFileIcon,
    formatFileSize 
}) => {
    if (previewImage) {
        return (
            <div className='px-4 pt-3 bg-transparent'>
                <div className='bg-white rounded-xl border border-gray-200 p-3 shadow-sm'>
                    <div className='flex items-center justify-between mb-2'>
                        <div className='flex items-center gap-2'>
                            <RiImageLine className="text-blue-500" />
                            <span className="text-sm font-medium text-gray-700">Image Preview</span>
                        </div>
                        <button onClick={onClearAll} className='text-gray-400 hover:text-red-500 transition-colors p-1'>
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
        );
    }

    if (attachments.length > 0) {
        return (
            <div className='px-4 pt-3 bg-transparent'>
                <div className='bg-white rounded-xl border border-gray-200 p-3 shadow-sm'>
                    <div className='flex items-center gap-2 mb-2'>
                        <RiAttachmentLine className="text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Attachments ({attachments.length})</span>
                        <button onClick={onClearAll} className="ml-auto text-gray-400 hover:text-red-500 text-sm">
                            Clear all
                        </button>
                    </div>
                    <div className='flex flex-wrap gap-2'>
                        {attachments.map((file, index) => (
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
                                <button onClick={() => onRemoveAttachment(index)}
                                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                >
                                    <RiCloseCircleFill />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default AttachmentPreview;