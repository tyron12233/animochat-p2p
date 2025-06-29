import { ChatRoom } from "@/src/app/chat-rooms/page";
import Chat from "../chat";
import { useAnimochatV2 } from "@/src/hooks/useAnimochat";
import useUserId from "@/src/hooks/use-user-id";
import { useEffect } from "react";

interface GrouupChatProps {
    room: ChatRoom;
    onLeave: () => void
}
export default function GroupChat({room, onLeave}: GrouupChatProps) {
    const userId = useUserId();
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
    } = useAnimochatV2(userId, true);


    useEffect(() => {
        if (!room || !userId) return;
        if (userId.length === 0) return;

        connectToExistingSession({
            chatId: room.id,
            chatServerUrl: room.serverUrl
        })
    }, [room, userId])

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
                userId={userId}
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
    )
}