import { useSession } from '../context/session-context';
import { useChatConnection } from '../context/chat-connection-context';
import { useMatchmaking } from '../context/matchmaking-context';
import { useChatTheme } from '../context/chat-theme-context';

export const useAnimoChat = () => {
    return {
        session: useSession(),
        chat: useChatConnection(),
        matchmaking: useMatchmaking(),
        theme: useChatTheme(),
    };
};
