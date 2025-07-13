import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  ReactNode,
  useRef,
} from "react";
import Cookies from "js-cookie";

// SECTION: Type Definitions
// Describes the structure of the authenticated user object.
export interface AuthUser {
  id: string;
  email?: string;
  role: "authenticated" | "anonymous" | "admin";
  is_anonymous: boolean;
}

// Describes the structure of the authentication session object.
export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix timestamp in seconds
  role?: string;
}

// Describes the shape of the authentication context.
interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}
// END SECTION

// SECTION: Auth Context
// Creates the context with a default value.
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  error: null,
  login: async () => {},
  logout: () => {},
});
// END SECTION

// SECTION: Constants and Utility Hooks
const AUTH_API_BASE_URL = "https://animochat-auth-server.onrender.com/api/auth";
const SESSION_COOKIE_KEY = "supabase.auth.session";

/**
 * A custom hook to run a function at a set interval.
 * @param callback The function to execute.
 * @param delay The interval delay in milliseconds.
 */
const useInterval = (callback: () => void, delay: number | null) => {
  const savedCallback = useRef<() => void | null>(null);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      if (savedCallback.current) {
        savedCallback.current();
      }
    }
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
};
// END SECTION

// SECTION: AuthProvider Component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Logs in a user anonymously.
   */
  const loginAnonymously = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch(`${AUTH_API_BASE_URL}/login/anonymous`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Anonymous login failed.");

      setUser(data.user);
      setSession(data.session);
      Cookies.set(SESSION_COOKIE_KEY, JSON.stringify(data.session), {
        sameSite: "none",
        secure: true,
        expires: 7, // Cookie expires in 7 days
      });
    } catch (err: any) {
      setError(err.message);
      setUser(null);
      setSession(null);
      Cookies.remove(SESSION_COOKIE_KEY);
    }
  }, []);

  /**
   * Refreshes the authentication token using the refresh token.
   * @param currentToken The current session token.
   * @returns The new, refreshed session.
   */
  const refreshToken = useCallback(
    async (currentToken: AuthSession) => {
      try {
        const response = await fetch(`${AUTH_API_BASE_URL}/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: currentToken.refresh_token }),
        });

        const data = await response.json();
        if (!response.ok)
          throw new Error(data.message || "Token refresh failed.");

        const newSession = { ...currentToken, ...data.session };
        setSession(newSession);
        Cookies.set(SESSION_COOKIE_KEY, JSON.stringify(newSession), {
          sameSite: "none",
          secure: true,
          expires: 7,
        });
        return newSession;
      } catch (err: any) {
        // If refresh fails, log out the user and log them in anonymously.
        setUser(null);
        setSession(null);
        Cookies.remove(SESSION_COOKIE_KEY);
        await loginAnonymously();
        throw err;
      }
    },
    [loginAnonymously]
  );

  /**
   * Validates the current session and sets the user state.
   * If the token is expired, it attempts to refresh it first.
   * @param currentSession The session to validate.
   */
  const validateAndSetUser = useCallback(
    async (currentSession: AuthSession) => {
      // Check if the access token is expired (or close to expiring).
      // The expires_at is in seconds, Date.now() is in milliseconds.
      if (currentSession.expires_at * 1000 < Date.now()) {
        try {
          // If expired, refresh the token.
          const refreshedSession = await refreshToken(currentSession);
          currentSession = refreshedSession; // Use the newly refreshed session.
        } catch (error) {
          // If refresh fails, the refreshToken function handles anonymous login.
          console.error("Session expired and refresh failed.", error);
          return;
        }
      }

      try {
        // Proceed to validate the (potentially new) access token.
        const response = await fetch(`${AUTH_API_BASE_URL}/validate`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentSession.access_token}`,
          },
        });

        const data = await response.json();
        if (!response.ok || !data.valid) {
          throw new Error(data.message || "Token validation failed.");
        }

        setUser(data.user);
        setSession(currentSession);
        Cookies.set(SESSION_COOKIE_KEY, JSON.stringify(currentSession), {
          sameSite: "none",
          secure: true,
          expires: 7,
        });
        setError(null);
      } catch (err: any) {
        setError(err.message);
        // Fallback to anonymous login if validation fails for any reason.
        await loginAnonymously();
      }
    },
    [refreshToken, loginAnonymously]
  );

  /**
   * Initializes the authentication state on component mount.
   * It tries to load a session from cookies and validates it.
   */
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      const storedSessionJSON = Cookies.get(SESSION_COOKIE_KEY);

      if (storedSessionJSON) {
        try {
          const storedSession = JSON.parse(storedSessionJSON);
          await validateAndSetUser(storedSession);
        } catch (error) {
          // This catches JSON parsing errors or initial validation/refresh failures.
          await loginAnonymously();
        }
      } else {
        await loginAnonymously();
      }
      setIsLoading(false);
    };

    initializeAuth();
    // The dependency array is designed to run this once on initial mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Sets up a background interval to refresh the token before it expires.
   */
  useInterval(async () => {
    if (session && !user?.is_anonymous) {
      // Refresh token if it expires in the next 60 seconds to avoid expiration.
      if (session.expires_at * 1000 < Date.now() + 60000) {
        try {
          await refreshToken(session);
        } catch (error) {
          console.error("Background token refresh failed:", error);
          // The refreshToken function already handles logout and anonymous login on failure.
        }
      }
    }
  }, 60000); // Check every 60 seconds.

  /**
   * Logs a user in with email and password.
   */
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${AUTH_API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Login failed.");
      await validateAndSetUser(data.session);
    } catch (err: any) {
      setError(err.message);
      setUser(null);
      setSession(null);
      Cookies.remove(SESSION_COOKIE_KEY);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logs the current user out and switches to an anonymous session.
   */
  const logout = () => {
    setIsLoading(true);
    setUser(null);
    setSession(null);
    Cookies.remove(SESSION_COOKIE_KEY);
    loginAnonymously().finally(() => setIsLoading(false));
  };

  const value = { user, session, isLoading, error, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
// END SECTION

// SECTION: useAuth Hook
/**
 * Custom hook to easily access the AuthContext.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
// END SECTION
