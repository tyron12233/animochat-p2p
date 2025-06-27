// App.tsx

"use client";

import Home from "../components/home";
import MaintenancePage from "../components/maintenance";
import { ChatThemeProvider } from "../context/theme-context";
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
          <Home />
      </ChatThemeProvider>
    </>
  );
}
