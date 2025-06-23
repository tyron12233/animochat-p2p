import React from 'react';

interface ChatHeaderProps {
    partnerUsername: string;
    partnerStatus: string;
    onEndChat: () => void;
}

/**
 * Displays the header of the chat, including the partner's name, status, and the end chat button.
 */
const ChatHeader: React.FC<ChatHeaderProps> = ({ partnerUsername, partnerStatus, onEndChat }) => {
    const statusColor = partnerStatus === 'online' ? 'bg-green-500' : 'bg-gray-400';

    return (
        <div className="px-6 py-4 flex justify-between items-center border-b border-gray-200 shrink-0">
            <div className="flex items-center gap-3">
                <div className="flex flex-col">
                    <h2 className="font-bold text-lg text-gray-800">{partnerUsername}</h2>
                    <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${statusColor}`}></span>
                        <p className="text-xs text-gray-500 capitalize">{partnerStatus}</p>
                    </div>
                </div>
            </div>
            <button
                onClick={onEndChat}
                className="bg-red-500 text-white text-xs font-bold py-1.5 px-3 rounded-full hover:bg-red-600 transition-colors"
            >
                End Chat
            </button>
        </div>
    );
};
export default ChatHeader;
