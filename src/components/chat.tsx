"use client";

import { useState, useRef, useEffect, useCallback } from "react";
// Assuming Button and Input are styled separately or adapt via CSS variables.
// For this example, we will style them directly where possible.
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
import {
  DEFAULT_THEME,
  Mention,
  Message,
  UserMessage,
  VoiceMessage,
  type User,
} from "../lib/types";
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
import { Palette, Pencil, SendHorizonal } from "lucide-react";
import ThemePickerDialog from "./theme-picker";
import {
  auroraGlowTheme,
  cosmicLatteTheme,
  criminologyTheme,
  defaultTheme,
  monochromeTheme,
  prideCelebrationTheme,
  speakNowTheme,
  sunsetBlissTheme,
  tyronsTheme,
} from "../lib/default-chat-themes";
import { Participant } from "../lib/types";
import EditNicknameDialog from "./group-chat/edit-nickname-dialog";
import { OnlineUsers, UserListModal } from "./chat/online-users";
import { AuthUser, useAuth } from "../context/auth-context";
import { useAnimoChat } from "../hooks/use-animochat";
import { ChatInputBar } from "./chat/chat-input-bar";
import SharedMusicPlayer from "./shared-music-player";
import { useSharedAudioPlayer } from "../hooks/use-shared-audio";
import AdminControls from "./admin-controls";
import { group } from "console";

interface ChatProps {
  name: string;
  groupChat: boolean;
  onBack?: () => void;
  newChat?: () => void;
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

