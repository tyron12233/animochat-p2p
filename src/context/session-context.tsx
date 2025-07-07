import { createContext, useState, useContext, ReactNode } from "react";
import type { Screen, Status } from "../lib/types"; // Assuming types are in this path

interface SessionContextState {
  screen: Screen;
  setScreen: (screen: Screen) => void;
  status: Status;
  setStatus: (status: Status) => void;
  chatId: string;
  setChatId: (chatId: string) => void;
}

const SessionContext = createContext<SessionContextState | undefined>(undefined);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [screen, setScreen] = useState<Screen>("intro");
  const [status, setStatus] = useState<Status>("initializing");
  const [chatId, setChatId] = useState<string>("");

  return (
    <SessionContext.Provider value={{ screen, setScreen, status, setStatus, chatId, setChatId }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};