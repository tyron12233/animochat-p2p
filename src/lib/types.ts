import type { DataConnection as PeerJSDataConnection } from 'peerjs';

// Re-exporting the type for easier use across the app
export type DataConnection = PeerJSDataConnection;

export type Screen = 'intro' | 'matchmaking' | 'chat';



export type Status = 'initializing' | 'ready' | 'connecting' | 'reconnecting' | 'connected' | 'disconnected' | 'error' | 'finding_match' | 'waiting_for_match';

export interface ChatMessage {
    text: string;
    sender: 'You' | 'Stranger' | 'System';
}

export interface PopularInterest {
    interest: string;
    count: number;
}

export interface User {
    id: string;
}

export interface Participant {
  status: string;
  userId: string;
  nickname: string;
}


export type MatchmakingData = {
  state: "MATCHED" | "WAITING";
  matchedUserId: string;
  interest: string;
  chatId: string;
  chatServerUrl: string;
};
export interface Reaction {
  message_id: string;
  user_id: string;
  emoji: string | null;
  nickname?: string;
}

interface BaseMessage {
  id: string;
  session_id: string;
  created_at: string; // ISO string
  edited?: boolean;
}

export interface SystemMessage extends BaseMessage {
  type: "system";
  content: string;
  sender: "system";
}

export interface UserMessage extends BaseMessage {
  type?: undefined | "deleted"; // or 'user'
  content: string;
  sender: string; // peerId
  replyingTo?: string;
  reactions?: Reaction[];
  mentions?: Mention[];
  role?: string;
}

export interface VoiceMessage extends BaseMessage {
  type: "voice_message";
  content: string;
  voice_content: Blob | null;
  sender: string;
  replyingTo?: string;
  reactions?: Reaction[];
  role?: string;
}

export type Message = UserMessage | SystemMessage | VoiceMessage;


export interface Mention {
  id: string;
  startIndex: number;
  endIndex: number;
}

export type PeerConnectionPacket<Content, T extends String> = {
  type: T;
  content: Content;
  sender: string;
};

export type MessagesSyncPacket = PeerConnectionPacket<Message[], "messages_sync">;
export type MessagePacket = PeerConnectionPacket<UserMessage, "message">;
export type ReactionPacket = PeerConnectionPacket<Reaction, "reaction">;
export type HandshakePacket = PeerConnectionPacket<string, "handshake">;
export type HandshakeResponsePacket = PeerConnectionPacket<
  string,
  "handshake_response"
>;
export type TypingPacket = PeerConnectionPacket<boolean, "typing">;
export type EditMessagePacket = PeerConnectionPacket<
  {
    message_id: string;
    new_content: string;
    user_id: string;
  },
  "edit_message"
>;

export type AnyPacket =
  | MessagePacket
  | ReactionPacket
  | HandshakePacket
  | HandshakeResponsePacket
  | TypingPacket
  | EditMessagePacket;

  

export interface ChatTheme {
  /** A unique identifier for the theme */
  id: string;
  /** The display name of the theme */
  name: string;

  /**
   * The main accent color used throughout the chat interface.
   * This color will be used for the header background and send button background
   * unless overridden by their respective properties.
   * Example: "#4F46E5"
   */
  accentColor: string;

  /**
   * The background gradient for the current user’s chat bubble.
   * Example: "linear-gradient(90deg, #34D399, #10B981)"
   */
  userBubbleGradient: string;
  /**
   * The text color for the current user’s chat bubble.
   * Example: "#ffffff"
   */
  userTextColor: string;

  /**
   * Whether the current user’s chat bubble should be animated.
   * Example: true
   */
  userAnimated: boolean;

  /**
   * The background gradient for other users’ chat bubbles.
   * Example: "linear-gradient(90deg, #F3F4F6, #E5E7EB)"
   */
  otherBubbleGradient: string;
  /**
   * The text color for other users’ chat bubbles.
   * Example: "#1F2937"
   */
  otherTextColor: string;

  /**
   * Whether the other user’s chat bubble should be animated.
   * Example: true
   */
  otherAnimated: boolean;

  /**
   * The background gradient for the chat area.
   * (Typically applied on a higher-level container.)
   * Example: "linear-gradient(180deg, #ffffff, #f0f0f0)"
   */
  chatBackground: string;
}



export const DEFAULT_THEME: ChatTheme = {
  id: "default",
  name: "Default Chat Theme",

  // bg-green-600
  accentColor: "#16a34a",
  userBubbleGradient: "linear-gradient(90deg, #16a34a, #16a34a)",
  userTextColor: "#ffffff",
  otherBubbleGradient: "linear-gradient(90deg, #f3f4f6, #f3f4f6)",
  otherTextColor: "#1F2937",
  otherAnimated: false,
  userAnimated: false,
  chatBackground: "linear-gradient(180deg, #ffffff, #ffffff)",
};