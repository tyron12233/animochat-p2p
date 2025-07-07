import {
  createContext,
  useState,
  useContext,
  ReactNode,
  useCallback,
  useRef,
  useEffect,
} from "react";
import type {
  Message,
  Participant,
  Reaction,
  UserMessage,
  Mention,
  SystemMessage,
  VoiceMessage,
} from "../lib/types";
import { useSession } from "./session-context";
import { useChatTheme } from "./chat-theme-context";
import { AuthUser } from "./auth-context";
import {
  ChangeNicknamePacket,
  DeleteMessagePacket,
  EditMessagePacket,
  MessagePacket,
  ReactionPacket,
  TypingPacket,
  ChangeThemePacket,
  ParticipantJoinedPacket,
  VoiceMessagePacket,
} from "../lib/packets";
import { ChatThemeV2 } from "../lib/chat-theme";
import { defaultTheme } from "../lib/default-chat-themes";
import { ChatSessionData } from "../hooks/use-chat-session";
import { API_MATCHMAKING_BASE_URL } from "../lib/servers";

interface ChatConnectionContextState {
  messages: Message[];
  participants: Participant[];
  typingUsers: string[];
  sendVoiceMessage: (audioBlob: Blob) => Promise<void>;
  sendMessage: (
    content: string,
    replyingToId?: string,
    mentions?: Mention[]
  ) => void;
  editMessage: (messageId: string, newContent: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onReact: (messageId: string, emoji?: string | null) => Promise<void>;
  onChangeNickname: (nickname: string) => void;
  onChangeTheme: (mode: "light" | "dark", theme: ChatThemeV2) => void;
  connectToChat: (
    chatServerUrl: string,
    chatIdToConnect: string,
    interests?: string[],
    isReconnecting?: boolean,
    showRandomStrangerMessage?: boolean
  ) => void;
  connectToExistingSession: (session: ChatSessionData) => void;
  disconnect: (isGroupChat?: boolean) => void;
  onStartTyping: () => void;
  resetState: () => void;
}

const ChatConnectionContext = createContext<
  ChatConnectionContextState | undefined
>(undefined);

export const ChatConnectionProvider = ({
  children,
  user,
  isGroupChat = false,
}: {
  children: ReactNode;
  user: AuthUser | null;
  isGroupChat?: boolean;
}) => {
  // State from other contexts
  const { chatId, setChatId, setStatus } = useSession();
  const { setTheme, setMode } = useChatTheme();

  // Internal State and Refs
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const userId = user?.id ?? "";

  const wsRef = useRef<WebSocket | null>(null);
  const isTypingRef = useRef<boolean>(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDisconnectingRef = useRef<boolean>(false);
  const reconnectionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectionAttemptsRef = useRef<number>(0);

  // Low-level packet sender
  const sendPacket = useCallback((packet: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(packet));
    } else {
      console.error("Cannot send packet, WebSocket is not open.");
    }
  }, []);

  useEffect(() => {
    // @ts-ignore
    window.sendPacket = sendPacket;
  }, []);

