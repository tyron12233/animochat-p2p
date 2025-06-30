import { ChatRoom } from "@/src/app/chat-rooms/page";
import Chat from "../chat";
import { useAnimochatV2 } from "@/src/hooks/useAnimochat";
import useUserId from "@/src/hooks/use-user-id";
import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "@/src/context/auth-context";

interface GrouupChatProps {
  room: ChatRoom;
  onLeave: () => void;
}

export default function GroupChat({ room, onLeave }: GrouupChatProps) {
  const { user, session } = useAuth();

  const {
    connectToExistingSession,
    messages,
    disconnect,
    onDeleteMessage,
    typingUsers,
    sendMessage,
    participants,
    onChangeNickname,
    onReact,
    status,
    onStartTyping,
    onChangeTheme,
    editMessage,
  } = useAnimochatV2(session!, user!, true);

  useEffect(() => {
    connectToExistingSession({
      chatId: room.id,
      chatServerUrl: room.serverUrl,
    });
  }, [room]);

  return (
    <>
      <Chat
        participants={participants}
        name={room.name}
        groupChat={true}
        messages={messages}
        onEditNickname={onChangeNickname}
        sendMessage={sendMessage}
        onReact={onReact}
        goBack={() => {
          onLeave();
          disconnect(true);
        }}
        onDeleteMessage={onDeleteMessage}
        endChat={() => {}}
        onStartTyping={onStartTyping}
        userId={user!.id}
        cancelMatchmaking={() => {
          onLeave();
          disconnect(true);
        }}
        onEditMessage={editMessage}
        onChangeTheme={onChangeTheme}
        newChat={() => {
          // NO-OP
        }}
        typingUsers={typingUsers}
        status={status}
      />
    </>
  );
}
