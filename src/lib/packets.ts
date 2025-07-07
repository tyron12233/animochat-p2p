import { ChatThemeV2 } from "./chat-theme";
import { Participant, UserMessage, Reaction } from "./types";

export type Packet<T, K extends string> = {
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



export type ParticipantsSyncPacket = Packet<Participant[], "participants_sync">;
export type ParticipantJoinedPacket = Packet<Participant, "user_joined">;

export type DeleteMessagePacket = Packet<string, "message_delete">;
export type MessagePacket = Packet<UserMessage, "message">;
export type ReactionPacket = Packet<Reaction, "reaction">;
export type TypingPacket = Packet<boolean, "typing">;
export type EditMessagePacket = Packet<
  { message_id: string; new_content: string; user_id: string },
  "edit_message"
>;
export type DisconnectPacket = Packet<null, "disconnect">;
export type ChangeThemePacket = Packet<
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

