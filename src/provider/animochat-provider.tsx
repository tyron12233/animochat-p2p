import { ReactNode } from 'react';
import { SessionProvider } from '../context/session-context';
import { ChatConnectionProvider } from '../context/chat-connection-context';
import { MatchmakingProvider } from '../context/matchmaking-context';
import { ChatThemeProvider } from '../context/chat-theme-context';
import { AuthUser } from '../context/auth-context';

interface AnimoChatProviderProps {
    children: ReactNode;
    user: AuthUser | null;
    isGroupChat?: boolean;
}

export const AnimoChatProvider = ({ children, user, isGroupChat = false }: AnimoChatProviderProps) => {
    return (
        <ChatThemeProvider>
            <SessionProvider>
                <ChatConnectionProvider user={user} isGroupChat={isGroupChat}>
                    <MatchmakingProvider user={user}>
                        {children}
                    </MatchmakingProvider>
                </ChatConnectionProvider>
            </SessionProvider>
        </ChatThemeProvider>
    );
};

