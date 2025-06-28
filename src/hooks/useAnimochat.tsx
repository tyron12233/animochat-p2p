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
  MessagesSyncPacket,
} from "../lib/types";
import { v4 as uuidv4 } from "uuid";
import { useChatTheme } from "../context/theme-context";
import { ChatThemeV2 } from "../lib/chat-theme";
import { defaultTheme } from "../lib/default-chat-themes";

// --- Configuration ---
// The base URL for your matchmaking server.
const API_BASE_URL = "https://animochat-turn-server.onrender.com";

// --- Packet Types for WebSocket Communication ---
// These define the structure of messages sent over the WebSocket connection.
type Packet<T, K extends string> = {
  type: K;
  content: T;
  sender: string;
};

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

export const useAnimochatV2 = () => {
  const { setTheme, setMode } = useChatTheme();

  // --- State Management ---
  const [screen, setScreen] = useState<Screen>("intro");
  const [status, setStatus] = useState<Status>("initializing");
  const [messages, setMessages] = useState<Message[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [chatId, setChatId] = useState<string>("");
  const [isStrangerTyping, setStrangerTyping] = useState<boolean>(false);

  // --- Refs for managing connections and state ---
  const wsRef = useRef<WebSocket | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const isTypingRef = useRef<boolean>(false);

  // --- Initial setup: Generate a unique ID for the user ---
  useEffect(() => {
    const storedUserId = localStorage.getItem("animochat_user_id");
    if (!storedUserId) {
      const newUserId = uuidv4();
      localStorage.setItem("animochat_user_id", newUserId);
      setUserId(newUserId);
    } else {
      setUserId(storedUserId);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    const syncMessages = async (chatServer: string, chatId: string) => {
      ///sync/:chatId
      const syncApi = `${chatServer}/sync/${chatId}`;
      try {
        const response = await fetch(syncApi);
        if (!response.ok) {
          throw new Error(`Failed to sync messages: ${response.statusText}`);
        }

        // will return a message sync packet
        const packet: MessagesSyncPacket = await response.json();

        return packet.content;
      } catch (error) {
        console.error("Error syncing messages:", error);
        return [];
      }
    };

    const getExistingSession = async () => {
      const sessionApi = `${API_BASE_URL}/session/${userId}`;
      try {
        const response = await fetch(sessionApi);
        if (!response.ok) {
          // If the session API returns an error, then there's probably no existing session.
          setStatus("ready");
          return;
        }

        const data = await response.json();
        const { chatId, serverUrl, participants } = data;
        if (!chatId || !serverUrl) {
          console.log("No existing session found.");
          setStatus("ready");
          return;
        }

        console.log("Found existing session:", data);
        setChatId(data.chatId);
        setTheme(defaultTheme);
        setMode("light");
        setScreen("chat");
        setStatus("connecting");

        // first get

        const messages = await syncMessages(serverUrl, chatId);
        setMessages(messages);

        await connectToChat(data.chatId, [], true);
      } catch (error) {
        console.error("Error fetching existing session:", error);
        setStatus("error");
      }
    };

    getExistingSession();

    return () => {
      console.log("Cleaning up useAnimochat hook.");
      eventSourceRef.current?.close();
      wsRef.current?.close();
    };
  }, [userId]);

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

  const onCancelMatchmaking = (interests: string[]) => {
    const cancelApi = () => {
      const url = `${API_BASE_URL}/cancel_matchmaking`;
      return fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, interests: interests }),
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
      };

      const packet: MessagePacket = {
        type: "message",
        content: message,
        sender: userId,
      };
      sendPacket(packet);

      // Add the message to the local state immediately.
      setMessages((prev) => [...prev, message]);
    },
    [userId, chatId, sendPacket]
  );

  const disconnect = useCallback(() => {
    isDisconnectingRef.current = true;
    if (reconnectionTimerRef.current) {
      clearTimeout(reconnectionTimerRef.current);
    }

    const disconnectFromApi = async () => {
      const disconnectApi = `${API_BASE_URL}/session/disconnect?userId=${userId}`;
      try {
        const response = await fetch(disconnectApi, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
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

    disconnectFromApi().then(() => {
      console.log("Disconnected from matchmaking and chat.");
    });

    const message: SystemMessage = {
      id: `system_${Date.now()}`,
      session_id: chatId,
      created_at: new Date().toISOString(),
      type: "system",
      content: "You have disconnected from the chat.",
      sender: "system",
    };
    setMessages((prev) => [...prev, message]);

    if (wsRef.current) {
      const disconnectPacket: DisconnectPacket = {
        type: "disconnect",
        content: null,
        sender: userId,
      };
      wsRef.current.send(JSON.stringify(disconnectPacket));
    }

    wsRef.current?.close();
    wsRef.current = null;
    eventSourceRef.current?.close();
    eventSourceRef.current = null;

    setStatus("disconnected");
    setChatId("");
  }, [userId]);

  // --- Matchmaking and Connection Logic ---

  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY_MS = 4000;
  const isDisconnectingRef = useRef<boolean>(false);
  const reconnectionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectionAttemptsRef = useRef<number>(0);

  const connectToChat = useCallback(
    async (
      chatIdToConnect: string,
      interests: string[] = [],
      isReconnecting = false
    ) => {
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

          let message: string;
          if (isReconnecting) {
            message = "Reconnected to the chat successfully.";
          } else {
            message = `You matched with a stranger on ${interests.join(
              ", "
            )}! Say hi!`;
          }

          const welcomeMessage: SystemMessage = {
            id: `system_${Date.now()}`,
            session_id: chatIdToConnect,
            created_at: new Date().toISOString(),
            type: "system",
            content: message,
            sender: "system",
          };
          setMessages((prev) => (isReconnecting ? prev : [welcomeMessage]));
          if (isReconnecting) {
            setMessages((prev) => [...prev, welcomeMessage]);
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
            case "change_theme":
              const { mode, theme } = jsonPacket.content;
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
              setMessages((prev) => [
                ...prev,
                {
                  id: `system_${Date.now()}`,
                  session_id: chatIdToConnect,
                  created_at: new Date().toISOString(),
                  type: "system",
                  content:
                    jsonPacket.content !== userId
                      ? `Your partner has went offline.`
                      : "You are currently offline.",
                  sender: "system",
                },
              ]);
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
              setStrangerTyping(jsonPacket.content as boolean);
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

        ws.onclose = () => {
          console.log("WebSocket connection closed.");
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
              connectToChat(chatIdToConnect, [], true);
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
        const sessionApi = `${API_BASE_URL}/session/${userId}`;
        const response = await fetch(sessionApi);
        if (!response.ok) {
          throw new Error(`Session fetch failed: ${response.statusText}`);
        }
        const data = await response.json();

        if (
          !data.chatId ||
          !data.serverUrl ||
          data.chatId !== chatIdToConnect
        ) {
          throw new Error("Invalid session data for reconnection.");
        }

        const wsUrl = `${data.serverUrl}?userId=${userId}&chatId=${data.chatId}`;
        console.log(`Connecting to WebSocket server: ${wsUrl}`);
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
              connectToChat(chatIdToConnect, [], true);
            }, RECONNECT_DELAY_MS * reconnectionAttemptsRef.current);
          }
        }
      }
    },
    [
      userId,
      handleReaction,
      setTheme,
      setMode,
      sendPacket,
      setMessages,
      setStatus,
    ]
  );

  const startMatchmaking = useCallback(
    (interests: string[]) => {
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

      es.onmessage = (event) => {
        const data: MatchmakingData = JSON.parse(event.data);
        console.log("Matchmaking update:", data);

        if (data.state === "MATCHED" && data.chatId) {
          es.close();
          setChatId(data.chatId);
          setStatus("connecting");
          connectToChat(data.chatId, data.interest?.split(",") || []);
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
    isStrangerTyping,
    handleGetStarted: () => setScreen("matchmaking"),
    startMatchmaking,
    onCancelMatchmaking,
    sendMessage,
    disconnect,
    onReact,
    onChangeTheme,
    editMessage,
    onStartTyping,
  };
};