  // Reaction handler
  const handleReaction = useCallback(
    (
      messageId: string,
      emoji: string | null,
      reactingUserId: string,
      reactingUserNickname: string = "Anonymous"
    ) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) => {
          if (msg.id !== messageId || msg.type === "system") return msg;
          const reactions = msg.reactions || [];
          const existingReactionIndex = reactions.findIndex(
            (r) => r.user_id === reactingUserId
          );
          let newReactions: Reaction[];

          if (existingReactionIndex > -1) {
            if (emoji) {
              newReactions = [...reactions];
              newReactions[existingReactionIndex] = {
                user_id: reactingUserId,
                emoji,
                message_id: messageId,
                nickname: reactingUserNickname,
              };
            } else {
              newReactions = reactions.filter(
                (_, index) => index !== existingReactionIndex
              );
            }
          } else if (emoji) {
            newReactions = [
              ...reactions,
              {
                user_id: reactingUserId,
                emoji,
                message_id: messageId,
                nickname: reactingUserNickname,
              },
            ];
          } else {
            newReactions = reactions;
          }
          return { ...msg, reactions: newReactions };
        })
      );
    },
    []
  );

  // Public Actions
  const onChangeNickname = useCallback(
    (nickname: string) => {
      if (nickname.length === 0 || !userId) return;
      const packet: ChangeNicknamePacket = {
        type: "change_nickname",
        content: { newNickname: nickname, userId },
        sender: userId,
      };
      sendPacket(packet);
      setParticipants((prev) =>
        prev.map((p) => (p.userId === userId ? { ...p, nickname } : p))
      );
      const systemMessage: SystemMessage = {
        id: `system_${Date.now()}`,
        session_id: chatId,
        created_at: new Date().toISOString(),
        type: "system",
        content: `You changed your nickname to ${nickname}.`,
        sender: "system",
      };
      setMessages((prev) => [...prev, systemMessage]);
    },
    [userId, chatId, sendPacket]
  );

  const onDeleteMessage = useCallback(
    (messageId: string) => {
      if (!userId || !chatId) return;
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, type: "deleted" } : msg
        )
      );
      const packet: DeleteMessagePacket = {
        type: "message_delete",
        content: messageId,
        sender: userId,
      };
      sendPacket(packet);
    },
    [userId, chatId, sendPacket]
  );

  const onReact = useCallback(
    async (messageId: string, emoji?: string | null) => {
      if (!userId) return;
      const nickname =
        participants.find((p) => p.userId === userId)?.nickname || "Anonymous";
      handleReaction(messageId, emoji || null, userId, nickname);
      const packet: ReactionPacket = {
        type: "reaction",
        sender: userId,
        content: {
          message_id: messageId,
          emoji: emoji || null,
          user_id: userId,
          nickname,
        },
      };
      sendPacket(packet);
    },
    [userId, sendPacket, participants, handleReaction]
  );

  const editMessage = useCallback(
    (messageId: string, newContent: string) => {
      if (!newContent || !messageId || !userId) return;
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, content: newContent, edited: true }
            : msg
        )
      );
      const packet: EditMessagePacket = {
        type: "edit_message",
        content: {
          message_id: messageId,
          new_content: newContent,
          user_id: userId,
        },
        sender: userId,
      };
      sendPacket(packet);
    },
    [userId, sendPacket]
  );

  const sendVoiceMessage = useCallback(
    async (audioBlob: Blob) => {
      if (!userId || !chatId) return;

      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      await new Promise((resolve) => {
        console.log("Reading audio blob as base64...");
        reader.onloadend = resolve;
      });

      const audioBase64 = reader.result as string;

      const message: VoiceMessage = {
        id: `msg_${Date.now()}`,
        session_id: chatId,
        created_at: new Date().toISOString(),
        content: audioBase64,
        voice_content: null,
        type: "voice_message",
        sender: userId,
        role: user?.role,
        reactions: [],
      };

      const packet: VoiceMessagePacket = {
        type: "message",
        content: message,
        sender: userId,
      };

      sendPacket(packet);
      setMessages((prev) => [...prev, message]);
    },
    [userId, chatId, sendPacket, user]
  );

  const sendMessage = useCallback(
    (content: string, replyingToId?: string, mentions?: Mention[]) => {
      if (!userId || !chatId) return;
      const stopTypingPacket: TypingPacket = {
        type: "typing",
        content: false,
        sender: userId,
      };
      sendPacket(stopTypingPacket);
      if (isTypingRef.current) isTypingRef.current = false;

      const message: UserMessage = {
        id: `msg_${Date.now()}`,
        session_id: chatId,
        created_at: new Date().toISOString(),
        content,
        replyingTo: replyingToId,
        sender: userId,
        role: user?.role,
        mentions: mentions || [],
        reactions: [],
      };
      const packet: MessagePacket = {
        type: "message",
        content: message,
        sender: userId,
      };
      sendPacket(packet);
      setMessages((prev) => [...prev, message]);
    },
    [userId, chatId, sendPacket, user]
  );

  const onStartTyping = useCallback(() => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      sendPacket({ type: "typing", content: true, sender: userId });
    }
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      sendPacket({ type: "typing", content: false, sender: userId });
    }, 3000);
  }, [userId, sendPacket]);

  const onChangeTheme = useCallback(
    (mode: "light" | "dark", theme: ChatThemeV2) => {
      if (!userId || !chatId) return;

      const packet: ChangeThemePacket = {
        type: "change_theme",
        content: { mode, theme },
        sender: userId,
      };
      sendPacket(packet);

      setMode(mode);
      setTheme(theme);

      const themeMessage: SystemMessage = {
        id: `system_${Date.now()}`,
        session_id: chatId,
        created_at: new Date().toISOString(),
        type: "system",
        content: `Theme changed to ${theme.name} in ${mode} mode.`,
        sender: "system",
      };
      setMessages((prev) => [...prev, themeMessage]);
    },
    [userId, chatId, sendPacket, setMode, setTheme, setMessages]
  );

  const disconnect = useCallback(() => {
    isDisconnectingRef.current = true;
    if (reconnectionTimerRef.current) {
      clearTimeout(reconnectionTimerRef.current);
    }

    const disconnectFromApi = async () => {
      const disconnectApi = `${API_MATCHMAKING_BASE_URL}/session/disconnect?userId=${userId}`;
      try {
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };

        const response = await fetch(disconnectApi, {
          method: "POST",
          headers,
          body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
          console.error(
            "Failed to disconnect from session:",
            response.statusText
          );
        } else {
          console.log("Successfully disconnected from session.");
        }
      } catch (error) {
        console.error("Error disconnecting from session:", error);
      }
    };

    if (!isGroupChat) {
      disconnectFromApi().then(() => {
        console.log("Disconnected from matchmaking and chat.");
      });
    }

    if (wsRef.current) {
      if (!isGroupChat) {
        sendPacket({ type: "disconnect", content: null, sender: userId });
      }
      wsRef.current.close();
      console.log("CLOSING");
      wsRef.current = null;
    }

    if (!isGroupChat) {
      const message: SystemMessage = {
        content: "You have disconnected.",
        created_at: new Date().toISOString(),
        id: "ended_" + new Date().toISOString(),
        sender: "system",
        session_id: chatId,
        type: "system",
      };

      setMessages((prev) => [...prev, message]);
    }

    setStatus("disconnected");
    setChatId("");
  }, [userId, sendPacket, setStatus, setChatId, isGroupChat]);

  const connectToChat = useCallback(
    (
      chatServerUrl: string,
      chatIdToConnect: string,
      interests: string[] = [],
      isReconnecting = false,
      showRandomStrangerMessage = false
    ) => {
      if (wsRef.current || !userId) return;

      let url = chatServerUrl.endsWith("/")
        ? chatServerUrl.slice(0, -1)
        : chatServerUrl;

      isDisconnectingRef.current = false;
      if (reconnectionTimerRef.current) {
        clearTimeout(reconnectionTimerRef.current);
      }

      const setupWebsocketListeners = (ws: WebSocket) => {
        ws.onopen = (e) => {
          console.log("WebSocket connection established.");
          setStatus("connected");
          reconnectionAttemptsRef.current = 0;

          let message: string;
          if (isReconnecting) {
            message = "Reconnected to the chat successfully.";
            if (isGroupChat) {
              message = "Connected to chat room.";
            }
          } else if (showRandomStrangerMessage) {
            message =
              "We couldn't find a match with your interests, so you matched with a random stranger. Say hi!";
          } else if (interests.length > 0) {
            const formattedInterests = interests
              .map((interest) => interest.trim())
              .filter(Boolean)
              .join(", ");
            message = formattedInterests
              ? `You matched with a stranger on ${formattedInterests}! Say hi!`
              : "You matched with a random stranger! Say hi!";
          } else {
            message = "You matched with a random stranger! Say hi!";
          }

          const welcomeMessage: SystemMessage = {
            id: `system_${Date.now()}`,
            session_id: chatIdToConnect,
            created_at: new Date().toISOString(),
            type: "system",
            content: message,
            sender: "system",
          };

          if (!isGroupChat) {
            setMessages((prev) => (isReconnecting ? prev : [welcomeMessage]));
            if (isReconnecting) {
              setMessages((prev) => [...prev, welcomeMessage]);
            }
          }
        };

        ws.onmessage = async (e: MessageEvent) => {
          const packet = JSON.parse(
            await (e.data instanceof Blob ? e.data.text() : e.data)
          );
          if (packet.sender === userId) return;

          switch (packet.type) {
            case "message_delete":
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === packet.content ? { ...msg, type: "deleted" } : msg
                )
              );
              break;
            case "voice_message":
              const voiceMessagePacket: VoiceMessagePacket = packet;
              const voiceMessage: VoiceMessage = {
                ...voiceMessagePacket.content,
                reactions: [],
              };
              setMessages((prev) => [...prev, voiceMessage]);
              break;
            case "change_nickname":
              const { userId: changedUserId, newNickname } =
                packet.content as ChangeNicknamePacket["content"];

              let oldNickname = participants.find(
                (p) => p.userId === changedUserId
              )?.nickname;

              if (!oldNickname) {
                console.warn(
                  `Nickname change received for unknown user: ${changedUserId}`
                );

                oldNickname = "A participant";
              }

              setParticipants((prev) =>
                prev.map((p) =>
                  p.userId === changedUserId
                    ? { ...p, nickname: newNickname }
                    : p
                )
              );
              break;
            case "change_theme":
              const { mode, theme } = (packet as ChangeThemePacket).content;
              setMode(mode);
              setTheme(theme);
              break;
            case "offline":
              setParticipants((prev) =>
                prev.map((p) =>
                  p.userId === packet.content ? { ...p, status: "offline" } : p
                )
              );
              break;
            case "disconnect":
              setMessages((prev) => [
                ...prev,
                {
                  id: `system_${Date.now()}`,
                  session_id: chatIdToConnect,
                  created_at: new Date().toISOString(),
                  type: "system",
                  content: "The other user has disconnected.",
                  sender: "system",
                },
              ]);
              ws.close();

              isDisconnectingRef.current = true;
              if (reconnectionTimerRef.current) {
                clearTimeout(reconnectionTimerRef.current);
              }
              reconnectionAttemptsRef.current = 0;

              wsRef.current = null;
              setChatId("");
              setStatus("disconnected");
              break;
            case "participant_joined":
              if (!isGroupChat) return;

              const participantJoinedPacket: ParticipantJoinedPacket = packet;

              const newParticipant = participantJoinedPacket.content;

              setParticipants((prev) => {
                const existingParticipantIndex = prev.findIndex(
                  (p) => p.userId === newParticipant.userId
                );
                if (existingParticipantIndex > -1) {
                  // Update existing participant's status to online
                  const updatedParticipants = [...prev];
                  updatedParticipants[existingParticipantIndex] = {
                    ...updatedParticipants[existingParticipantIndex],
                    status: "online",
                  };
                  return updatedParticipants;
                }
                return [
                  ...prev,
                  {
                    ...newParticipant,
                    status: "online",
                  },
                ];
              });

              setMessages((prev) => [
                ...prev,
                {
                  id: `system_${Date.now()}`,
                  session_id: chatIdToConnect,
                  created_at: new Date().toISOString(),
                  type: "system",
                  content: `${newParticipant.nickname} joined the chat.`,
                  sender: "system",
                },
              ]);
              break;
            case "STATUS": // legacy system message
              setMessages((prev) => [
                ...prev,
                {
                  id: `system_${Date.now()}`,
                  session_id: chatIdToConnect,
                  created_at: new Date().toISOString(),
                  type: "system",
                  content: packet.message,
                  sender: "system",
                },
              ]);
              break;
            case "message":
              setMessages((prev) => [...prev, packet.content]);
              break;
            case "reaction":
              const { message_id, emoji, user_id, nickname } =
                packet.content as Reaction;
              handleReaction(message_id, emoji, user_id, nickname);
              break;
            case "typing":
              const isTyping = packet.content as boolean;
              const typingUserId = packet.sender;
              setTypingUsers((prev) => {
                const isAlreadyTyping = prev.includes(typingUserId);
                if (isTyping) {
                  return isAlreadyTyping ? prev : [...prev, typingUserId];
                } else {
                  return prev.filter((id) => id !== typingUserId);
                }
              });
              break;
            case "edit_message":
              const {
                message_id: editId,
                new_content,
                user_id: editorId,
              } = packet.content;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === editId && msg.sender === editorId
                    ? { ...msg, content: new_content, edited: true }
                    : msg
                )
              );
              break;
            default:
              console.warn("Unknown packet type:", packet.type);
          }
        };
        ws.onclose = () => {
          if (!isDisconnectingRef.current) {
            setStatus("reconnecting");
          }
        };
        ws.onerror = (err) => {
          console.error("WebSocket error:", err);
          setStatus("error");
        };
      };

      try {
        const wsUrl = `${url}?userId=${userId}&chatId=${chatIdToConnect}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        setupWebsocketListeners(ws);
      } catch (error) {
        console.error("Failed to establish connection:", error);
      }
    },
    [
      userId,
      setStatus,
      setMessages,
      setParticipants,
      setTypingUsers,
      handleReaction,
      setTheme,
      setMode,
      setChatId,
      isGroupChat,
    ]
  );

  function connectToExistingSession(data: ChatSessionData) {
    setStatus("connecting");

    const syncMessages = async (chatServer: string, chatId: string) => {
      ///sync/:chatId
      let baseUrl = chatServer.endsWith("/")
        ? chatServer.slice(0, -1)
        : chatServer;
      const syncApi = `${baseUrl}/sync/${chatId}`;
      try {
        const headers: HeadersInit = {};
        const response = await fetch(syncApi, {
          headers,
        });
        if (!response.ok) {
          throw new Error(`Failed to sync messages: ${response.statusText}`);
        }

        // will return a message sync packet
        const responseJson = await response.json();

        return responseJson;
      } catch (error) {
        console.error("Error syncing messages:", error);
        return [];
      }
    };

    setChatId(data.chatId);

    syncMessages(data.chatServerUrl, data.chatId)
      .then((json) => {
        setMessages(json.messages.content || []);
        setParticipants(json.onlineParticipants || []);
        setTheme(json.theme || defaultTheme);
        setMode(json.mode || "light");
      })
      .catch(() => {
        setStatus("error");
        console.error("Failed to sync messages or participants.");
        return [];
      })
      .then(() => {
        connectToChat(data.chatServerUrl, data.chatId, [], true);
      });
  }

  return (
    <ChatConnectionContext.Provider
      value={{
        messages,
        participants,
        typingUsers,
        sendMessage,
        sendVoiceMessage,
        editMessage,
        onDeleteMessage,
        onReact,
        onChangeNickname,
        onChangeTheme,
        connectToChat,
        disconnect,
        onStartTyping,
        connectToExistingSession,
        resetState: () => {
            setMessages([]);
            setParticipants([]);
            setTypingUsers([]);
        }
      }}
    >
      {children}
    </ChatConnectionContext.Provider>
  );
};

export const useChatConnection = () => {
  const context = useContext(ChatConnectionContext);
  if (context === undefined) {
    throw new Error(
      "useChatConnection must be used within a ChatConnectionProvider"
    );
  }
  return context;
};
