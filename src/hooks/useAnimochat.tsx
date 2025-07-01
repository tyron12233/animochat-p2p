"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type {
  Screen,
  MatchmakingData,
  Message,
  Reaction,
  Status,
  SystemMessage,
  UserMessage,
} from "../lib/types";
import { useChatTheme } from "../context/theme-context";
import { ChatThemeV2 } from "../lib/chat-theme";
import { defaultTheme } from "../lib/default-chat-themes";
import { ChatSessionData } from "./use-chat-session";
import { API_MATCHMAKING_BASE_URL } from "../lib/servers";
import { AuthUser, AuthSession } from "../context/auth-context";
import { useWhatChanged } from "./use-what-changed";

// --- Configuration ---
// The base URL for your matchmaking server.
const API_BASE_URL = API_MATCHMAKING_BASE_URL;

// --- Packet Types for WebSocket Communication ---
// These define the structure of messages sent over the WebSocket connection.
type Packet<T, K extends string> = {
  type: K;
  content: T;
  sender: string;
};

export type ChangeNicknamePacket = Packet<
  {
    userId: string;
    newNickname: string;
  },
  "change_nickname"
>;

export interface Participant {
  status: string;
  userId: string;
  nickname: string;
}

export type ParticipantsSyncPacket = Packet<Participant[], "participants_sync">;
export type ParticipantJoinedPacket = Packet<Participant, "user_joined">;

type DeleteMessagePacket = Packet<string, "message_delete">;
type MessagePacket = Packet<UserMessage, "message">;
type ReactionPacket = Packet<Reaction, "reaction">;
type TypingPacket = Packet<boolean, "typing">;
type EditMessagePacket = Packet<
  { message_id: string; new_content: string; user_id: string },
  "edit_message"
>;
type DisconnectPacket = Packet<null, "disconnect">;
type ChangeThemePacket = Packet<
  {
    mode: "light" | "dark";
    theme: ChatThemeV2;
  },
  "change_theme"
>;

// This packet is used when the user is offline or not connected.
// the content is a string (the user id of the user who when offline).
type OfflinePacket = Packet<string, "offline">;
type UserJoinedPacket = Packet<string, "user_joined">;

