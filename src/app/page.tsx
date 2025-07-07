"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChatThemeProvider } from "../context/theme-context";
import { AuthProvider, useAuth } from "../context/auth-context";
import Home from "../components/home";
import MaintenancePage from "../components/maintenance";
import useChatSession from "../hooks/use-chat-session";
import { useMaintenanceStatus } from "../hooks/use-maintenance-status";
import AuthenticatedPage from "./authenticated-page";

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
    return <MaintenancePage />;
  }

  return (
    <>
         <AuthProvider>
           <AuthenticatedPage />
        </AuthProvider>
    </>
  );
}

