"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_THEME,
  Message,
  UserMessage,
  type ChatMessage,
  type User,
} from "../lib/types";
import ChatMessageItem from "./chat/chat-message-item";
import { useActualMessages } from "../hooks/use-actual-messages";
import { EmojiOverlay } from "./chat/emoji-overlay";
import { VList, VListHandle } from "virtua";
import { TypingIndicator } from "./chat/typing-indicator";
import { AnimatePresence, motion } from "framer-motion";
import { FindingMatchAnimation } from "./chat/finding-match";
import { AnimateChangeInHeight } from "../lib/animate-height-change";
import { supabase } from "../lib/supabase";

interface ChatProps {
  messages: Message[];
  sendMessage: (text: string, replyingToId: string | undefined) => void;
  onReact: (messageId: string, reaction: string | null) => Promise<void>;
  onEditMessage?: (messageId: string, newContent: string) => void;
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
  onEditMessage,
  isStrangerTyping,
  endChat,
  newChat,
  onReact,
  peerId,
  status,
}: ChatProps) {
  const user: User = { id: peerId };

  const [announcement, setAnnouncement] = useState<string | null>(null);

  // supabase notification
  useEffect(() => {
    const getAnnouncement = async () => {
      // from the supabase client, fetch latest announcement on the announcements table
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error("Error fetching announcement:", error);
        return;
      }

      if (!data || !data.content) {
        return;
      }

      if (data) {
        setAnnouncement(data.content);
      }
    };

    const channel = supabase.channel("public:announcements");

    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "announcements" },
      (payload) => {
        console.log("New announcement:", payload);
        if (!payload.new.content) return;
        setAnnouncement(payload.new.content);
      }
    );

    //  on update
    channel.on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "announcements" },
      (payload) => {
        console.log("Updated announcement:", payload);
        if (!payload.new.content) return;
        setAnnouncement(payload.new.content);
      }
    );

    getAnnouncement();

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const actualMessages = useActualMessages(messages);

  // VIRTUAL CHAT EFFECTS
  const scrollerRef = useRef<VListHandle>(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const prevMessagesLength = useRef(actualMessages.length);
  const [showNewMessagesButton, setShowNewMessagesButton] = useState(false);
  const renderedMessageIds = useRef<Set<string>>(new Set());
  const currentRange = useRef<{ startIndex: number; endIndex: number }>({
    startIndex: 0,
    endIndex: 0,
  });
  const [scrolling, setIsScrolling] = useState(false);
  const isAtBottom = useRef(true);

  //

  const [currentMessage, setCurrentMessage] = useState("");
  const [confirmedEnd, setConfirmedEnd] = useState(false);

  const chatLogRef = useRef<HTMLDivElement>(null);
  const isEmojiMenuOpen = useRef(false);

  const [emojiMenuState, setEmojiMenuState] = useState<{
    open: boolean;
    message?: UserMessage | null;
    messageDiv?: HTMLDivElement | null;
  }>({ open: false });
  const emojiMenuOpenRef = useRef(false);

  const [bottomMessagePreviewState, setBottomMessagePreviewState] = useState<{
    type: "editing" | "replying";
    message: Message;
    title: string;
    description: string;
  } | null>(null);

  const onOpenEmojiMenu = (message: UserMessage | null) => {
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

  useEffect(() => {
    renderedMessageIds.current = new Set(
      actualMessages.map((message) => message.id)
    );
  }, [actualMessages]);

  useEffect(() => {
    if (actualMessages.length === 0) return;

    const newMessagesAdded = actualMessages.length > prevMessagesLength.current;
    const lastMessage = actualMessages[actualMessages.length - 1];

    // Skip typing indicators
    if (lastMessage.id === "typing") {
      prevMessagesLength.current = actualMessages.length;
      return;
    }

    if (newMessagesAdded) {
      const isUserMessage = lastMessage.sender === user.id;
      // If it's a user message or the user is near the bottom (even if just a short scroll),
      // auto-scroll. Otherwise, show the new messages button.
      if (isUserMessage || isAtBottom.current) {
        scrollerRef.current?.scrollToIndex(actualMessages.length - 1, {
          align: "end",
          smooth: true,
        });
      } else {
        setShowNewMessagesButton(true);
      }
    }

    prevMessagesLength.current = actualMessages.length;
  }, [actualMessages, user.id, scrollerRef]);

  useEffect(() => {
    if (isAtBottom.current && isStrangerTyping) {
      // scroll
      scrollerRef.current?.scrollToIndex(actualMessages.length);
    }
  }, [isStrangerTyping, scrollerRef, actualMessages]);

  useEffect(() => {
    const scroller = document.querySelector(
      "#chat-messages-list"
    ) as HTMLDivElement;
    if (!scroller) return;

    const scrollDisabled = isSwiping || emojiMenuState.open;
    scroller.style.overflow = scrollDisabled ? "hidden" : "auto";
  }, [isSwiping, emojiMenuState]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedMessage = currentMessage.trim();
    if (trimmedMessage) {
      let messageId = bottomMessagePreviewState?.message?.id;

      if (messageId && bottomMessagePreviewState?.type === "editing") {
        onEditMessage?.(messageId, trimmedMessage);
        setBottomMessagePreviewState(null);
        setCurrentMessage("");
        return;
      }

      sendMessage(trimmedMessage, messageId);
      setCurrentMessage("");

      if (messageId) {
        setBottomMessagePreviewState(null);
      }
    }
  };

  const renderMessage = (msg: Message, index: number) => {
    const isSystem = msg.sender === "system" || msg.type === "system";

    if (isSystem) {
      return (
        <div key={index} className="text-center my-2 mx-4">
          <p className="text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1">
            {msg.content}
          </p>
        </div>
      );
    }

    const user: User = {
      id: peerId,
    };

    return (
      <AnimateChangeInHeight key={msg.id + "listener"}>
        <ChatMessageItem
          key={index}
          index={index}
          message={msg}
          user={user}
          isLast={index === 0}
          onSwipe={(messageId) => {
            const message = messages.find((m) => m.id === messageId);
            if (!message) return;

            setBottomMessagePreviewState({
              message: message,
              type: "replying",
              title: "Replying",
              description: message.content,
            });
          }}
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
      </AnimateChangeInHeight>
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
        onReply={(messageId) => {
          const message = messages.find((m) => m.id === messageId);
          if (!message) return;

          setBottomMessagePreviewState({
            message: message,
            type: "replying",
            title: "Replying",
            description: message.content,
          });
        }}
        onEdit={(messageId) => {
          const message = messages.find((m) => m.id === messageId);
          if (!message) return;

          setCurrentMessage(message.content);

          setBottomMessagePreviewState({
            message: message,
            type: "editing",
            title: "Editing",
            description: message.content,
          });
        }}
        onCopy={(messageId) => {
          const message = messages.find((m) => m.id === messageId);
          if (!message) return;

          navigator.clipboard
            .writeText(message.content)
            .then(() => {
              console.log("Message copied to clipboard");
            })
            .catch((err) => {
              console.error("Failed to copy message: ", err);
            });
          onOpenEmojiMenu(null);
        }}
        onDelete={(messageId) => {
          const message = messages.find((m) => m.id === messageId);
          if (!message) return;

          // Here you would typically call a function to delete the message
          // For example: deleteMessage(messageId);
          console.log(`Delete message with ID: ${messageId}`);
          onOpenEmojiMenu(null);
        }}
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
              variant="default"
              size="sm"
              onClick={newChat}
              className="bg-green-600 rounded-full hover:bg-green-700"
            >
              New Chat
            </Button>
          )}
        </div>

        {announcement && (
          <div className="p-2 text-center text-xs text-gray-500 bg-white/60 border-b border-gray-200/80 shrink-0">
            <div dangerouslySetInnerHTML={{ __html: announcement }} />
          </div>
        )}

        <div className="max-h-full h-full scrollbar-thin scrollbar-thumb-green-600 scrollbar-track-gray-100 hover:scrollbar-thumb-green-700">
          <VList
            ref={scrollerRef}
            style={{
              overflowX: "hidden",
            }}
            id="chat-messages-list"
            onScroll={(offset) => {
              if (!scrollerRef.current) return;

              setIsScrolling(true);

              let scrollOffset =
                offset -
                scrollerRef.current.scrollSize +
                scrollerRef.current.viewportSize;
              isAtBottom.current = scrollOffset >= -100;

              if (isAtBottom.current) {
                setShowNewMessagesButton(false);
              }
            }}
            onScrollEnd={() => {
              setIsScrolling(false);
            }}
            reverse
          >
            {actualMessages.map((msg, index) => {
              return renderMessage(msg, index);
            })}

            <AnimateChangeInHeight>
              {isStrangerTyping && <TypingIndicator key="typing-indicator" />}
            </AnimateChangeInHeight>
          </VList>

          <AnimatePresence>
            {(status === "waiting_for_match" ||
              status === "finding_match" ||
              status === "connecting") && <FindingMatchAnimation />}
          </AnimatePresence>

          <AnimatePresence>
            {showNewMessagesButton && (
              <motion.div
                className="absolute bottom-0 left-0 w-full flex items-center justify-center pb-24 pt-4"
                initial={{ y: "100%" }}
                animate={{ y: "0" }}
                exit={{ y: "100%" }}
              >
                <button
                  onClick={() => {
                    scrollerRef.current?.scrollToIndex(
                      actualMessages.length - 1,
                      { align: "end", smooth: true }
                    );
                    setShowNewMessagesButton(false);
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-full shadow-md flex items-center gap-2 hover:bg-green-700 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                  New messages
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* replying or editing */}
        {bottomMessagePreviewState && (
          <div className="flex items-start gap-2 px-3 py-2 bg-gray-100 border-l-4 mb-2 relative">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-green-700">
                  {bottomMessagePreviewState.type === "replying"
                    ? "Replying to"
                    : "Editing"}
                </span>
                <button
                  type="button"
                  className="ml-auto text-gray-400 hover:text-gray-600"
                  aria-label="Cancel"
                  onClick={() => setBottomMessagePreviewState(null)}
                >
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div className="text-xs text-gray-700 truncate max-w-xs">
                {bottomMessagePreviewState.description}
              </div>
            </div>
          </div>
        )}

        {/* Message Input Form */}
        <div className="p-4 bg-white/60 border-t border-gray-200/80 shrink-0">
          <form onSubmit={handleSend} className="flex space-x-3">
            <Input
              disabled={status !== "connected"}
              type="text"
              value={currentMessage}
              onChange={(e) => {
                setCurrentMessage(e.target.value);
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
