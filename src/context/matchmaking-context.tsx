import {
  createContext,
  useRef,
  useContext,
  ReactNode,
  useCallback,
} from "react";
import { useChatConnection } from "./chat-connection-context";
import { useChatTheme } from "./chat-theme-context";
import { defaultTheme } from "../lib/default-chat-themes";
import { API_MATCHMAKING_BASE_URL } from "../lib/servers";
import { AuthUser } from "./auth-context";
import { MatchmakingData } from "../lib/types";
import { useSession } from "./session-context";

interface MatchmakingContextState {
  startMatchmaking: (interests: string[], showRandom?: boolean) => void;
  onCancelMatchmaking: () => void;
}

const MatchmakingContext = createContext<MatchmakingContextState | undefined>(
  undefined
);

export const MatchmakingProvider = ({
  children,
  user,
}: {
  children: ReactNode;
  user: AuthUser | null;
}) => {
  const eventSourceRef = useRef<EventSource | null>(null);
  const randomMatchmakingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { setScreen, setStatus, setChatId } = useSession();
  const { connectToChat, resetState } = useChatConnection();
  const { setTheme, setMode } = useChatTheme();
  const userId = user?.id ?? "";

  const startMatchmaking = useCallback(
    (interests: string[], showRandom = false) => {
      resetState();
      if (randomMatchmakingTimeoutRef.current) {
        clearTimeout(randomMatchmakingTimeoutRef.current);
      }
      if (!userId) {
        console.error("User ID not set. Cannot start matchmaking.");
        setStatus("error");
        return;
      }

      setScreen("chat");
      setStatus("finding_match");

      let url = `${API_MATCHMAKING_BASE_URL}/matchmaking?userId=${userId}`;
      if (interests.length > 0)
        url += `&interests=${encodeURIComponent(interests.join(","))}`;

      const es = new EventSource(url);
      eventSourceRef.current = es;

      if (!showRandom && interests.length > 0) {
        randomMatchmakingTimeoutRef.current = setTimeout(() => {
          es.close();
          eventSourceRef.current = null;
          startMatchmaking([], true);
        }, 10000);
      }

      es.onmessage = (event) => {
        const data: MatchmakingData = JSON.parse(event.data);
        if (data.state === "MATCHED" && data.chatId) {
          if (randomMatchmakingTimeoutRef.current)
            clearTimeout(randomMatchmakingTimeoutRef.current);
          es.close();
          setChatId(data.chatId);
          setStatus("connecting");
          setTheme(defaultTheme);
          setMode("light");
          connectToChat(
            data.chatServerUrl,
            data.chatId,
            data.interest ? [data.interest] : [],
            false,
            showRandom
          );
        }
      };

      es.onerror = (err) => {
        console.error("EventSource failed:", err);
        setStatus("error");
        es.close();
      };
    },
    [userId, setStatus, setScreen, setChatId, connectToChat, setTheme, setMode]
  );

  const onCancelMatchmaking = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setStatus("ready");
    setScreen("matchmaking");
  }, [setStatus, setScreen]);

  return (
    <MatchmakingContext.Provider
      value={{ startMatchmaking, onCancelMatchmaking }}
    >
      {children}
    </MatchmakingContext.Provider>
  );
};

export const useMatchmaking = () => {
  const context = useContext(MatchmakingContext);
  if (context === undefined) {
    throw new Error("useMatchmaking must be used within a MatchmakingProvider");
  }
  return context;
};
