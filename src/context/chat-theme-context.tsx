import { createContext, useState, useContext, ReactNode } from 'react';
import { ChatThemeV2 } from '../lib/chat-theme';
import { defaultTheme } from '../lib/default-chat-themes';

interface ChatThemeContextType {
    theme: ChatThemeV2;
    setTheme: (theme: ChatThemeV2) => void;
    mode: 'light' | 'dark';
    setMode: (mode: 'light' | 'dark') => void;
}

const ChatThemeContext = createContext<ChatThemeContextType | undefined>(undefined);

export const ChatThemeProvider = ({ children }: { children: ReactNode }) => {
    const [theme, setTheme] = useState<ChatThemeV2>(defaultTheme);
    const [mode, setMode] = useState<'light' | 'dark'>('light');

    return (
        <ChatThemeContext.Provider value={{ theme, setTheme, mode, setMode }}>
            {children}
        </ChatThemeContext.Provider>
    );
};

export const useChatTheme = () => {
    const context = useContext(ChatThemeContext);
    if (!context) {
        throw new Error('useChatTheme must be used within a ChatThemeProvider');
    }
    return context;
};

