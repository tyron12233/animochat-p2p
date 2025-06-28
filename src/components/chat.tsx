"use client";

import { useState, useRef, useEffect } from "react";
// Assuming Button and Input are styled separately or adapt via CSS variables.
// For this example, we will style them directly where possible.
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
import { DEFAULT_THEME, Message, UserMessage, type User } from "../lib/types";
import ChatMessageItem, { bumbleTheme } from "./chat/chat-message-item";
import { useActualMessages } from "../hooks/use-actual-messages";
import { EmojiOverlay } from "./chat/emoji-overlay";
import { VList, VListHandle } from "virtua";
import { TypingIndicator } from "./chat/typing-indicator";
import { AnimatePresence, motion } from "framer-motion";
import { FindingMatchAnimation } from "./chat/finding-match";
import { AnimateChangeInHeight } from "../lib/animate-height-change";
import { supabase } from "../lib/supabase";
import { useChatTheme } from "../context/theme-context";
import { ChatThemeV2 } from "../lib/chat-theme";
import { Button } from "@/components/ui/button";
import { Palette } from "lucide-react";
import ThemePickerDialog from "./theme-picker";
import { defaultTheme, tyronsTheme } from "../lib/default-chat-themes";

interface ChatProps {
  messages: Message[];
  sendMessage: (text: string, replyingToId: string | undefined) => void;
  onReact: (messageId: string, reaction: string | null) => Promise<void>;
  onChangeTheme?: (mode: "light" | "dark", theme: ChatThemeV2) => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
  cancelMatchmaking?: () => void;
  isStrangerTyping: boolean;
  onStartTyping: () => void;
  goBack: () => void;
  endChat: () => void;
  newChat?: () => void;
  peerId: string;
  status: string;
}

// A helper component to inject dynamic styles for pseudo-classes and elements
const DynamicGlobalStyles = ({
  theme,
  mode,
}: {
  theme: ChatThemeV2;
  mode: "light" | "dark";
}) => (
  <style>{`

    #chat-container {
      --chat-border-radius: 2rem; /* Default border radius */
    }

    @media (max-width: 640px) {
      #chat-container {
        --chat-border-radius: 0; /* No border radius on small screens */
      }
    }

    #chat-messages-list::-webkit-scrollbar {
      width: 8px;
    }
    #chat-messages-list::-webkit-scrollbar-track {
      background: ${theme.messageList.scrollbarTrack[mode]};
    }
    #chat-messages-list::-webkit-scrollbar-thumb {
      background-color: ${theme.messageList.scrollbarThumb[mode]};
      border-radius: 4px;
    }
    #chat-messages-list::-webkit-scrollbar-thumb:hover {
      background-color: ${theme.buttons.primary.hoverBackground[mode]};
    }
    #chat-input:focus {
      outline: none;
      box-shadow: 0 0 0 2px ${theme.inputArea.focusRing[mode]};
    }
    #send-button:hover {
        background-color: ${theme.buttons.primary.hoverBackground[mode]} !important;
    }
    #new-messages-button:hover {
        background-color: ${theme.buttons.newMessages.hoverBackground[mode]} !important;
    }
  `}</style>
);

