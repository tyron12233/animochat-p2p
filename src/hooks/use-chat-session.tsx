import { useEffect, useState } from "react";
import { defaultTheme } from "../lib/default-chat-themes";
import { MessagesSyncPacket } from "../lib/types";
import { API_MATCHMAKING_BASE_URL } from "../lib/servers";

export type ChatSessionStatus = "loading" | "existing_session" | "no_session";
export type ChatSessionData = {
  chatServerUrl: string;
  chatId: string;
};

export default function useChatSession(userId: string) {
  const [chatSessionStatus, setChatSessionStatus] =
    useState<ChatSessionStatus>("loading");
  const [chatSessionData, setChatSessionData] =
    useState<ChatSessionData | null>(null);

  useEffect(() => {
    if (!userId || userId.length === 0) return;

    const getExistingSession = async () => {
      const sessionApi = `${API_MATCHMAKING_BASE_URL}/session/${userId}`;
      try {
        const response = await fetch(sessionApi);
        if (!response.ok) {
          setChatSessionStatus("no_session");
          return;
        }

        const data = await response.json();
        const { chatId, serverUrl, participants } = data;
        if (!chatId || !serverUrl) {
          console.log("No existing session found.");
          setChatSessionStatus("no_session");
          return;
        }

        setChatSessionData({
          chatId: chatId,
          chatServerUrl: serverUrl,
        });

        setChatSessionStatus("existing_session")
      } catch (error) {
        console.error("Error fetching existing session:", error);
        setChatSessionStatus("no_session");
      }
    };

    setChatSessionStatus("loading");
    getExistingSession();

    return () => {
      //   console.log("Cleaning up useAnimochat hook.");
      //   eventSourceRef.current?.close();
      //   wsRef.current?.close();
    };
  }, [userId]);

  return {
    chatSessionStatus,
    chatSessionData,
  };
}
