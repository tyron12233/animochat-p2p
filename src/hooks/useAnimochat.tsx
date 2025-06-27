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
type ChangeThemePacket = Packet<{
  mode: "light" | "dark";
  theme: ChatThemeV2
}, "change_theme">;

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

    const getExistingSession = async () => {
      const sessionApi = `${API_BASE_URL}/session/${storedUserId}`;
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

        const wsUrl = `${serverUrl}?userId=${storedUserId}&chatId=${data.chatId}`;
        console.log(`Connecting to WebSocket server: ${wsUrl}`);
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        setTheme(defaultTheme);
        setMode("light");

        setupWebsocketListeners(ws, data.chatId, [], true);
        setScreen("chat");
        setStatus("connecting");
        console.log(`Reconnected to chat: ${data.chatId}`);
      } catch (error) {
        console.error("Error fetching existing session:", error);
        setStatus("error");
      }
    };

    getExistingSession();

    // Cleanup function to close any open connections when the component unmounts.
    return () => {
      console.log("Cleaning up useAnimochat hook.");
      eventSourceRef.current?.close();
      wsRef.current?.close();
    };
  }, []);

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
  const sendPacket = useCallback((packet: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(packet));
    } else {
      console.error("Cannot send packet, WebSocket connection is not open.");
    }
  }, []);

  // --- User Actions ---

  const onCancelMatchmaking = () => {
    console.log("Cancelling matchmaking...");
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setStatus("ready");
    setScreen("matchmaking");
    setChatId("");
  }

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
    }
  const onStartTyping = useCallback(() => {
    if (isTypingRef.current) return; // Prevent sending too many events
    isTypingRef.current = true;

    const startTypingPacket: TypingPacket = {
      type: "typing",
      content: true,
      sender: userId,
    };
    sendPacket(startTypingPacket);

    // Set a timeout to automatically send a "stop typing" event.
    setTimeout(() => {
      isTypingRef.current = false;
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
    })

    if (wsRef.current) {
      const disconnectPacket: DisconnectPacket = {
        type: "disconnect",
        content: null,
        sender: userId,
      };
      wsRef.current.send(JSON.stringify(disconnectPacket));
    }

   
 wsRef.current?.close();    wsRef.current = null;
    eventSourceRef.current?.close();
    eventSourceRef.current = null;

    setStatus("disconnected");
    setChatId("");
  }, [userId]);

  // --- Matchmaking and Connection Logic ---

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
      const interestsParam = interests.join(",");
      const url = `${API_BASE_URL}/matchmaking?userId=${userId}&interest=${interestsParam}`;

      console.log(`Connecting to matchmaking server: ${url}`);
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        const data: MatchmakingData = JSON.parse(event.data);
        console.log("Matchmaking update:", data);

        if (data.state === "MATCHED" && data.chatId) {
          console.log(
            `Match found with user ${data.matchedUserId}! ChatID: ${data.chatId}`
          );
          setStatus("connecting");
          es.close();
          setChatId(data.chatId);

          const WEBSOCKET_URL = data.chatServerUrl;

          // --- INITIATE WEBSOCKET CONNECTION ---
          const wsUrl = `${WEBSOCKET_URL}?userId=${userId}&chatId=${data.chatId}`;
          console.log(`Connecting to WebSocket server: ${wsUrl}`);
          const ws = new WebSocket(wsUrl);
          wsRef.current = ws;

          const interests = data.interest?.split(",") || [];

          setupWebsocketListeners(ws, data.chatId, interests, false);
        } else if (data.state === "WAITING") {
          console.log("Waiting for a match...");
          setStatus("waiting_for_match");
        }
      };

      es.onerror = (err) => {
        console.error("EventSource failed:", err);
        setStatus("error");
        es.close();
      };
    },
    [userId]
  );

  const setupWebsocketListeners = useCallback((
    ws: WebSocket,
    chatId: string,
    interests: string[] = [],
    reconnecting = false
  ) => {
    ws.onopen = () => {
      console.log("WebSocket connection established.");
      setStatus("connected");

      let message = `You matched with a stranger on ${interests.join(
        ", "
      )}! Say hi!`;
      if (reconnecting) {
        message = `Reconnected to chat with a stranger. Previous messages may not be visible yet.`;
      }

      const welcomeMessage: SystemMessage = {
        id: `system_${Date.now()}`,
        session_id: chatId,
        created_at: new Date().toISOString(),
        type: "system",
        content: message,
        sender: "system",
      };
      setMessages([welcomeMessage]);
    };

    ws.onmessage = async (e: MessageEvent<any>) => {
      const rawPacket = e.data;

      let jsonPacket: any;
      if (rawPacket instanceof Blob) {
        const text = await rawPacket.text();
        jsonPacket = JSON.parse(text);
      } else if (typeof rawPacket === "string") {
        jsonPacket = JSON.parse(rawPacket);
      } else {
        jsonPacket = rawPacket;
      }

      const packet = jsonPacket;

      console.log("Received packet:", jsonPacket);

      // Ignore messages sent by ourselves. The server relays everything.
      if (packet.sender === userId) return;
      console.log("Packet sender: ", packet.sender);
      console.log("Current user ID: ", userId);

      switch (packet.type) {
        case "change_theme":
          console.log("Received change theme packet from server.");
          const { mode, theme } = packet.content;
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
          break;
        case "offline":
          console.log("Received offline packet from server.");

          const isPartnerOffline = packet.content !== userId;
          const message = isPartnerOffline
            ? `Your partner has went offline.`
            : "You are currently offline.";

          const offlineMessage: SystemMessage = {
            id: `system_${Date.now()}`,
            session_id: chatId,
            created_at: new Date().toISOString(),
            type: "system",
            content: message,
            sender: "system",
          };
          setMessages((prev) => [...prev, offlineMessage]);
          break;
        case "disconnect":
          console.log("Received disconnect packet from server.");
          setStatus("disconnected");
          const disconnectMessage: SystemMessage = {
            id: `system_${Date.now()}`,
            session_id: chatId,
            created_at: new Date().toISOString(),
            type: "system",
            content: "The other user has disconnected.",
            sender: "system",
          };
          setMessages((prev) => [...prev, disconnectMessage]);

          ws.close();
          wsRef.current = null;
          eventSourceRef.current?.close();
          eventSourceRef.current = null;
          setChatId("");

          

          break;
        case "STATUS":
          const statusMessage: SystemMessage = {
            id: `system_${Date.now()}`,
            session_id: chatId,
            created_at: new Date().toISOString(),
            type: "system",
            content: packet.message,
            sender: "system",
          };
          setMessages((prev) => [...prev, statusMessage]);
          break;
        case "message":
          setMessages((prev) => [...prev, packet.content]);
          break;
        case "reaction":
          const { message_id, emoji, user_id } = packet.content;
          handleReaction(message_id, emoji, user_id);
          break;
        case "typing":
          if (packet.sender === userId) return;
          setStrangerTyping(packet.content as boolean);
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
          console.warn("Unknown packet type received:", packet.type);
          const unknownMessage: SystemMessage = {
            id: `system_${Date.now()}`,
            session_id: chatId,
            created_at: new Date().toISOString(),
            type: "system",
            content: `Unknown packet type received: ${packet.type} there is probably a new version of the site available. Please refresh the page.`,
            sender: "system",
          };
          setMessages((prev) => [...prev, unknownMessage]);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed.");
      setStatus("disconnected");
      const disconnectMessage: SystemMessage = {
        id: `system_${Date.now()}`,
        session_id: chatId,
        created_at: new Date().toISOString(),
        type: "system",
        content: "The connection has been closed.",
        sender: "system",
      };
      setMessages((prev) => [...prev, disconnectMessage]);
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      setStatus("error");
    };
  }, [userId, chatId, handleReaction]);

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
