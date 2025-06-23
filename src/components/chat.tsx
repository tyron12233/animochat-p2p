// components/Chat.tsx

"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_THEME,
  Message,
  type ChatMessage,
  type User,
} from "../lib/types"; // Make sure this path is correct
import ChatMessageItem from "./chat/chat-message-item";
import { useActualMessages } from "../hooks/use-actual-messages";
import { EmojiOverlay } from "./chat/emoji-overlay";

interface ChatProps {
  messages: Message[];
  sendMessage: (text: string) => void;
  onReact: (messageId: string, reaction?: string | null) => Promise<void>;
  endChat: () => void;
  peerId: string;
  status: string;
}

export default function Chat({
  messages,
  sendMessage,
  endChat,
  onReact,
  peerId,
  status,
}: ChatProps) {
  const user: User = { id: peerId };

  const [currentMessage, setCurrentMessage] = useState("");
  const chatLogRef = useRef<HTMLDivElement>(null);
  const isEmojiMenuOpen = useRef(false);

  const [emojiMenuState, setEmojiMenuState] = useState<{
    open: boolean;
    message?: Message | null;
    messageDiv?: HTMLDivElement | null;
  }>({ open: false });
  const emojiMenuOpenRef = useRef(false);

  const actualMessages = useActualMessages(messages);

  const onOpenEmojiMenu = (message: Message | null) => {
    if (!message) {
      setEmojiMenuState({ open: false });
      emojiMenuOpenRef.current = false;
      return;
    }

    const messageElement = document.querySelector(
      `[data-message-id="${message?.id}"]`
    );
    if (messageElement) {
      emojiMenuOpenRef.current = true;
      setEmojiMenuState({
        open: true,
        message,
        messageDiv: messageElement as HTMLDivElement,
      });
    }
  };

  // Auto-scroll to the latest message
  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = currentMessage.trim();
    if (trimmedMessage) {
      sendMessage(trimmedMessage);
      setCurrentMessage("");
    }
  };

  const renderMessage = (msg: Message, index: number) => {
    const isSystem = msg.sender === "System";

    if (isSystem) {
      return (
        <div key={index} className="text-center my-2">
          <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1">
            {msg.content}
          </span>
        </div>
      );
    }

    const user: User = {
      id: peerId,
    };

    return (
      <ChatMessageItem
        key={index}
        index={index}
        message={msg}
        user={user}
        isLast={index === messages.length - 1}
        onSwipe={() => {}}
        onStartedSwipe={() => {}}
        onEndedSwipe={() => {}}
        onReact={onReact}
        onOpenEmojiMenu={() => onOpenEmojiMenu(msg)}
        onResendMessage={() => {}}
        isEmojiMenuOpen={isEmojiMenuOpen}
        theme={DEFAULT_THEME}
        animate={true}
        secondVisibleElement={null}
      />
    );
  };

  return (
    <>
      <EmojiOverlay
        open={emojiMenuState.open}
        message={emojiMenuState.message!}
        messageDiv={emojiMenuState.messageDiv!}
        user={user}
        onReact={onReact}
        onReply={() => {}}
        onEdit={() => {}}
        onCopy={() => {}}
        onDelete={() => {}}
        onClose={() => onOpenEmojiMenu(null)}
      />

      {/* Main chat container: h-screen makes it full height, sm:rounded makes it rounded on larger screens */}
      <div
        id="chat-container"
        className="w-full max-w-md mx-auto h-screen flex flex-col bg-white/70 backdrop-blur-xl sm:rounded-[2rem] shadow-2xl overflow-hidden"
      >
        {/* Chat Header */}
        <div className="p-4 bg-white/60 border-b border-gray-200/80 flex justify-between items-center shrink-0">
          <div className="text-left">
            <p className="text-xs font-medium text-gray-500">Status</p>
            <p className="text-sm font-semibold text-green-600">{status}</p>
          </div>
          <Button
            onClick={endChat}
            variant="destructive"
            size="sm"
            className="rounded-full"
          >
            End Chat
          </Button>
        </div>

        

        {/* Chat Log */}
        <div ref={chatLogRef} className="flex-grow overflow-y-auto p-4">
          {actualMessages.map(renderMessage)}
        </div>

        {/* Message Input Form */}
        <div className="p-4 bg-white/60 border-t border-gray-200/80 shrink-0">
          <form onSubmit={handleSend} className="flex space-x-3">
            <Input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-grow p-3 border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 bg-white/80"
              autoComplete="off"
              required
            />
            <Button
              type="submit"
              className="bg-green-500 text-white font-bold w-12 h-12 rounded-full hover:bg-green-600 flex items-center justify-center shadow-lg"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="19" x2="12" y2="5"></line>
                <polyline points="5 12 12 5 19 12"></polyline>
              </svg>
            </Button>
          </form>
        </div>

      </div>
    </>
  );
}
