// import { createContext, useRef, useContext, ReactNode, useCallback } from "react";
// import { useSession } from "./session-context";
// import { useChat } from "./chat-context";
// import { useChatTheme } from "./theme-context"; // Will be created
// import { AuthUser } from "./auth-context";

// // Assuming packet types are defined elsewhere
// import { ParticipantJoinedPacket, ChangeThemePacket, ReactionPacket } from "../lib/packets";
// import { Reaction } from "../lib/types";

// interface WebSocketContextState {
//   wsRef: React.MutableRefObject<WebSocket | null>;
//   isTypingRef: React.MutableRefObject<boolean>;
//   sendPacket: (packet: any) => void;
//   connectToChat: (chatServerUrl: string, chatIdToConnect: string, interests?: string[], isReconnecting?: boolean, showRandomStrangerMessage?: boolean) => void;
//   disconnect: (isGroupChat?: boolean) => void;
//   onStartTyping: () => void;
// }

// const WebSocketContext = createContext<WebSocketContextState | undefined>(undefined);

// export const WebSocketProvider = ({ children, user, isGroupChat = false }: { children: ReactNode, user: AuthUser | null, isGroupChat?: boolean }) => {
//   const wsRef = useRef<WebSocket | null>(null);
//   const isTypingRef = useRef<boolean>(false);
//   const timeoutRef = useRef<NodeJS.Timeout | null>(null);
//   const isDisconnectingRef = useRef<boolean>(false);
//   const reconnectionTimerRef = useRef<NodeJS.Timeout | null>(null);
//   const reconnectionAttemptsRef = useRef<number>(0);

//   const { setStatus, setChatId } = useSession();
//   const { setMessages, setParticipants, setTypingUsers, handleReaction } = useChat();
//   const { setTheme, setMode } = useChatTheme();
//   const userId = user?.id ?? "";

//   const sendPacket = useCallback((packet: any) => {
//     if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
//       wsRef.current.send(JSON.stringify(packet));
//     } else {
//       console.error("Cannot send packet, WebSocket is not open.");
//     }
//   }, []);

//   const onStartTyping = useCallback(() => {
//     if (isTypingRef.current) {
//         if (timeoutRef.current) clearTimeout(timeoutRef.current);
//         timeoutRef.current = setTimeout(() => {
//             isTypingRef.current = false;
//             sendPacket({ type: "typing", content: false, sender: userId });
//         }, 3000);
//         return;
//     }
//     isTypingRef.current = true;
//     sendPacket({ type: "typing", content: true, sender: userId });
//     timeoutRef.current = setTimeout(() => {
//         isTypingRef.current = false;
//         if(timeoutRef.current) clearTimeout(timeoutRef.current);
//         sendPacket({ type: "typing", content: false, sender: userId });
//     }, 3000);
//   }, [userId, sendPacket]);


//   const connectToChat = useCallback((chatServerUrl: string, chatIdToConnect: string, interests: string[] = [], isReconnecting = false, showRandomStrangerMessage = false) => {
//       if (wsRef.current || !userId) return;

//       let url = chatServerUrl.endsWith("/") ? chatServerUrl.slice(0, -1) : chatServerUrl;
//       isDisconnectingRef.current = false;
//       if (reconnectionTimerRef.current) clearTimeout(reconnectionTimerRef.current);

//       const setupWebsocketListeners = (ws: WebSocket) => {
//         ws.onopen = () => {
//           console.log("WebSocket connection established.");
//           setStatus("connected");
//           reconnectionAttemptsRef.current = 0;
//         };

//         ws.onmessage = async (e: MessageEvent) => {
//           const packet = JSON.parse(await (e.data instanceof Blob ? e.data.text() : e.data));
//           if (packet.sender === userId) return;

//           switch (packet.type) {
//              case "message_delete":
//               setMessages((prev) => prev.map((msg) => msg.id === packet.content ? { ...msg, type: "deleted" } : msg));
//               break;
//             case "change_nickname":
//               // Logic for nickname change...
//               break;
//             case "change_theme":
//               const { mode, theme } = (packet as ChangeThemePacket).content;
//               setMode(mode);
//               setTheme(theme);
//               // System message for theme change...
//               break;
//             case "offline":
//               setParticipants((prev) => prev.map((p) => p.userId === packet.content ? { ...p, status: "offline" } : p));
//               break;
//             case "disconnect":
//               // Logic for disconnect...
//               setStatus("disconnected");
//               setChatId("");
//               ws.close();
//               break;
//             case "participant_joined":
//                // Logic for participant joined...
//               break;
//             case "message":
//               setMessages((prev) => [...prev, packet.content]);
//               break;
//             case "reaction":
//               const { message_id, emoji, user_id, nickname } = packet.content as Reaction;
//               handleReaction(message_id, emoji, user_id, nickname);
//               break;
//             case "typing":
//               setTypingUsers((prev) => packet.content ? [...prev, packet.sender] : prev.filter((id) => id !== packet.sender));
//               break;
//             case "edit_message":
//               const { message_id: editId, new_content, user_id: editorId } = packet.content;
//               setMessages((prev) => prev.map((msg) => msg.id === editId && msg.sender === editorId ? { ...msg, content: new_content, edited: true } : msg));
//               break;
//             default:
//               console.warn("Unknown packet type:", packet.type);
//           }
//         };

//         ws.onclose = () => {
//           if (!isDisconnectingRef.current) {
//               setStatus("reconnecting");
//           }
//         };
//         ws.onerror = (err) => {
//           console.error("WebSocket error:", err);
//           setStatus("error");
//         };
//       };
      
//       try {
//         const wsUrl = `${url}?userId=${userId}&chatId=${chatIdToConnect}`;
//         const ws = new WebSocket(wsUrl);
//         wsRef.current = ws;
//         setupWebsocketListeners(ws);
//       } catch (error) {
//         console.error("Failed to establish connection:", error);
//         // ... error handling and retry logic
//       }
//   }, [userId, setStatus, setMessages, setParticipants, setTypingUsers, handleReaction, setTheme, setMode, setChatId, isGroupChat]);

//   const disconnect = useCallback(() => {
//     isDisconnectingRef.current = true;
//     if (reconnectionTimerRef.current) clearTimeout(reconnectionTimerRef.current);
    
//     // API call to disconnect... (simplified)

//     if (wsRef.current) {
//         if(!isGroupChat) sendPacket({ type: "disconnect", content: null, sender: userId });
//         wsRef.current.close();
//         wsRef.current = null;
//     }
    
//     setStatus("disconnected");
//     setChatId("");
//   }, [userId, sendPacket, setStatus, setChatId, isGroupChat]);

//   return (
//     <WebSocketContext.Provider value={{ wsRef, isTypingRef, sendPacket, connectToChat, disconnect, onStartTyping }}>
//       {children}
//     </WebSocketContext.Provider>
//   );
// };

// export const useWebSocket = () => {
//   const context = useContext(WebSocketContext);
//   if (context === undefined) {
//     throw new Error("useWebSocket must be used within a WebSocketProvider");
//   }
//   return context;
// };
