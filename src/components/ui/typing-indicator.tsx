import React from 'react';

export const TypingIndicator: React.FC = () => (
    <div className="flex justify-start">
        <div className="bg-gray-200 text-gray-800 rounded-t-2xl rounded-r-2xl p-4 flex items-center space-x-1.5">
            <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
            <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
            <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse"></span>
        </div>
    </div>
);