export default function Chat({
  messages,
  goBack,
  sendMessage,
  onStartTyping,
  cancelMatchmaking = () => {},
  onEditMessage,
  isStrangerTyping,
  onChangeTheme,
  endChat,
  newChat,
  onReact,
  peerId,
  status,
}: ChatProps) {
  const user: User = { id: peerId };
  const { theme, mode } = useChatTheme();

  const [announcement, setAnnouncement] = useState<string | null>(null);

  // Supabase notification logic remains unchanged
  useEffect(() => {
    const getAnnouncement = async () => {
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
      if (data?.content) {
        setAnnouncement(data.content);
      }
    };
    const channel = supabase.channel("public:announcements");
    channel
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "announcements" },
        (payload) => {
          if (payload.new) {
            const content = (payload.new as any).content;
            setAnnouncement(content || null);
          }
        }
      )
      .subscribe();
    getAnnouncement();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const actualMessages = useActualMessages(messages);

  // VIRTUAL CHAT EFFECTS (logic unchanged)
  const scrollerRef = useRef<VListHandle>(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const prevMessagesLength = useRef(actualMessages.length);
  const [showNewMessagesButton, setShowNewMessagesButton] = useState(false);
  const isAtBottom = useRef(true);

  const [currentMessage, setCurrentMessage] = useState("");
  const [confirmedEnd, setConfirmedEnd] = useState(false);
  const isEmojiMenuOpen = useRef(false);

  const [emojiMenuState, setEmojiMenuState] = useState<{
    open: boolean;
    message?: UserMessage | null;
    messageDiv?: HTMLDivElement | null;
  }>({ open: false });

  const [bottomMessagePreviewState, setBottomMessagePreviewState] = useState<{
    type: "editing" | "replying";
    message: Message;
    title: string;
    description: string;
  } | null>(null);

  const onOpenEmojiMenu = (message: UserMessage | null) => {
    if (!message) {
      setEmojiMenuState({ open: false });
      return;
    }
    const messageElement = document.querySelector(
      `[data-message-id="${message?.id}"]`
    );
    if (messageElement) {
      setEmojiMenuState({
        open: true,
        message,
        messageDiv: messageElement as HTMLDivElement,
      });
    }
  };

  useEffect(() => {
    if (actualMessages.length === 0) return;
    const newMessagesAdded = actualMessages.length > prevMessagesLength.current;
    const lastMessage = actualMessages[actualMessages.length - 1];
    if (lastMessage.id === "typing") {
      prevMessagesLength.current = actualMessages.length;
      return;
    }
    if (newMessagesAdded) {
      const isUserMessage = lastMessage.sender === user.id;
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
  }, [actualMessages, user.id]);

  useEffect(() => {
    if (isAtBottom.current && isStrangerTyping) {
      scrollerRef.current?.scrollToIndex(actualMessages.length);
    }
  }, [isStrangerTyping]);

  useEffect(() => {
    const scroller = document.querySelector(
      "#chat-messages-list"
    ) as HTMLDivElement;
    if (!scroller) return;
    scroller.style.overflow =
      isSwiping || emojiMenuState.open ? "hidden" : "auto";
  }, [isSwiping, emojiMenuState]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = currentMessage.trim();
    if (trimmedMessage) {
      const messageId = bottomMessagePreviewState?.message?.id;
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
          <span
            style={{
              color: theme.message.systemMessage.text[mode],
              backgroundColor: theme.message.systemMessage.background[mode],
            }}
            className="
      box-decoration-clone 
      text-xs
      rounded-full
      px-3
      py-1
      leading-relaxed      
    "
          >
            {msg.content}
          </span>
        </div>
      );
    }

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
              message,
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
          theme={theme}
          mode={mode}
          animate={true}
          secondVisibleElement={null}
        />
      </AnimateChangeInHeight>
    );
  };

  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);

  return (
    <>
      <DynamicGlobalStyles theme={theme} mode={mode} />
      <ThemePickerDialog
        isOpen={isThemePickerOpen}
        onClose={() => setIsThemePickerOpen(false)}
        themes={[defaultTheme, tyronsTheme, bumbleTheme]}
        activeTheme={theme}
        setActiveThemeAndMode={(theme, mode) => {
          onChangeTheme?.(mode, theme);
        }}
        activeMode={mode}
      />
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
            message,
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
            message,
            type: "editing",
            title: "Editing",
            description: message.content,
          });
        }}
        onCopy={(messageId) => {
          const message = messages.find((m) => m.id === messageId);
          if (!message) return;
          navigator.clipboard.writeText(message.content);
          onOpenEmojiMenu(null);
        }}
        onDelete={(messageId) => {
          console.log(`Delete message with ID: ${messageId}`);
          onOpenEmojiMenu(null);
        }}
        onClose={() => onOpenEmojiMenu(null)}
      />

      <div
        id="chat-container"
        style={{
          fontFamily: theme.typography.fontFamily,
          fontSize: theme.typography.baseFontSize,
          backgroundColor: theme.general.background[mode],
          backdropFilter: `blur(${theme.general.backdropBlur})`,
          boxShadow: theme.general.shadow,
          borderRadius: "var(--chat-border-radius, 2rem)", // Use CSS var for sm breakpoint
        }}
        className="w-full max-w-md mx-auto h-[100dvh] flex flex-col overflow-hidden"
      >
        <div
          style={{
            backgroundColor: theme.header.background[mode],
            borderColor: theme.header.border[mode],
          }}
          className="p-4 border-b flex items-center shrink-0"
        >
          {status !== "connected" && (
            <Button onClick={goBack} className="rounded-full mr-2 p-1">
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
            <p
              style={{ color: theme.header.statusLabel[mode] }}
              className="text-xs font-medium"
            >
              Status
            </p>
            <p
              style={{ color: theme.header.statusValue[mode] }}
              className="text-sm font-semibold"
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </p>
          </div>

          {/* Icon Button For Theme Picker */}
          <Button
            onClick={() => setIsThemePickerOpen(true)}
            variant={"outline"}
            className="mr-2 rounded-full"
            style={{
              backgroundColor: theme.buttons.secondary.background[mode],
              color: theme.buttons.secondary.text[mode],
              borderColor:
                theme.buttons.secondary.border?.[mode] || "transparent",
            }}
          >
            <Palette />
          </Button>

          {status === "connected" && (
            <Button
              onClick={() =>
                confirmedEnd
                  ? (endChat(), setConfirmedEnd(false))
                  : setConfirmedEnd(true)
              }
              className="px-3 py-1 text-sm rounded-full"
              style={{
                backgroundColor: confirmedEnd
                  ? theme.buttons.destructive.background[mode]
                  : theme.buttons.secondary.background[mode],
                color: confirmedEnd
                  ? theme.buttons.destructive.text[mode]
                  : theme.buttons.secondary.text[mode],
                ...((
                  confirmedEnd
                    ? theme.buttons.destructive.border?.[mode]
                    : theme.buttons.secondary.border?.[mode]
                )
                  ? {
                      border: `1px solid ${
                        confirmedEnd
                          ? theme.buttons.destructive.border?.[mode]
                          : theme.buttons.secondary.border?.[mode]
                      }`,
                    }
                  : {}),
              }}
            >
              {confirmedEnd ? "Confirm?" : "End Chat"}
            </Button>
          )}
          {status !== "connected" && (
            <button
              onClick={newChat}
              className="px-3 py-1 text-sm rounded-full"
              style={{
                backgroundColor: theme.buttons.primary.background[mode],
                color: theme.buttons.primary.text[mode],
              }}
            >
              New Chat
            </button>
          )}
        </div>

        {announcement && (
          <div
            style={{
              backgroundColor: theme.announcement.background[mode],
              color: theme.announcement.text[mode],
              borderColor: theme.announcement.border[mode],
            }}
            className="p-2 text-center text-xs border-b shrink-0"
          >
            <div dangerouslySetInnerHTML={{ __html: announcement }} />
          </div>
        )}

        <AnimatePresence>
            {(status === "waiting_for_match" ||
              status === "finding_match" ||
              status === "connecting") && <FindingMatchAnimation onCancel={cancelMatchmaking}
                key="finding-match-animation"
                theme={theme}
                mode={mode}
              />}
          </AnimatePresence>

        <div className="max-h-full h-full relative">
          

          <VList
            ref={scrollerRef}
            style={{ overflowX: "hidden" }}
            id="chat-messages-list"
            onScroll={(offset) => {
              if (!scrollerRef.current) return;
              const scrollOffset =
                offset -
                scrollerRef.current.scrollSize +
                scrollerRef.current.viewportSize;
              isAtBottom.current = scrollOffset >= -100;
              if (isAtBottom.current) {
                setShowNewMessagesButton(false);
              }
            }}
            reverse
          >
            {actualMessages.map((msg, index) => renderMessage(msg, index))}
            <AnimateChangeInHeight>
              {isStrangerTyping && (
                <TypingIndicator
                  key="typing-indicator"
                  theme={theme}
                  mode={mode}
                />
              )}
            </AnimateChangeInHeight>
          </VList>

          <AnimatePresence>
            {showNewMessagesButton && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: "0" }}
                exit={{ y: "100%" }}
                className="absolute bottom-0 left-0 w-full flex items-center justify-center pb-24 pt-4"
              >
                <button
                  id="new-messages-button"
                  onClick={() => {
                    scrollerRef.current?.scrollToIndex(
                      actualMessages.length - 1,
                      { align: "end", smooth: true }
                    );
                    setShowNewMessagesButton(false);
                  }}
                  style={{
                    backgroundColor: theme.buttons.newMessages.background[mode],
                    color: theme.buttons.newMessages.text[mode],
                  }}
                  className="px-4 py-2 rounded-full shadow-md flex items-center gap-2 transition-colors"
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

        {bottomMessagePreviewState && (
          <div
            style={{
              backgroundColor: theme.overlays.replyingPreview.background[mode],
              borderLeft: `4px solid ${theme.overlays.replyingPreview.border[mode]}`,
            }}
            className="flex items-start gap-2 px-3 py-2 relative"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  style={{ color: theme.overlays.replyingPreview.title[mode] }}
                  className="text-xs font-semibold"
                >
                  {bottomMessagePreviewState.type === "replying"
                    ? "Replying to"
                    : "Editing"}
                </span>
                <button
                  type="button"
                  className="ml-auto"
                  aria-label="Cancel"
                  onClick={() => setBottomMessagePreviewState(null)}
                >
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    stroke={theme.overlays.replyingPreview.closeIcon[mode]}
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div
                style={{
                  color: theme.overlays.replyingPreview.description[mode],
                }}
                className="text-xs truncate max-w-xs"
              >
                {bottomMessagePreviewState.description}
              </div>
            </div>
          </div>
        )}

        <div
          style={{
            backgroundColor: theme.inputArea.background[mode],
            borderColor: theme.inputArea.border[mode],
          }}
          className="p-4 border-t shrink-0"
        >
          <form onSubmit={handleSend} className="flex space-x-3">
            <input
              id="chat-input"
              disabled={status !== "connected"}
              type="text"
              value={currentMessage}
              onChange={(e) => {
                setCurrentMessage(e.target.value);
                onStartTyping();
              }}
              placeholder="Type a message..."
              style={{
                backgroundColor: theme.inputArea.inputBackground[mode],
                color: theme.inputArea.inputText[mode],
                borderColor: theme.inputArea.border[mode],
              }}
              className="text-[16px] flex-grow p-3 border rounded-full"
              autoComplete="off"
              required
            />
            <button
              id="send-button"
              type="submit"
              disabled={!currentMessage.trim() || status !== "connected"}
              style={{
                backgroundColor: theme.buttons.primary.background[mode],
                color: theme.buttons.primary.text[mode],
                opacity:
                  !currentMessage.trim() || status !== "connected" ? 0.5 : 1,
              }}
              className="font-bold w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors"
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
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
