import { createContext, useContext, useState, useMemo } from "react";
import { ChatThemeV2 } from "../lib/chat-theme";
import { defaultTheme } from "../lib/default-chat-themes";

type ThemeMode = "light" | "dark";

interface ThemeContextType {
  theme: ChatThemeV2;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  setTheme: (theme: ChatThemeV2) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ChatThemeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [theme, setTheme] = useState<ChatThemeV2>(defaultTheme);
  const [mode, setMode] = useState<ThemeMode>("light");

  const value = useMemo(
    () => ({
      theme,
      mode,
      setMode,
      setTheme,
    }),
    [theme, mode]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useChatTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useChatTheme must be used within a ChatThemeProvider");
  }
  return context;
};
