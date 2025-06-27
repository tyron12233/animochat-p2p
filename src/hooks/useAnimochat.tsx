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

export const useAnimochatV2 = () => {
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
    // Generate a unique identifier for this user session.
    setUserId(uuidv4());
    setStatus("ready");

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
    wsRef.current?.close();
    wsRef.current = null;
    eventSourceRef.current?.close();
    eventSourceRef.current = null;

    setStatus("disconnected");
    setChatId("");
  }, []);

  // --- Matchmaking and Connection Logic ---

  const startMatchmaking = useCallback(
    (interests: string[]) => {
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
          es.close(); // Stop listening for matchmaking events.
          setChatId(data.chatId);

          const WEBSOCKET_URL = data.chatServerUrl;

          // --- INITIATE WEBSOCKET CONNECTION ---
          const wsUrl = `${WEBSOCKET_URL}?userId=${userId}&chatId=${data.chatId}`;
          console.log(`Connecting to WebSocket server: ${wsUrl}`);
          const ws = new WebSocket(wsUrl);
          wsRef.current = ws;

          ws.onopen = () => {
            console.log("WebSocket connection established.");
            setStatus("connected");
            const welcomeMessage: SystemMessage = {
              id: `system_${Date.now()}`,
              session_id: data.chatId,
              created_at: new Date().toISOString(),
              type: "system",
              content: `You matched on ${
                data.interest || "a common interest"
              }.`,
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

            switch (packet.type) {
              case "STATUS":
                const statusMessage: SystemMessage = {
                  id: `system_${Date.now()}`,
                  session_id: data.chatId,
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
            }
          };

          ws.onclose = () => {
            console.log("WebSocket connection closed.");
            setStatus("disconnected");
            const disconnectMessage: SystemMessage = {
              id: `system_${Date.now()}`,
              session_id: data.chatId,
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

  return {
    screen,
    status,
    messages,
    userId,
    isStrangerTyping,
    handleGetStarted: () => setScreen("matchmaking"),
    startMatchmaking,
    sendMessage,
    disconnect,
    onReact,
    editMessage,
    onStartTyping,
  };
};
