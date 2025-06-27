"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_THEME,
  Message,
  type ChatMessage,
  type User,
} from "../lib/types"; 
import ChatMessageItem from "./chat/chat-message-item";
import { useActualMessages } from "../hooks/use-actual-messages";
import { EmojiOverlay } from "./chat/emoji-overlay";
import { TypingIndicator } from "./chat/typing-indicator";

interface ChatProps {
  messages: Message[];
  sendMessage: (text: string) => void;
  onReact: (messageId: string, reaction?: string | null) => Promise<void>;
  isStrangerTyping: boolean;
  onStartTyping: () => void;
  goBack: () => void;
  endChat: () => void;
  newChat?: () => void;
  peerId: string;
  status: string;
}

export default function Chat({
  messages,
  goBack,
  sendMessage,
  onStartTyping,
  isStrangerTyping,
  endChat,
  newChat,
  onReact,
  peerId,
  status,
}: ChatProps) {
  const user: User = { id: peerId };

  const [currentMessage, setCurrentMessage] = useState("");
  const [confirmedEnd, setConfirmedEnd] = useState(false);
  
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

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = currentMessage.trim();
    if (trimmedMessage) {
      sendMessage(trimmedMessage);
      setCurrentMessage("");
    }
  };

  const renderMessage = (msg: Message, index: number) => {
    const isSystem = msg.sender === "system" || msg.type === "system";

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
        isLast={index === 0}
        onSwipe={() => {}}
        onStartedSwipe={() => {}}
        onEndedSwipe={() => {}}
        onReact={onReact}
        onOpenEmojiMenu={() => onOpenEmojiMenu(msg)}
        onResendMessage={() => {}}
        isEmojiMenuOpen={isEmojiMenuOpen}
        theme={DEFAULT_THEME}
        animate={false}
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

      <div
        id="chat-container"
        className="w-full max-w-md mx-auto h-[100dvh] flex flex-col bg-white/70 backdrop-blur-xl sm:rounded-[2rem] shadow-2xl overflow-hidden"
      >
        {/* Chat Header */}
        <div className="p-4 bg-white/60 border-b border-gray-200/80 flex items-center shrink-0">

          {/* back arrow button */}
          {status !== "connected" && (
            <Button
              variant="outline"
              size="sm"
              onClick={goBack}
              className="rounded-full mr-2"
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
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </Button>
          )}

          <div className="text-left mr-auto ml-2">
            <p className="text-xs font-medium text-gray-500">Status</p>
            <p className="text-sm font-semibold text-green-600">
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </p>
          </div>

          {status === "connected" && (
            <Button
              variant={confirmedEnd ? "destructive" : "outline"}
              size="sm"
              onClick={() => {
                if (confirmedEnd) {
                  endChat();
                  setConfirmedEnd(false);
                } else {
                  setConfirmedEnd(true);
                }
              }}
              className="rounded-full"
            >
              {confirmedEnd ? "Confirm?" : "End Chat"}
            </Button>
          )}

          {status !== "connected" && (
            <Button
             variant="outline"
              size="sm"
              onClick={newChat}
              className="rounded-full">
                New Chat
              </Button>
          )}
        </div>

        <div className="p-2 text-center text-xs text-gray-500 bg-white/60 border-b border-gray-200/80 shrink-0">
          not all features are implemented, still in early stages <br/> -@tyronscott_
        </div>

        {/* Chat Log */}
        {/*
          CHANGE 1: Added `flex-col-reverse`.
          This will make the flex container stack items from the bottom.
          The overflow-y-auto will now show the bottom (newest) content first.
        */}
        <div
          ref={chatLogRef}
          className="flex-grow overflow-y-auto py-4 flex flex-col-reverse"
        >
          {isStrangerTyping && (
            <TypingIndicator />
          )}

          {/*
            CHANGE 2: Reversed the `actualMessages` array before mapping.
            This ensures that newer messages are rendered first in the reversed column,
            placing them at the bottom of the visible area.
          */}
          {status !== "finding_match" && 
            [...actualMessages].reverse().map(renderMessage)
          }

          {status === "finding_match" && (
            <div className="flex justify-center items-center h-full">
              <p className="text-gray-500">Finding a match...</p>
            </div> 
          )}
        </div>

        {/* Message Input Form */}
        <div className="p-4 bg-white/60 border-t border-gray-200/80 shrink-0">
          <form onSubmit={handleSend} className="flex space-x-3">
            <Input
              disabled={status !== "connected"}
              type="text"
              value={currentMessage}
              onChange={(e) => {
                setCurrentMessage(e.target.value)
                onStartTyping();
              }}
              placeholder="Type a message..."
              className="text-[16px] flex-grow p-3 border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 bg-white/80"
              autoComplete="off"
              required
            />
            <Button
              type="submit"
              disabled={!currentMessage.trim() || status !== "connected"}
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
