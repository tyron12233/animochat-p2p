import React, { useState } from 'react';

interface ChatInputBarProps {
    onSendMessage: (text: string) => void;
    isSessionActive: boolean;
}

/**
 * Renders the message input field and send button.
 */
const ChatInputBar: React.FC<ChatInputBarProps> = ({ onSendMessage, isSessionActive }) => {
    const [inputValue, setInputValue] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim() && isSessionActive) {
            onSendMessage(inputValue);
            setInputValue('');
        }
    };

    return (
        <div className="p-4 bg-gray-50 border-t border-gray-200 shrink-0">
            <form onSubmit={handleSubmit} className="flex space-x-3">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={isSessionActive ? "Type a message..." : "Chat has ended"}
                    className="flex-grow p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow bg-white"
                    autoComplete="off"
                    disabled={!isSessionActive}
                    required
                />
                <button
                    type="submit"
                    className="bg-green-600 text-white font-bold w-12 h-12 rounded-full hover:bg-green-700 disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center justify-center transition-colors shadow-lg"
                    disabled={!isSessionActive || !inputValue.trim()}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="19" x2="12" y2="5"></line>
                        <polyline points="5 12 12 5 19 12"></polyline>
                    </svg>
                </button>
            </form>
        </div>
    );
};
export default ChatInputBar; 