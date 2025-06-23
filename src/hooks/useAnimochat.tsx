import { useState, useEffect, useRef, useCallback } from "react";
import { DataConnection, Peer } from "peerjs";
import type { Screen, MatchmakingData, Message, Reaction } from "../lib/types";
import { v4 as uuidv4 } from "uuid";

const API_BASE_URL = "https://animochat-turn-server.onrender.com";

// This is the data structure we expect to be sent over the PeerJS connection
type PeerConnectionPacket = {
  type: "message" | "reaction";
  payload: any;
};

/**
 * Custom hook to manage all state and logic for the AnimoChat application,
 * including PeerJS setup, matchmaking, and chat state.
 */
export const useAnimoChat = () => {
  const [screen, setScreen] = useState<Screen>("intro");
  const [peerId, setPeerId] = useState<string>("");
  const [conn, setConn] = useState<DataConnection | null>(null);
  const [status, setStatus] = useState<string>("Initializing...");
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isPeerOutdated, setIsPeerOutdated] = useState<boolean>(false); // New state for backward compatibility

  const peerRef = useRef<Peer | null>(null);
  const matchmakingSource = useRef<EventSource | null>(null);

  const resetState = useCallback((statusMessage = "Ready to connect") => {
    if (conn) conn.close();
    if (matchmakingSource.current) matchmakingSource.current.close();
    setConn(null);
    setMessages([]);
    setScreen("matchmaking");
    setStatus(statusMessage);
    setIsConnecting(false);
  }, [conn]);

  const handleReaction = useCallback((messageId: string, emoji: string | null, userId: string) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) => {
          if (msg.id !== messageId || msg.type === 'system') return msg;

          const reactions = msg.reactions || [];
          const existingReactionIndex = reactions.findIndex((r) => r.user_id === userId);
          let newReactions: Reaction[];

          if (existingReactionIndex > -1) {
            if (emoji) {
              newReactions = [...reactions];
              newReactions[existingReactionIndex] = { user_id: userId, emoji };
            } else {
              newReactions = reactions.filter((_, index) => index !== existingReactionIndex);
            }
          } else if (emoji) {
            newReactions = [...reactions, { user_id: userId, emoji }];
          } else {
            newReactions = reactions;
          }
          
          return { ...msg, reactions: newReactions };
        })
      );
  }, []);


  const onReact = async (messageId: string, emoji?: string | null) => {
    if (isPeerOutdated) {
      console.log("Reactions are disabled for outdated clients.");
      return; // Do not send reactions to old clients
    }
    handleReaction(messageId, emoji || null, peerId);
    
    if (conn && conn.open) {
      const packet: PeerConnectionPacket = {
        type: "reaction",
        payload: { messageId, emoji: emoji || null, userId: peerId },
      };
      conn.send(packet);
    }
  };

  const sendMessage = (text: string) => {
    if (conn && conn.open && text) {
      const message: Message = {
        id: uuidv4(),
        content: text,
        sender: peerId,
        session_id: "1",
        created_at: new Date().toISOString(),
        reactions: [],
        type: 'user'
      };

      if (isPeerOutdated) {
        // Old protocol: send the raw string content.
        conn.send(message.content);
      } else {
        // New protocol: send the structured packet.
        const packet: PeerConnectionPacket = { type: "message", payload: message };
        conn.send(packet);
      }
      
      setMessages((prev) => [...prev, message]);
    }
  };

  const endChat = () => {
    const systemMessage: Message = {
      id: uuidv4(),
      content: "You have ended the chat.",
      type: "system",
      sender: "system",
      created_at: new Date().toISOString(),
      session_id: "1",
    };
    setMessages((prev) => [...prev, systemMessage]);
    resetState("Chat ended. Find a new match.");
  };
  
  useEffect(() => {
    if (conn) {
      setIsPeerOutdated(false); // Reset flag on new connection
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

      conn.on("data", (data: any) => {
        // OLD PROTOCOL DETECTION: Old clients send raw strings.
        if (typeof data === 'string') {
            setIsPeerOutdated(true);
            
            // Add the outdated user's message to our chat.
            const incomingMessage: Message = {
                id: uuidv4(),
                content: data,
                sender: conn.peer,
                type: 'user',
                reactions: [],
                session_id: "1",
                created_at: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, incomingMessage]);

            // Add a persistent warning for our user.
            const warningId = 'outdated-client-warning';
            setMessages(prev => prev.find(m => m.id === warningId) ? prev : [...prev, {
                id: warningId,
                content: "Your chat partner is using an outdated version. Reactions and other features are disabled.",
                type: 'system',
                sender: 'system',
                created_at: new Date().toISOString(),
                session_id: "1",
            }]);
            
            // Send a raw string message back to the old client telling them to update.
            conn.send("Your chat partner is using a new version of AnimoChat. Please refresh the page to get the latest features!");
            return;
        }

        // NEW PROTOCOL HANDLING
        let packet: PeerConnectionPacket;
        try {
            packet = typeof data === 'object' && data !== null ? data : JSON.parse(data);
        } catch (error) {
            console.error("Failed to parse incoming data:", data);
            return;
        }
        
        if (packet.type === "message") {
            const message: Message = packet.payload;
            setMessages((prev) => [...prev, message]);
        } else if (packet.type === "reaction") {
            const { messageId, emoji, userId } = packet.payload;
            handleReaction(messageId, emoji, userId);
        }
      });

      conn.on("close", () => {
        const systemMessage: Message = {
          id: uuidv4(),
          content: "Stranger has disconnected.",
          type: "system",
          sender: "system",
          created_at: new Date().toISOString(),
          session_id: "1",
        };
        setMessages((prev) => [...prev, systemMessage]);
        resetState("Stranger disconnected. Find a new match.");
      });
    }
  }, [conn, resetState, handleReaction]);

  const initializePeer = useCallback(() => {
    if (typeof window !== "undefined" && !peerRef.current) {
      import('peerjs').then(({ default: Peer }) => {
        const newPeer = new Peer({
          config: {
            
          }
        });
        peerRef.current = newPeer;
        newPeer.on("open", (id) => { setPeerId(id); setStatus("Ready to connect"); setIsConnecting(false); });
        newPeer.on("connection", (newConn) => { setConn(newConn); setScreen("chat"); setIsConnecting(false); });
        newPeer.on("error", (err) => { console.error("PeerJS error:", err); resetState(`Error: ${err.type}`); });
      }).catch(err => console.error("Failed to load PeerJS", err));
    }
  }, [resetState]);

  const handleGetStarted = () => {
    setIsConnecting(true);
    setScreen("matchmaking");
    if (!peerRef.current) {
      initializePeer();
    }
  };

  const startMatchmaking = useCallback((interests: string[]) => {
    if (!peerId || interests.length === 0 || !peerRef.current) return;
    setStatus("Finding a match...");
    setIsConnecting(true);
    const interestsParam = interests.join(",");
    const url = `${API_BASE_URL}/matchmaking?userId=${peerId}&interest=${interestsParam}`;
    const eventSource = new EventSource(url);
    matchmakingSource.current = eventSource;
    eventSource.onopen = () => setStatus("Waiting for a match...");
    eventSource.onmessage = (event) => {
      try {
        const data: MatchmakingData = JSON.parse(event.data);
        if (data.state === "MATCHED" && peerRef.current) {
          setStatus("Match found! Connecting...");
          const newConn = peerRef.current.connect(data.matchedUserId, { metadata: { interest: data.interest } });
          setConn(newConn);
          setScreen("chat");
          setIsConnecting(false);
          eventSource.close();
        }
      } catch (e) { console.error("Failed to parse matchmaking data:", e); }
    };
    eventSource.onerror = () => { console.error("Matchmaking EventSource error."); resetState("Connection error. Please try again."); };
  }, [peerId, resetState]);

  useEffect(() => {
    return () => {
      if (peerRef.current) peerRef.current.destroy();
      if (matchmakingSource.current) matchmakingSource.current.close();
    };
  }, []);

  return {
    screen,
    peerId,
    status,
    isConnecting,
    conn,
    messages,
    isPeerOutdated, // Export the flag for the UI
    handleGetStarted,
    startMatchmaking,
    endChat,
    sendMessage,
    onReact,
  };
};
