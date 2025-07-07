import { ChatRoom } from "@/src/app/chat-rooms/page";
import Chat from "../chat";
import { useAnimochatV2 } from "@/src/hooks/useAnimochat";
import useUserId from "@/src/hooks/use-user-id";
import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "@/src/context/auth-context";
import { useAnimoChat } from "@/src/hooks/use-animochat";

interface GrouupChatProps {
  room: ChatRoom;
  onLeave: () => void;
}

export default function GroupChat({ room, onLeave }: GrouupChatProps) {
  const { user, session } = useAuth();

  const { chat,  } = useAnimoChat();

  useEffect(() => {
    if (!user || !room) {
      return;
    }
    chat.connectToExistingSession({
      chatId: room.id,
      chatServerUrl: room.serverUrl,
    });
  }, [user, room]);

  return (
    <>
      <Chat groupChat={true} name={room.name} onBack={() => {
        chat.disconnect();
        onLeave();
      }} />
    </>
  );
}
