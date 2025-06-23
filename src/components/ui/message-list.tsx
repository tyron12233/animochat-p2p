import { useRef, useEffect } from "react";
import { TypingIndicator } from "./typing-indicator";
import { ChatMessage } from "@/src/lib/types";


interface MessageListProps {
    messages: ChatMessage[];
    isPartnerTyping?: boolean; 
}


const MessageList: React.FC<MessageListProps> = ({ messages, isPartnerTyping }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Scroll to the bottom whenever messages change
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isPartnerTyping]);

    return (
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'You' ? 'justify-end' : msg.sender === 'Stranger' ? 'justify-start' : 'justify-center'}`}>
                    {msg.sender === 'System' ? (
                        <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1 italic">{msg.text}</span>
                    ) : (
                        <div className={`px-4 py-2 rounded-lg max-w-xs md:max-w-md break-words shadow-sm ${msg.sender === 'You' ? 'bg-green-600 text-white rounded-t-2xl rounded-l-2xl' : 'bg-gray-200 text-gray-800 rounded-t-2xl rounded-r-2xl'}`}>
                            {msg.text}
                        </div>
                    )}
                </div>
            ))}
            {isPartnerTyping && <TypingIndicator />}
        </div>
    );
};

export default MessageList;