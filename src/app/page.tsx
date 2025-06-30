"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChatThemeProvider } from "../context/theme-context";
import { AuthProvider, useAuth } from "../context/auth-context";
import Home from "../components/home";
import MaintenancePage from "../components/maintenance";
import useChatSession from "../hooks/use-chat-session";
import { useMaintenanceStatus } from "../hooks/use-maintenance-status";

export default function App() {
  const { isMaintenanceMode, isLoading, error } = useMaintenanceStatus();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-lg">Checking service status...</p>
      </div>
    );
  }

  if (isMaintenanceMode) {
    // The error state is captured in the hook and defaults to showing the maintenance page.
    return <MaintenancePage />;
  }

  return (
    <>
      <ChatThemeProvider>
        <AuthProvider>
          <AuthComponent>
            <ChatSession />
          </AuthComponent>
        </AuthProvider>
      </ChatThemeProvider>
    </>
  );
}

function ChatSession() {
  const { user } = useAuth();
  const { chatSessionData, chatSessionStatus } = useChatSession(user!.id);

  return (
    <Home
        chatSessionData={chatSessionData}
        chatSessionStatus={chatSessionStatus}
      />
  );
}

function AuthComponent({ children }: { children: React.ReactNode }) {
  const { error, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-lg">Loading user data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <ErrorIcon />
          <h1 className="text-2xl font-bold text-red-600">Error</h1>
          <p className="text-gray-500 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function ErrorIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-12 w-12 text-red-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