export const useAnimochatV2 = (
  session: AuthSession | null,
  user: AuthUser | null,
  isGroupChat = false
) => {
  const { setTheme, setMode } = useChatTheme();

  const [userId, setUserId] = useState<string>(user?.id ?? "");

  // --- State Management ---
  const [screen, setScreen] = useState<Screen>("intro");
  const [status, setStatus] = useState<Status>("initializing");
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatId, setChatId] = useState<string>("");

  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    if (user) {
      console.log("User data available:", user);
      setUserId(user.id);
    }
  }, [user]);

  // --- Refs for managing connections and state ---
  const wsRef = useRef<WebSocket | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const isTypingRef = useRef<boolean>(false);

  function connectToExistingSession(data: ChatSessionData) {
    setStatus("connecting");
    setScreen("chat");

    const syncMessages = async (chatServer: string, chatId: string) => {
      ///sync/:chatId
      let baseUrl = chatServer.endsWith("/")
        ? chatServer.slice(0, -1)
        : chatServer;
      const syncApi = `${baseUrl}/sync/${chatId}`;
      try {
        const headers: HeadersInit = {};
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }
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

        console.log("online participants", json.onlineParticipants);

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

  // --- Core Data Handling Functions ---

  /**
   * Handles updating the UI when a reaction is added, changed, or removed.
   * @param messageId The ID of the message being reacted to.
   * @param emoji The emoji string, or null to remove the reaction.
   * @param reactingUserId The ID of the user who is reacting.
   */
  const handleReaction = (
    messageId: string,
    emoji: string | null,
    reactingUserId: string
  ) => {
    console.log("Handling reaction:", {
      messageId,
      emoji,
      userId: reactingUserId,
    });
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
            // Replace existing reaction
            newReactions = [...reactions];
            newReactions[existingReactionIndex] = {
              user_id: reactingUserId,
              emoji,
              message_id: messageId,
            };
          } else {
            // Remove the reaction
            newReactions = reactions.filter(
              (_, index) => index !== existingReactionIndex
            );
          }
        } else if (emoji) {
          // Add a new reaction
          newReactions = [
            ...reactions,
            { user_id: reactingUserId, emoji, message_id: messageId },
          ];
        } else {
          // Do nothing
          newReactions = reactions;
        }
        return { ...msg, reactions: newReactions };
      })
    );
  };

  /**
   * Sends a packet through the WebSocket connection if it is open.
   * @param packet The data packet to send.
   */
  const sendPacket = useCallback(async (packet: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(packet));
    } else {
      console.error("Cannot send packet, WebSocket connection is not open.");
    }
  }, []);

  // --- User Actions ---

  const onChangeNickname = (nickname: string) => {
    if (nickname.length === 0) return;

    const packet: ChangeNicknamePacket = {
      type: "change_nickname",
      content: {
        newNickname: nickname,
        userId: userId,
      },
      sender: userId,
    };

    // Optimistically update the local state to reflect the nickname change.
    setParticipants((prev) =>
      prev.map((p) => (p.userId === userId ? { ...p, nickname } : p))
    );

    sendPacket(packet);

    const systemMessage: SystemMessage = {
      id: `system_${Date.now()}`,
      session_id: chatId,
      created_at: new Date().toISOString(),
      type: "system",
      content: `You changed your nickname to ${nickname}.`,
      sender: "system",
    };

    setMessages((prev) => [...prev, systemMessage]);
  };

  const onDeleteMessage = useCallback(
    (messageId: string) => {
      if (!userId || !chatId) return;

      // Optimistically update the UI to remove the message.
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));

      const packet: DeleteMessagePacket = {
        type: "message_delete",
        content: messageId,
        sender: userId,
      };
      sendPacket(packet);
    },
    [userId, chatId, sendPacket]
  );

  const onCancelMatchmaking = () => {
    const cancelApi = () => {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const url = `${API_BASE_URL}/cancel_matchmaking`;
      return fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ userId: userId }),
      });
    };

    cancelApi()
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Failed to cancel matchmaking: ${response.statusText}`
          );
        }
        console.log("Matchmaking cancelled successfully.");

        console.log("Cancelling matchmaking...");
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
        setStatus("ready");
        setScreen("matchmaking");
        setChatId("");
      })
      .catch((error) => {
        console.error("Error cancelling matchmaking:", error);
        setStatus("finding_match");
      });
  };

  const onChangeTheme = (mode: "light" | "dark", theme: ChatThemeV2) => {
    console.log("THEME CHANGE REQUESTED");
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
  };

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const onStartTyping = useCallback(() => {
    if (isTypingRef.current) {
      // If already typing, reset the timeout to extend the typing indication.
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        const stopTypingPacket: TypingPacket = {
          type: "typing",
          content: false,
          sender: userId,
        };
        sendPacket(stopTypingPacket);
      }, 3000);
      return;
    }
    isTypingRef.current = true;

    const startTypingPacket: TypingPacket = {
      type: "typing",
      content: true,
      sender: userId,
    };
    sendPacket(startTypingPacket);

    // Set a timeout to automatically send a "stop typing" event.
    timeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      const stopTypingPacket: TypingPacket = {
        type: "typing",
        content: false,
        sender: userId,
      };
      sendPacket(stopTypingPacket);
    }, 3000);
  }, [userId, sendPacket]);

  const onReact = useCallback(
    async (messageId: string, emoji?: string | null) => {
      if (!userId) return;
      // Optimistically update the UI for the local user immediately.
      handleReaction(messageId, emoji || null, userId);

      // Send the reaction packet to the server to be relayed to the other user.
      const packet: ReactionPacket = {
        type: "reaction",
        sender: userId,
        content: {
          message_id: messageId,
          emoji: emoji || null,
          user_id: userId,
        },
      };
      sendPacket(packet);
    },
    [userId, sendPacket]
  );

  const editMessage = useCallback(
    (messageId: string, newContent: string) => {
      if (!newContent || !messageId || !userId) return;

      // Optimistically update local UI.
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

  const sendMessage = useCallback(
    (content: string, replyingToId?: string) => {
      if (!userId || !chatId) return;

      const stopTypingPacket: TypingPacket = {
        type: "typing",
        content: false,
        sender: userId,
      };
      sendPacket(stopTypingPacket);

      const message: UserMessage = {
        id: `msg_${Date.now()}`,
        session_id: chatId,
        created_at: new Date().toISOString(),
        content,
        replyingTo: replyingToId,
        sender: userId,
        role: user?.role,
      } as any;

      const packet: MessagePacket = {
        type: "message",
        content: message,
        sender: userId,
      };

      console.log("sending packet", packet);
      sendPacket(packet);

      // Add the message to the local state immediately.
      setMessages((prev) => [...prev, message]);
    },
    [userId, chatId, sendPacket, session]
  );

  const disconnect = useCallback(
    (isGroupChat: boolean = false) => {
      isDisconnectingRef.current = true;
      if (reconnectionTimerRef.current) {
        clearTimeout(reconnectionTimerRef.current);
      }

      if (randomMatchmakingTimeoutRef.current) {
        clearTimeout(randomMatchmakingTimeoutRef.current);
      }

      const disconnectFromApi = async () => {
        const disconnectApi = `${API_BASE_URL}/session/disconnect?userId=${userId}`;
        try {
          const headers: HeadersInit = {
            "Content-Type": "application/json",
          };
          if (session?.access_token) {
            headers["Authorization"] = `Bearer ${session.access_token}`;
          }

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

      const message: SystemMessage = {
        id: `system_${Date.now()}`,
        session_id: chatId,
        created_at: new Date().toISOString(),
        type: "system",
        content: "You have disconnected from the chat.",
        sender: "system",
      };
      setMessages((prev) => [...prev, message]);

      if (wsRef.current && !isGroupChat) {
        const disconnectPacket: DisconnectPacket = {
          type: "disconnect",
          content: null,
          sender: userId,
        };
        sendPacket(disconnectPacket);
      }

      wsRef.current?.close();
      wsRef.current = null;
      eventSourceRef.current?.close();
      eventSourceRef.current = null;

      setStatus("disconnected");
      setChatId("");
    },
    [userId]
  );

  // --- Matchmaking and Connection Logic ---

  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY_MS = 4000;
  const isDisconnectingRef = useRef<boolean>(false);
  const reconnectionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectionAttemptsRef = useRef<number>(0);

  const connectToChat = useCallback(
    async (
      chatServerUrl: string,
      chatIdToConnect: string,
      interests: string[] = [],
      isReconnecting = false,
      showRandomStrangerMessage = false
    ) => {
      if (wsRef.current) {
        return;
      }

      // check trailing /
      if (chatServerUrl.endsWith("/")) {
        chatServerUrl = chatServerUrl.slice(0, -1);
      }

      if (!userId) {
        console.error("User ID not set, cannot connect to chat.");
        return;
      }

      console.log(
        `Attempting to connect to chat: ${chatIdToConnect}. Reconnecting: ${isReconnecting}`
      );
      isDisconnectingRef.current = false;
      if (reconnectionTimerRef.current) {
        clearTimeout(reconnectionTimerRef.current);
      }

      const setupWebsocketListeners = (ws: WebSocket) => {
        ws.onopen = () => {
          console.log("WebSocket connection established.");
          setStatus("connected");
          reconnectionAttemptsRef.current = 0; // Reset attempts on success

          // Compose the welcome or reconnection message for the chat.
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

        ws.onmessage = async (e: MessageEvent<any>) => {
          const rawPacket = e.data;
          let jsonPacket: any;
          if (rawPacket instanceof Blob) {
            jsonPacket = JSON.parse(await rawPacket.text());
          } else {
            jsonPacket = JSON.parse(rawPacket);
          }

          const packet = jsonPacket;

          if (packet.sender === userId) return;

          switch (jsonPacket.type) {
            case "message_delete":
              const messageIdToDelete = jsonPacket.content as string;
              // set type of message with id messageIdToDelete to "deleted"
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === messageIdToDelete
                    ? { ...msg, type: "deleted" }
                    : msg
                )
              );
              break;
            case "change_nickname":
              const { userId: changedUserId, newNickname } =
                jsonPacket.content as ChangeNicknamePacket["content"];

              // before updating the nickname,
              // create a system message that will
              // be displayed in the chat {old username} changed their nickname to {new nickname}
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

              const systemMessage: SystemMessage = {
                id: `system_${Date.now()}`,
                session_id: chatIdToConnect,
                created_at: new Date().toISOString(),
                type: "system",
                content: `${oldNickname} changed their nickname to ${newNickname}.`,
                sender: "system",
              };

              // change the nickname of the user in the messages
              setMessages((prev) => [
                ...prev.map((msg) =>
                  msg.sender === changedUserId
                    ? { ...msg, senderNickname: newNickname }
                    : msg
                ),
                systemMessage,
              ]);

              break;
            case "change_theme":
              const { mode, theme } = (jsonPacket as ChangeThemePacket).content;
              console.log("Changing theme to:", theme.name, "Mode:", mode);
              setMode(mode);
              setTheme(theme);
              setMessages((prev) => [
                ...prev,
                {
                  id: `system_${Date.now()}`,
                  session_id: chatIdToConnect,
                  created_at: new Date().toISOString(),
                  type: "system",
                  content: `Theme changed to ${theme.name} in ${mode} mode.`,
                  sender: "system",
                },
              ]);
              break;
            case "offline":
              const offlineUserId = jsonPacket.content as string;

              // set participant status to "offline"
              setParticipants((prev) =>
                prev.map((p) =>
                  p.userId === offlineUserId ? { ...p, status: "offline" } : p
                )
              );

              // Create a system message indicating the user is offline
              // we cannot use participants.find here because the user may not be in the participants list because participants is a state
              // we need a way to get the nickname of the user who went offline

              // TODO: fix this (maybe a ref?)

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
              eventSourceRef.current?.close();
              setChatId("");
              setStatus("disconnected");
              break;
            case "participant_joined":
              if (!isGroupChat) return;

              const participantJoinedPacket: ParticipantJoinedPacket = packet;

              const newParticipant = participantJoinedPacket.content;

              // Only add if not already present, if already present, update status to online
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
            case "STATUS":
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
              setMessages((prev) => [...prev, jsonPacket.content]);
              break;
            case "reaction":
              const { message_id, emoji, user_id } = jsonPacket.content;
              handleReaction(message_id, emoji, user_id);
              break;
            case "typing":
              const isTyping = jsonPacket.content as boolean;
              const typingUserId = jsonPacket.sender;
              setTypingUsers((prev) => {
                const isAlreadyTyping = prev.includes(typingUserId);
                if (isTyping) {
                  return isAlreadyTyping ? prev : [...prev, typingUserId];
                } else {
                  // Remove user from the list
                  return prev.filter((id) => id !== typingUserId);
                }
              });
              break;
            case "edit_message":
              const {
                message_id: editId,
                new_content,
                user_id: editorId,
              } = jsonPacket.content;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === editId && msg.sender === editorId
                    ? { ...msg, content: new_content, edited: true }
                    : msg
                )
              );
              break;
            default:
              console.warn("Unknown packet type received:", jsonPacket.type);
          }
        };

        ws.onclose = (e) => {
          console.log("WebSocket connection closed.", e);
          if (isDisconnectingRef.current) {
            console.log("Intentional disconnect, not reconnecting.");
            return;
          }

          wsRef.current = null;
          setStatus("reconnecting");
          setMessages((prev) => [
            ...prev,
            {
              id: `system_${Date.now()}`,
              session_id: chatIdToConnect,
              created_at: new Date().toISOString(),
              type: "system",
              content: "Connection lost. Attempting to reconnect...",
              sender: "system",
            },
          ]);

          if (reconnectionAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
            reconnectionAttemptsRef.current++;
            console.log(
              `Scheduling reconnection attempt #${reconnectionAttemptsRef.current}`
            );
            reconnectionTimerRef.current = setTimeout(() => {
              connectToChat(chatServerUrl, chatIdToConnect, [], true);
            }, RECONNECT_DELAY_MS * reconnectionAttemptsRef.current);
          } else {
            console.error("Max reconnection attempts reached. Giving up.");
            setMessages((prev) => [
              ...prev,
              {
                id: `system_${Date.now()}`,
                session_id: chatIdToConnect,
                created_at: new Date().toISOString(),
                type: "system",
                content:
                  "Could not reconnect to the server. Please find a new match.",
                sender: "system",
              },
            ]);
            setStatus("error");
          }
        };

        ws.onerror = (err) => {
          console.error("WebSocket error:", err);
          setStatus("error");
        };
      };

      try {
        const wsUrl = `${chatServerUrl}?userId=${userId}&chatId=${chatIdToConnect}`;
        console.trace(`Connecting to WebSocket server: ${wsUrl}`);
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        setupWebsocketListeners(ws);
      } catch (error) {
        console.error("Failed to establish connection:", error);
        wsRef.current?.close(); // Ensure any partial connection is closed.
        // Trigger the onclose logic to handle retries
        if (wsRef.current) {
          wsRef.current.onclose?.(new CloseEvent("close"));
        } else {
          // If the websocket was never even created, manually trigger reconnect logic
          if (reconnectionAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
            reconnectionAttemptsRef.current++;
            reconnectionTimerRef.current = setTimeout(() => {
              connectToChat(chatServerUrl, chatIdToConnect, [], true);
            }, RECONNECT_DELAY_MS * reconnectionAttemptsRef.current);
          }
        }
      }
    },
    [
      user,
      userId,
      handleReaction,
      setTheme,
      setMode,
      sendPacket,
      setMessages,
      setStatus,
    ]
  );

  const randomMatchmakingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startMatchmaking = useCallback(
    (interests: string[], showRandom: boolean = false) => {
      if (randomMatchmakingTimeoutRef.current) {
        clearTimeout(randomMatchmakingTimeoutRef.current);
      }

      console.log("Starting matchmaking with interests:", interests);

      if (!userId) {
        console.error("User ID not set yet. Cannot start matchmaking.");
        setStatus("error");
        return;
      }

      setScreen("chat");
      setStatus("finding_match");

      let url = `${API_BASE_URL}/matchmaking?userId=${userId}`;
      if (interests.length > 0) {
        url += `&interests=${encodeURIComponent(interests.join(","))}`;
      }

      console.log(`Connecting to matchmaking server: ${url}`);
      const es = new EventSource(url);
      eventSourceRef.current = es;

      // only set timeout if we are not showing random matches
      if (!showRandom && interests.length === 0) {
        randomMatchmakingTimeoutRef.current = setTimeout(() => {
          console.log("STARTING WILDCARD MATCH");
          es.close();
          eventSourceRef.current = null;
          startMatchmaking([], true);
        }, 10_000);
      }

      es.onmessage = (event) => {
        const data: MatchmakingData = JSON.parse(event.data);
        console.log("Matchmaking update:", data);

        if (data.state === "MATCHED" && data.chatId) {
          // remove timeout
          if (randomMatchmakingTimeoutRef.current) {
            clearTimeout(randomMatchmakingTimeoutRef.current);
          }

          es.close();
          setChatId(data.chatId);
          setStatus("connecting");

          setMode("light");
          setTheme(defaultTheme);

          let interest: string[] = [];

          if (!data.interest || data.interest === "") {
            console.log("No interests provided, using default.");
          } else {
            interest = data.interest.split(",");
            console.log("Interests for this match:", interest);
          }

          let showRandomStrangerMessage = false;
          // if we specified interests, but we matched with no interests,
          // then we should show a message that we matched with a random stranger.
          if (
            (interest.length !== interests.length && interests.length > 0) ||
            showRandom
          ) {
            showRandomStrangerMessage = true;
          }

          connectToChat(
            data.chatServerUrl,
            data.chatId,
            interest,
            false,
            showRandomStrangerMessage
          );
        } else if (data.state === "WAITING") {
          setStatus("waiting_for_match");
        }
      };

      es.onerror = (err) => {
        console.error("EventSource failed:", err);
        setStatus("error");
        es.close();
      };
    },
    [userId, connectToChat]
  );

  const simulateDisconnect = useCallback(() => {
    if (wsRef.current) {
      console.log("--- SIMULATING DISCONNECT ---");
      // This will trigger the onclose event handler, which in turn
      // will fire the reconnection logic since isDisconnectingRef is false.
      wsRef.current.close();
    } else {
      console.warn(
        "--- SIMULATE DISCONNECT: No active WebSocket connection. ---"
      );
    }
  }, []);

  useEffect(() => {
    // @ts-ignore
    window.simulateDisconnect = simulateDisconnect;
    console.log(
      "Disconnection test function available in console: `window.simulateDisconnect()`"
    );

    return () => {
      // @ts-ignore
      delete window.simulateDisconnect;
    };
  }, [simulateDisconnect]);

  return {
    screen,
    status,
    messages,
    userId,
    typingUsers,
    participants,
    handleGetStarted: () => setScreen("matchmaking"),
    connectToExistingSession,
    startMatchmaking,
    onCancelMatchmaking,
    onDeleteMessage,
    sendMessage,
    disconnect,
    onReact,
    onChangeTheme,
    onChangeNickname,
    editMessage,
    onStartTyping,
  };
};