    /* on larger screens, remove border radius */
    @media (min-width: 641px) {
      #chat-container {
        --chat-border-radius: 0rem; /* Border radius for larger screens */
      }
    }

    div::-webkit-scrollbar {
      width: 8px;
    }
    div::-webkit-scrollbar-track {
      background: ${theme.messageList.scrollbarTrack[mode]};
    }
    div::-webkit-scrollbar-thumb {
      background-color: ${theme.messageList.scrollbarThumb[mode]};
      border-radius: 4px;
    }
    div::-webkit-scrollbar-thumb:hover {
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
  name = "",
  groupChat = false,
  onBack,
  newChat,
}: ChatProps) {
  const { user } = useAuth();
  const {
    session: { status, setScreen },
    chat: {
      wsRef,
      messages,
      sendVoiceMessage,
      sendImageMessage,
      participants,
      typingUsers,
      sendMessage,
      onReact,
      onChangeTheme,
      onDeleteMessage,
      editMessage: onEditMessage,
      onChangeNickname: onEditNickname,
      onStartTyping,
      disconnect: endChat,
    },
    matchmaking: { onCancelMatchmaking: cancelMatchmaking },
    theme: { theme, mode },
  } = useAnimoChat();

  useEffect(() => {
    if (!theme || !mode) return;

    // set body bg
    document.body.style.background = theme.general.background[mode];
  }, [theme, mode]);

  const {
    isPlaying,
    isMuted,
    progress,
    duration,
    currentSong,
    setSong,
    toggleMute,
    playbackBlocked,
    playbackError,
    unblockPlayback,
    skipVotes,
    skipThreshold,
    hasVotedToSkip,
    voteToSkip,
    play,
    queue,
    addToQueue,
  } = useSharedAudioPlayer(wsRef.current);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [currentNickname, setCurrentNickname] = useState<string>("Unknown");

  useEffect(() => {
    if (!participants || participants.length === 0) return;

    // Find the participant that matches the current user ID
    const currentUser = participants.find((p) => p.userId === user!.id);
    if (currentUser) {
      setCurrentNickname(currentUser.nickname || "Unknown");
    }
  }, [participants]);

  useEffect(() => {
    const nickname = participants.find((p) => p.userId === user!.id)?.nickname;
    if (nickname) {
      setCurrentNickname(nickname);
    }
  }, [participants]);

  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [isEditNicknameDialogOpen, setIsEditNicknameDialogOpen] =
    useState(false);

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

  const actualMessages = useActualMessages(messages, groupChat);

  // VIRTUAL CHAT EFFECTS (logic unchanged)
  const typingIndicatorRef = useRef<HTMLDivElement | null>(null);
  const scrollerRef = useRef<VListHandle>(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const prevMessagesLength = useRef(actualMessages.length);
  const [showNewMessagesButton, setShowNewMessagesButton] = useState(false);
  const isAtBottom = useRef(true);

  const [currentMessage, setCurrentMessage] = useState("");
  const [currentMentions, setCurrentMentions] = useState<Mention[]>([]);

  const [confirmedEnd, setConfirmedEnd] = useState(false);
  const isEmojiMenuOpen = useRef(false);

  /**
   * Handles the submission of a new song from the admin dialog
   * and sends it over the WebSocket.
   * @param {string} name The name of the song.
   * @param {string} url The URL of the song's MP3 file.
   */
  const handleSetSong = (name: string, url: string) => {
    if (wsRef.current && user?.role === "admin") {
      setSong({
        name: name,
        url: url,
      });
    }
  };

  const [emojiMenuState, setEmojiMenuState] = useState<{
    open: boolean;
    message?: UserMessage | VoiceMessage | null;
    messageDiv?: HTMLDivElement | null;
  }>({ open: false });

  const [bottomMessagePreviewState, setBottomMessagePreviewState] = useState<{
    type: "editing" | "replying";
    message: Message;
    title: string;
    description: string;
  } | null>(null);

  const onOpenEmojiMenu = (message: UserMessage | VoiceMessage | null) => {
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

  const [mentionParticipants, setMentionParticipants] = useState<Participant[]>(
    []
  );

  // Create a ref to store the timeout ID for debouncing
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setCurrentMessage(newValue);
    onStartTyping();

    // Clear any existing timeout to debounce the mention search
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Debounce mention search to prevent lag when typing quickly
    debounceTimeoutRef.current = setTimeout(() => {
      const textInput = document.getElementById(
        "chat-input"
      ) as HTMLInputElement;
      const cursorPosition = textInput?.selectionStart || 0;
      const textBeforeCursor = newValue.slice(0, cursorPosition);
      const atIndex = textBeforeCursor.lastIndexOf("@");

      // if starts with @, add all participants, else filter
      if (atIndex !== -1) {
        const query = textBeforeCursor.slice(atIndex + 1).toLowerCase();
        if (query.length > 0) {
          const modifiedParticipants: Participant[] = [
            ...participants,
          ];
          if (groupChat) {
            modifiedParticipants.push({
              userId: "julie-ai",
              nickname: "Julie AI",
              status: "online",
            } as Participant)
          }
          const filteredParticipants = modifiedParticipants.filter((p) =>
            p.nickname.toLowerCase().startsWith(query)
          );
          setMentionParticipants(filteredParticipants);
        } else {
          setMentionParticipants(participants);
        }
      } else {
        setMentionParticipants([]);
      }
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (groupChat) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      console.log("Escape key pressed");
      if (
        status === "waiting_for_match" ||
        status === "finding_match" ||
        status === "connecting"
      ) {
        cancelMatchmaking();
        return;
      }
      if (status === "connected") {
        if (!confirmedEnd) {
          setConfirmedEnd(true);
        } else {
          console.log("Ending chat");
          endChat();
          setConfirmedEnd(false);
        }
      }
      if (status !== "connected" && newChat) {
        console.log("Starting new chat");
        newChat();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [status, confirmedEnd, endChat, cancelMatchmaking, newChat]);

  useEffect(() => {
    if (actualMessages.length === 0) return;
    const newMessagesAdded = actualMessages.length > prevMessagesLength.current;
    const lastMessage = actualMessages[actualMessages.length - 1];
    if (lastMessage.id === "typing") {
      prevMessagesLength.current = actualMessages.length;
      return;
    }
    if (newMessagesAdded) {
      const isUserMessage = lastMessage.sender === user!.id;
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
  }, [actualMessages, user!.id]);

  useEffect(() => {
    const isSomeoneTyping = typingUsers.length > 0;
    if (isAtBottom.current && isSomeoneTyping) {
      scrollerRef?.current?.scrollToIndex(actualMessages.length, {
        smooth: true,
        align: "end",
      });
    }
  }, [typingUsers, actualMessages]);

  useEffect(() => {
    if (bottomMessagePreviewState) {
      // focus chat input
      const chatInput = document.getElementById(
        "chat-input"
      ) as HTMLInputElement;
      if (chatInput) {
        chatInput.focus();
      }
      return;
    }

    // clear chat input
    const chatInput = document.getElementById("chat-input") as HTMLInputElement;
    if (chatInput) {
      chatInput.value = "";
      setCurrentMessage("");
    }
  }, [bottomMessagePreviewState]);

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
      setConfirmedEnd(false);

      const messageId = bottomMessagePreviewState?.message?.id;
      if (messageId && bottomMessagePreviewState?.type === "editing") {
        onEditMessage?.(messageId, trimmedMessage);
        setBottomMessagePreviewState(null);
        setCurrentMessage("");
        return;
      }

      const validMentions = currentMentions.filter((mention) => {
        const mentionText = trimmedMessage.slice(
          mention.startIndex,
          mention.endIndex
        );
        // Find the participant by id
        const participant = participants.find((p) => p.userId === mention.id);
        // The mention is valid if the text matches the participant's nickname
        return participant && mentionText === participant.nickname;
      });

      sendMessage(trimmedMessage, messageId, validMentions);

      setCurrentMentions([]);
      setCurrentMessage("");
      if (messageId) {
        setBottomMessagePreviewState(null);
      }
    }
  };

  const handleSaveNickname = (newNickname: string) => {
    onEditNickname?.(newNickname);
  };

  const renderMessage = (msg: Message, index: number) => {
    const isSystem = msg.sender === "system" || msg.type === "system";

    if (isSystem) {
      return (
        <div key={index} className="text-center my-2 mx-4">
          <span
            style={{
              color: theme.message.systemMessage.text[mode],
              background: theme.message.systemMessage.background[mode],
            }}
            className="box-decoration-clone text-xs rounded-full px-3 py-1 leading-relaxed"
          >
            {msg.content}
          </span>
        </div>
      );
    }

    return (
      <AnimateChangeInHeight key={msg.id + "listener"}>
        <ChatMessageItem
          participants={participants}
          key={index}
          index={index}
          message={msg}
          user={user!}
          isGroupChat={groupChat}
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
      <UserListModal
        theme={theme}
        mode={mode}
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        users={participants}
      />
      <ThemePickerDialog
        isOpen={isThemePickerOpen}
        onClose={() => setIsThemePickerOpen(false)}
        themes={[
          defaultTheme,
          criminologyTheme,
          speakNowTheme,
          monochromeTheme,
          tyronsTheme,
          prideCelebrationTheme,
          bumbleTheme,
          cosmicLatteTheme,
          sunsetBlissTheme,
          auroraGlowTheme,
        ]}
        activeTheme={theme}
        setActiveThemeAndMode={(theme, mode) => {
          onChangeTheme?.(mode, theme);
        }}
        activeMode={mode}
      />
      <EditNicknameDialog
        isOpen={isEditNicknameDialogOpen}
        onClose={() => setIsEditNicknameDialogOpen(false)}
        onSave={handleSaveNickname}
        currentNickname={currentNickname}
      />
      <EmojiOverlay
        open={emojiMenuState.open}
        message={emojiMenuState.message!}
        messageDiv={emojiMenuState.messageDiv!}
        user={user!}
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
          onDeleteMessage?.(messageId);
        }}
        onClose={() => onOpenEmojiMenu(null)}
      />

      <div
        id="chat-container"
        style={{
          fontFamily: theme.typography.fontFamily,
          fontSize: theme.typography.baseFontSize,
          background: theme.general.background[mode],
          backdropFilter: `blur(${theme.general.backdropBlur})`,
          boxShadow: theme.general.shadow,
          borderRadius: "var(--chat-border-radius, 2rem)",
        }}
        className="w-full max-w-4xl mx-auto h-[100dvh] flex flex-col"
      >
        <div
          style={{
            background: theme.header.background[mode],
            borderColor: theme.header.border[mode],
          }}
          className="p-4 border-b flex items-center shrink-0"
        >
          {(status !== "connected" || groupChat) && (
            <Button
              onClick={onBack}
              variant={"outline"}
              style={{
                background: theme.buttons.secondary.background[mode],
                color: theme.buttons.secondary.text[mode],
                borderColor:
                  theme.buttons.secondary.border?.[mode] || "transparent",
              }}
              className="rounded-full mr-2 p-1"
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
            <p
              style={{ color: theme.header.statusLabel[mode] }}
              className="text-xs font-medium"
            >
              {groupChat ? name : "Status"}
            </p>
            <p
              style={{ color: theme.header.statusValue[mode] }}
              className="text-sm font-semibold"
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </p>
          </div>

          {groupChat && (
            <Button
              onClick={() => setIsEditNicknameDialogOpen(true)}
              variant={"outline"}
              className="mr-2 rounded-full"
              style={{
                background: theme.buttons.secondary.background[mode],
                color: theme.buttons.secondary.text[mode],
                borderColor:
                  theme.buttons.secondary.border?.[mode] || "transparent",
              }}
            >
              <Pencil size={16} />
            </Button>
          )}

          {/* Icon Button For Theme Picker */}
          <Button
            onClick={() => setIsThemePickerOpen(true)}
            variant={"outline"}
            className="mr-2 rounded-full"
            style={{
              background: theme.buttons.secondary.background[mode],
              color: theme.buttons.secondary.text[mode],
              borderColor:
                theme.buttons.secondary.border?.[mode] || "transparent",
            }}
          >
            <Palette />
          </Button>

          {!groupChat && status === "connected" && (
            <Button
              onClick={() =>
                confirmedEnd
                  ? (endChat(), setConfirmedEnd(false))
                  : setConfirmedEnd(true)
              }
              className="px-3 py-1 text-sm rounded-full"
              style={{
                background: confirmedEnd
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
              <span className="hidden sm:inline">(Esc)</span>
              {confirmedEnd ? "Confirm?" : "End Chat"}
            </Button>
          )}
          {!groupChat && status !== "connected" && (
            <Button
              id="new-chat-button"
              onClick={newChat}
              className="px-3 py-1 text-sm rounded-full"
              style={{
                background: theme.buttons.primary.background[mode],
                color: theme.buttons.primary.text[mode],
              }}
            >
              <span className="hidden text-sm sm:inline">(Esc)</span>
              New Chat
            </Button>
          )}

          {groupChat && (
            <OnlineUsers
              theme={theme}
              mode={mode}
              users={participants}
              onOverflowClick={() => setIsUserModalOpen(true)}
            />
          )}
        </div>

        {announcement && (
          <div
            style={{
              background: theme.announcement.background[mode],
              color: theme.announcement.text[mode],
              borderColor: theme.announcement.border[mode],
            }}
            className="p-2 text-center text-xs border-b shrink-0"
          >
            <div dangerouslySetInnerHTML={{ __html: announcement }} />
          </div>
        )}

        {user?.role === "admin" && (
          <AdminControls
            onSetSong={handleSetSong}
            theme={theme}
            mode={mode}
            socket={wsRef.current}
            isPlaying={isPlaying}
            progress={progress}
            play={play}
            playbackBlocked={playbackBlocked}
            unblockPlayback={unblockPlayback}
          />
        )}

        {true && (
          <SharedMusicPlayer
            songName={currentSong?.name || "No song playing"}
            artistName={"Shared Music"}
            currentTime={progress}
            duration={duration}
            isMuted={isMuted}
            onMuteToggle={toggleMute}
            onSeek={() => {}}
            theme={theme}
            mode={mode}
            playbackBlocked={playbackBlocked}
            onUnblockPlayback={unblockPlayback}
            isAdmin={user?.role === "admin"}
            onAddSong={addToQueue}
            onSkip={voteToSkip}
            skipVotes={skipVotes}
            skipThreshold={skipThreshold}
            hasVotedToSkip={hasVotedToSkip}
            queue={queue}
            playbackError={playbackError}
          />
        )}

        <div
          className="flex flex-col flex-grow"
          id="chat-messages-list-container"
        >
          <AnimatePresence>
            {(status === "waiting_for_match" ||
              status === "finding_match" ||
              status === "connecting") && (
              <FindingMatchAnimation
                isGroupChat={groupChat}
                onCancel={cancelMatchmaking}
                key="finding-match-animation"
                theme={theme}
                mode={mode}
              />
            )}
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
              <div className="overflow-hidden">
                <AnimateChangeInHeight>
                  {typingUsers.length > 0 && (
                    <TypingIndicator
                      typingUsers={typingUsers}
                      key="typing-indicator"
                      theme={theme}
                      mode={mode}
                    />
                  )}
                </AnimateChangeInHeight>
              </div>
            </VList>

            <AnimatePresence>
              {showNewMessagesButton && (
                <motion.div
                  key="new-messages-button"
                  initial={{ y: "100%" }}
                  animate={{ y: "0" }}
                  exit={{ y: "100%" }}
                  className="absolute bottom-0 left-0 w-full flex items-center justify-center pb-2 pt-4"
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
                      backgroundColor:
                        theme.buttons.newMessages.background[mode],
                      color: theme.buttons.newMessages.text[mode],
                    }}
                    className="px-4 py-2 rounded-full shadow-lg flex items-center gap-2 transition-colors"
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

          <AnimateChangeInHeight>
            <motion.div
              key="bottom-message-preview"
              style={{
                paddingBottom: bottomMessagePreviewState ? "2rem" : 0,
                overflow: "hidden",
                visibility: bottomMessagePreviewState ? "visible" : "hidden",
                height: bottomMessagePreviewState ? "auto" : 0,
                backgroundColor:
                  theme.overlays.replyingPreview.background[mode],
                borderLeft: `4px solid ${theme.overlays.replyingPreview.border[mode]}`,
              }}
              className="flex items-start gap-2 px-3 py-2 relative"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    style={{
                      color: theme.overlays.replyingPreview.title[mode],
                    }}
                    className="text-xs font-semibold"
                  >
                    {bottomMessagePreviewState?.type === "replying"
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
                  {bottomMessagePreviewState?.description}
                </div>
              </div>
            </motion.div>
          </AnimateChangeInHeight>

          {groupChat && (
            <AnimateChangeInHeight>
              <div
                id="mentions-container"
                className="border-t"
                style={{
                  borderColor: theme.inputArea.border[mode],
                }}
              >
                {mentionParticipants.length > 0 && (
                  <div
                    style={{
                      backgroundColor: theme.inputArea.background[mode],
                      borderColor: theme.inputArea.border[mode],
                      maxHeight: "200px",
                      overflowY: "auto",
                    }}
                    className="p-2 border-t"
                  >
                    <ul className="space-y-1">
                      {mentionParticipants.map((participant) => (
                        <li
                          key={participant.userId}
                          className="flex items-center gap-2 cursor-pointer p-2 rounded-md transition-colors"
                          onClick={() => {
                            const textInput = document.getElementById(
                              "chat-input"
                            ) as HTMLInputElement;
                            const cursorPosition =
                              textInput.selectionStart || 0;
                            const textBeforeCursor = currentMessage.slice(
                              0,
                              cursorPosition
                            );
                            const atIndex = textBeforeCursor.lastIndexOf("@");
                            const newMessage = `${textBeforeCursor.slice(
                              0,
                              atIndex + 1
                            )}${participant.nickname} ${currentMessage.slice(
                              cursorPosition
                            )}`;
                            setCurrentMessage(newMessage);
                            setMentionParticipants([]);
                            textInput.focus();
                            textInput.setSelectionRange(
                              atIndex + participant.nickname.length + 2,
                              atIndex + participant.nickname.length + 2
                            );

                            // add mention to currentMentions
                            setCurrentMentions((prev) => [
                              ...prev,
                              {
                                id: participant.userId,
                                startIndex: atIndex + 1,
                                endIndex:
                                  atIndex + participant.nickname.length + 1,
                              },
                            ]);
                          }}
                        >
                          <span
                            className="text-sm font-medium"
                            style={{
                              color: theme.inputArea.inputText[mode],
                            }}
                          >
                            {participant.nickname}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AnimateChangeInHeight>
          )}

          <ChatInputBar
            theme={theme}
            mode={mode}
            currentMessage={currentMessage}
            handleInputChange={handleInputChange}
            currentMentions={currentMentions}
            setCurrentMentions={setCurrentMentions}
            onSendMessage={handleSend}
            onSendVoiceMessage={(blob) => {
              sendVoiceMessage(blob);
            }}
            onSendImageMessage={(imageB) => {
              sendImageMessage(imageB);
            }}
            groupChat={groupChat}
            status={status}
            onStartTyping={onStartTyping}
            participants={participants}
            bottomMessagePreviewState={bottomMessagePreviewState}
          />
        </div>
      </div>
    </>
  );
}
