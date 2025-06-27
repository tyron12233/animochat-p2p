"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  Dispatch,
} from "react";
import { DataConnection, Peer } from "peerjs";
import type {
  Screen,
  MatchmakingData,
  ChatMessage,
  Message,
  Reaction,
  Status,
} from "../lib/types";
import { v4 as uuidv4 } from "uuid";

const API_BASE_URL = "https://animochat-turn-server.onrender.com";

type PeerConnectionPacket<Content, Type extends String> = {
  type: Type;
  content: Content;
  sender: string;
};

type MessagePacket = PeerConnectionPacket<Message, "message">;
type ReactionPacket = PeerConnectionPacket<Reaction, "reaction">;
type HandshakePacket = PeerConnectionPacket<string, "handshake">;
type HandshakeResponsePacket = PeerConnectionPacket<
  string,
  "handshake_response"
>;
type TypingPacket = PeerConnectionPacket<boolean, "typing">;

/**
 * Custom hook to manage all state and logic for the AnimoChat application,
 * including PeerJS setup, matchmaking, and chat state.
 */
export const useAnimoChat = () => {
  const [screen, setScreen] = useState<Screen>("intro");
  const [peerId, setPeerId] = useState<string>("");
  const [conn, setConn] = useState<DataConnection | null>(null);
  const [status, setStatus] = useState<Status>("initializing");
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const peerRef = useRef<Peer | null>(null);
  const matchmakingSource = useRef<EventSource | null>(null);

  const [isStrangerTyping, setStrangerTyping] = useState(false);

  const resetState = useCallback(
    (statusMessage: Status = "ready") => {
      if (conn) conn.close();
      if (matchmakingSource.current) matchmakingSource.current.close();
      setConn(null);
      setMessages([]);
      setScreen("matchmaking");
      setStatus(statusMessage);
      setIsConnecting(false);
    },
    [conn]
  );

  const initializePeer = useCallback(() => {
    if (typeof window !== "undefined" && !peerRef.current) {
      const newPeer = new Peer({
        config: {
          iceTransportPolicy: "relay",
          iceServers: [
            {
              urls: "turn:relay1.expressturn.com:3480",
              username: "000000002066065602",
              credential: "AlQhdlmP9HdGw+NC1+Zs9vtvHQU=",
            },

            { url: "stun:stun.l.google.com:19302" },
          ],
        },
      });
      peerRef.current = newPeer;

      newPeer.on("open", (id) => {
        setPeerId(id);
        setStatus("ready");
        setIsConnecting(false);
      });

      newPeer.on("connection", (newConn) => {
        console.log("New connection");
        setConn(newConn);
        setScreen("chat");
        setIsConnecting(false);
        setStatus("connecting");
      });

      newPeer.on("error", (err) => {
        console.error("PeerJS error:", err);
        resetState("error");
      });
    }
  }, [resetState]);

  const handleGetStarted = () => {
    setScreen("matchmaking");
    if (!peerRef.current) {
      setIsConnecting(true);
      initializePeer();
    }
  };

  const handleReaction = useCallback(
    (messageId: string, emoji: string | null, userId: string) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) => {
          if (msg.id !== messageId || msg.type === "system") return msg;

          const reactions = msg.reactions || [];
          const existingReactionIndex = reactions.findIndex(
            (r) => r.user_id === userId
          );
          let newReactions: Reaction[];

          if (existingReactionIndex > -1) {
            // User has reacted before.
            if (emoji) {
              // Replace existing reaction.
              newReactions = [...reactions];
              newReactions[existingReactionIndex] = {
                user_id: userId,
                emoji,
                message_id: messageId,
              };
            } else {
              // Emoji is null, so remove the reaction.
              newReactions = reactions.filter(
                (_, index) => index !== existingReactionIndex
              );
            }
          } else if (emoji) {
            // User has not reacted before, and there's an emoji to add.
            newReactions = [
              ...reactions,
              { user_id: userId, emoji, message_id: messageId },
            ];
          } else {
            // No existing reaction and no new emoji, so do nothing.
            newReactions = reactions;
          }

          return { ...msg, reactions: newReactions };
        })
      );
    },
    []
  );

  const startMatchmaking = useCallback(
    (interests: string[]) => {
      if (!peerId || interests.length === 0 || !peerRef.current) return;

      setMessages([]);

      setStatus("finding_match");
      setIsConnecting(true);

      const interestsParam = interests.join(",");
      const url = `${API_BASE_URL}/matchmaking?userId=${peerId}&interest=${interestsParam}`;

      const eventSource = new EventSource(url);
      matchmakingSource.current = eventSource;

      eventSource.onopen = () => setStatus("waiting_for_match");

      eventSource.onmessage = (event) => {
        try {
          const data: MatchmakingData = JSON.parse(event.data);
          if (data.state === "MATCHED" && peerRef.current) {
            setStatus("connecting");
            const newConn = peerRef.current.connect(data.matchedUserId, {
              metadata: { interest: data.interest },
            });

            setConn(newConn);
            setScreen("chat");
            setIsConnecting(false);
            eventSource.close();
          }
        } catch (e) {
          console.error("Failed to parse matchmaking data:", e);
        }
      };

      eventSource.onerror = () => {
        console.error("Matchmaking EventSource error.");
        resetState("error");
      };
    },
    [peerId, resetState]
  );

  const onReact = async (messageId: string, emoji?: string | null) => {
    // Optimistically update the UI for the local user.
    handleReaction(messageId, emoji || null, peerId);

    // Send the reaction to the other peer.
    if (conn && conn.open) {
      const packet: ReactionPacket = {
        type: "reaction",
        sender: peerId,
        content: {
          message_id: messageId,
          emoji: emoji || null,
          user_id: peerId,
        },
      };
      conn.send(packet);
    }
  };

  const isTypingRef = useRef<boolean>(false);

  // the current user typing
  const onStartTyping = () => {
    // add debounce
    if (isTypingRef.current) return; // Prevent multiple calls
    isTypingRef.current = true;

    if (conn && conn.open) {
      const packet: TypingPacket = {
        type: "typing",
        content: true,
        sender: peerId,
      };
      conn.send(packet);
    }

    setTimeout(() => {
      isTypingRef.current = false;
      if (conn && conn.open) {
        const packet: TypingPacket = {
          type: "typing",
          content: false,
          sender: peerId,
        };
        conn.send(packet);
      }
    }, 3000);
  };

  const sendMessage = (text: string) => {
    // set typing to false
    isTypingRef.current = false;
    if (conn && conn.open) {
      const packet: TypingPacket = {
        type: "typing",
        content: false,
        sender: peerId,
      };
      conn.send(packet);
    }

    if (conn && conn.open && text) {
      const message: Message = {
        id: uuidv4(),
        content: text,
        sender: peerId,
        session_id: "1",
        created_at: new Date().toISOString(),
      };

      const packet: MessagePacket = {
        type: "message",
        content: message,
        sender: peerId,
      };
      conn.send(packet);

      setMessages((prev) => [...prev, message]);
    }
  };

  const endChat = () => {
    setStatus("disconnected");

    setMessages((prev) => [
      ...prev,
      {
        id: uuidv4(),
        content: "You have ended the chat.",
        type: "system",
        sender: "system",
        timestamp: new Date().toISOString(),
        session_id: "1",
        created_at: new Date().toISOString(),
      },
    ]);

    if (conn) {
      conn.close();
      setConn(null);
    }
    if (matchmakingSource.current) {
      matchmakingSource.current.close();
      matchmakingSource.current = null;
    }

    setIsConnecting(false);
  };

  useEffect(() => {
    if (status == "connected" && conn && peerRef.current) {
      const matchedOn = conn.metadata?.interest || "an unknown topic";
      setMessages([
        {
          id: uuidv4(),
          content: `Connected with a stranger on: ${matchedOn}`,
          type: "system",
          sender: "system",
          created_at: new Date().toISOString(),
          session_id: "1",
        },
      ]);
    }

    if (status === "connecting") {
      // 5 seconds timout to wait for handshake response
      const timeoutId = setTimeout(() => {
        if (conn && conn.open) {
          //   add message that the other peer did not send a handshake response, probably using an old version of the app
          const systemMessage: Message = {
            id: uuidv4(),
            content:
              "The other peer did not respond to the handshake. They might be using an older version of the app.",
            type: "system",
            sender: "system",
            created_at: new Date().toISOString(),
            session_id: "1",
          };
          setMessages((prev) => [...prev, systemMessage]);
          setStatus("disconnected");
          conn.close();
          setConn(null);
          setIsConnecting(false);
          console.warn("Handshake response timeout. Closing connection.");
        }
      }, 7000);

      return () => clearTimeout(timeoutId);
    }
  }, [status]);

  // called when a new connection is received
  // this is the case when a user connects to a stranger
  useEffect(() => {
    if (conn) {
      conn.on("open", () => {
        const handshakePacket: HandshakePacket = {
          type: "handshake",
          content: "hi",
          sender: peerId,
        };
        conn.send(handshakePacket);
        console.log("Sent handshake packet:", handshakePacket);
      });

      conn.on("data", (data: any) => {
        let packet: PeerConnectionPacket<any, any>;
        try {
          packet = typeof data === "string" ? JSON.parse(data) : data;
        } catch (error) {
          console.error("Failed to parse incoming data:", data);
          return;
        }

        console.log("Received packet:", packet);

        if (packet.type === "handshake") {
          const handshakePacket: HandshakePacket = packet;
          if (handshakePacket.content === "hi") {
            const responsePacket: HandshakeResponsePacket = {
              type: "handshake_response",
              content: "hello",
              sender: peerId,
            };
            conn.send(responsePacket);
          }

          setStatus("connected");
          return;
        }

        if (packet.type === "handshake_response") {
          const handshakeResponsePacket: HandshakeResponsePacket = packet;
          if (handshakeResponsePacket.content === "hello") {
            setStatus("connected");
            return;
          }
        }

        if (packet.type === "typing") {
          setStrangerTyping(packet.content as boolean);
          return;
        }

        if (packet.type === "message") {
          const message: Message = packet.content;
          // CRITICAL: Use functional update here to avoid stale state.
          setMessages((prev) => [...prev, message]);
        } else if (packet.type === "reaction") {
          const { messageId, emoji, userId } = packet.content;
          // Use the stable handler function to process the incoming reaction.
          handleReaction(messageId, emoji, userId);
        }
      });

      conn.on("close", () => {
        if (!peerRef.current) return;

        const systemMessage: Message = {
          id: uuidv4(),
          content: "Connection closed by the other peer.",
          type: "system",
          sender: "system",
          created_at: new Date().toISOString(),
          session_id: "1",
        };
        setMessages((prev) => [...prev, systemMessage]);
        setStatus("disconnected");
        setIsConnecting(false);
      });
    }
  }, [conn, resetState, handleReaction]);

  return {
    screen,
    peerId,
    status,
    isConnecting,
    isStrangerTyping,
    conn,
    messages,
    handleGetStarted,
    startMatchmaking,
    endChat,
    sendMessage,
    onReact,
    onStartTyping,
  };
};
