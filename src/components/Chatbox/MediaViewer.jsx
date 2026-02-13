import React from 'react';
import { RiCloseLine } from 'react-icons/ri';

const MediaViewer = ({ selectedMessageForView, setSelectedMessageForView }) => {
    if (!selectedMessageForView) return null;

    return (
        <div className='fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4'>
            <button 
                className='absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full transition-colors' 
                onClick={() => setSelectedMessageForView(null)}
            >
                <RiCloseLine className="text-2xl" />
            </button>

            {selectedMessageForView.type === 'image' ? (
                <img 
                    src={selectedMessageForView.url} 
                    alt='Full view' 
                    className='max-w-full max-h-[90vh] object-contain' 
                />
            ) : selectedMessageForView.type === 'video' ? (
                <video 
                    src={selectedMessageForView.url}
                    controls
                    autoPlay
                    className="max-w-full max-h-[90vh]"
                />
            ) : null}
        </div>
    );
};

export default MediaViewer;