import { createContext, useState, useContext, ReactNode, useCallback } from "react";
import type { Message, Participant, Reaction, UserMessage, Mention, SystemMessage } from "../lib/types";
import { useSession } from "./session-context";
import { AuthUser } from "./auth-context";

// Assuming these packet types are defined elsewhere, as in the original file
import { ChangeNicknamePacket, DeleteMessagePacket, EditMessagePacket, MessagePacket, ReactionPacket, TypingPacket, ChangeThemePacket } from '../lib/packets';
import { ChatThemeV2 } from "../lib/chat-theme";
import { useChatConnection } from "./chat-connection-context";

interface ChatContextState {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  participants: Participant[];
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;
  typingUsers: string[];
  setTypingUsers: React.Dispatch<React.SetStateAction<string[]>>;
  sendMessage: (content: string, replyingToId?: string, mentions?: Mention[]) => void;
  editMessage: (messageId: string, newContent: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onReact: (messageId: string, emoji?: string | null) => void;
  onChangeNickname: (nickname: string) => void;
  handleReaction: (messageId: string, emoji: string | null, reactingUserId: string, reactingUserNickname?: string) => void;
}

const ChatContext = createContext<ChatContextState | undefined>(undefined);

export const ChatProvider = ({ children, user }: { children: ReactNode, user: AuthUser | null }) => {
  const { chatId } = useSession();
  const { sendPacket, typingUsers, setTypingUsers } = useChatConnection();
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);

  const userId = user?.id ?? "";

  const handleReaction = useCallback((messageId: string, emoji: string | null, reactingUserId: string, reactingUserNickname: string = "Anonymous") => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) => {
        if (msg.id !== messageId || msg.type === "system") return msg;
        const reactions = msg.reactions || [];
        const existingReactionIndex = reactions.findIndex((r) => r.user_id === reactingUserId);
        let newReactions: Reaction[];

        if (existingReactionIndex > -1) {
          if (emoji) {
            newReactions = [...reactions];
            newReactions[existingReactionIndex] = { user_id: reactingUserId, emoji, message_id: messageId, nickname: reactingUserNickname };
          } else {
            newReactions = reactions.filter((_, index) => index !== existingReactionIndex);
          }
        } else if (emoji) {
          newReactions = [...reactions, { user_id: reactingUserId, emoji, message_id: messageId, nickname: reactingUserNickname }];
        } else {
          newReactions = reactions;
        }
        return { ...msg, reactions: newReactions };
      })
    );
  }, []);

  const onChangeNickname = useCallback((nickname: string) => {
    if (nickname.length === 0 || !userId) return;

    const packet: ChangeNicknamePacket = {
      type: "change_nickname",
      content: { newNickname: nickname, userId: userId },
      sender: userId,
    };
    sendPacket(packet);

    setParticipants((prev) => prev.map((p) => (p.userId === userId ? { ...p, nickname } : p)));

    const systemMessage: SystemMessage = {
      id: `system_${Date.now()}`,
      session_id: chatId,
      created_at: new Date().toISOString(),
      type: "system",
      content: `You changed your nickname to ${nickname}.`,
      sender: "system",
    };
    setMessages((prev) => [...prev, systemMessage]);
  }, [userId, chatId, sendPacket]);

  const onDeleteMessage = useCallback((messageId: string) => {
    if (!userId || !chatId) return;
    setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, type: "deleted" } : msg)));
    const packet: DeleteMessagePacket = { type: "message_delete", content: messageId, sender: userId };
    sendPacket(packet);
  }, [userId, chatId, sendPacket]);

  const onReact = useCallback(async (messageId: string, emoji?: string | null) => {
    if (!userId) return;
    handleReaction(messageId, emoji || null, userId);
    const nickname = participants.find((p) => p.userId === userId)?.nickname || "Anonymous";
    const packet: ReactionPacket = {
      type: "reaction",
      sender: userId,
      content: { message_id: messageId, emoji: emoji || null, user_id: userId, nickname: nickname },
    };
    sendPacket(packet);
  }, [userId, sendPacket, participants, handleReaction]);

  const editMessage = useCallback((messageId: string, newContent: string) => {
    if (!newContent || !messageId || !userId) return;
    setMessages((prev) => prev.map((msg) => msg.id === messageId ? { ...msg, content: newContent, edited: true } : msg));
    const packet: EditMessagePacket = {
      type: "edit_message",
      content: { message_id: messageId, new_content: newContent, user_id: userId },
      sender: userId,
    };
    sendPacket(packet);
  }, [userId, sendPacket]);

  const sendMessage = useCallback((content: string, replyingToId?: string, mentions?: Mention[]) => {
    if (!userId || !chatId) return;

    const stopTypingPacket: TypingPacket = { type: "typing", content: false, sender: userId };
    sendPacket(stopTypingPacket);
    
    if (typingUsers.includes(userId)) {
      setTypingUsers((prev) => prev.filter((id) => id !== userId));
    }


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
    const packet: MessagePacket = { type: "message", content: message, sender: userId };
    sendPacket(packet);
    setMessages((prev) => [...prev, message]);
  }, [userId, chatId, sendPacket, user, typingUsers]);

  return (
    <ChatContext.Provider value={{
      messages, setMessages,
      participants, setParticipants,
      typingUsers, setTypingUsers,
      sendMessage, editMessage, onDeleteMessage, onReact, onChangeNickname, handleReaction
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
