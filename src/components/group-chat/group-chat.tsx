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
        isStrangerTyping,
        sendMessage,
        onReact,
        status,
        onStartTyping

    } = useAnimochatV2(userId);


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
                messages={messages}
                sendMessage={sendMessage}
                onReact={onReact}
                goBack={() => {}}
                endChat={() => {}}
                onStartTyping={onStartTyping}
                userId={userId}
                cancelMatchmaking={() => {}}
                onEditMessage={() => {}}
                onChangeTheme={() => {}}
                newChat={() => {}}
                isStrangerTyping={isStrangerTyping}
                status={status}
            />
        </>
    )
}