import React from 'react';

const UploadProgress = ({ uploadProgress }) => {
    if (Object.keys(uploadProgress).length === 0) return null;

    return (
        <div className='px-4 pt-3 bg-transparent'>
            <div className='bg-white rounded-xl border border-gray-200 p-3 shadow-sm'>
                <div className='flex items-center gap-2 mb-2'>
                    <span className="text-sm font-medium text-gray-700">Uploading...</span>
                </div>
                <div className='space-y-2'>
                    {Object.entries(uploadProgress).map(([key, progress]) => (
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
    );
};

export default UploadProgress;