import { useState, useEffect } from "react";

/**
 * A custom hook that fetches the maintenance status from the server.
 * It handles loading, error, and maintenance mode states.
 * @returns {object} An object containing `isMaintenanceMode`, `isLoading`, and `error`.
 */
export const useMaintenanceStatus = () => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkMaintenanceStatus = async () => {
      try {
        // Assuming the API is on the same domain.
        // Replace '/maintenance' with the full URL if it's hosted elsewhere.
        const response = await fetch('http://animochat-matchmaking-server-prod.ap-southeast-1.elasticbeanstalk.com/maintenance');
        
        // The endpoint returns 503 for maintenance mode
        if (response.status === 503) {
           setIsMaintenanceMode(true);
        } else if (response.ok) {
           const data = await response.json();
           if (data.state === 'MAINTENANCE') {
                setIsMaintenanceMode(true);
           } else {
                setIsMaintenanceMode(false);
           }
        } else {
            // Handle other non-successful HTTP statuses
            throw new Error(`Failed to fetch status: ${response.statusText}`);
        }
      } catch (err) {
        console.error("Failed to check maintenance status:", err);
        const errorMessage = (err instanceof Error) ? err.message : "An unknown error occurred.";
        setError(`Could not connect to the service. Please try again later. (${errorMessage})`);
        // On error, default to showing maintenance page for safety.
        setIsMaintenanceMode(true); 
      } finally {
        setIsLoading(false);
      }
    };

    checkMaintenanceStatus();
  }, []); // Empty dependency array ensures this runs only once on mount.

  return { isMaintenanceMode, isLoading, error };
}
