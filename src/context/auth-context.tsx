import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

// --- 1. DEFINE TYPES ---
// Based on the Supabase session structure and our microservice responses

interface AuthUser {
  id: string;
  email?: string;
  role: 'authenticated' | 'anonymous' | 'admin'; // Add other roles as needed
  is_anonymous: boolean;
  // Add any other user properties you expect from the /validate endpoint
}

interface AuthSession {
  access_token: string;
  refresh_token: string;
  // Add other session properties if needed
}

interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  error: null,
  login: async () => {},
  logout: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

const AUTH_API_BASE_URL = 'https://animochat-auth-server.onrender.com/api/auth';
const SESSION_STORAGE_KEY = 'supabase.auth.session';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Validates a token against the /validate endpoint, sets user state, and stores the session.
   */
  const validateAndSetUser = useCallback(async (currentSession: AuthSession) => {
    try {
      const response = await fetch(`${AUTH_API_BASE_URL}/validate`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentSession.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        throw new Error(data.message || 'Token validation failed.');
      }
      
      // On successful validation, set state and persist session
      setUser(data.user);
      setSession(currentSession);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(currentSession));
      setError(null);

    } catch (err: any) {
      // If validation fails, clear everything
      setError(err.message);
      setUser(null);
      setSession(null);
      localStorage.removeItem(SESSION_STORAGE_KEY);
      // We will fall back to anonymous login in the initial load effect
      throw err; // Re-throw to be caught by the initialization logic
    }
  }, []);

  /**
   * Handles anonymous login.
   */
  const loginAnonymously = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch(`${AUTH_API_BASE_URL}/login/anonymous`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Anonymous login failed.');
      await validateAndSetUser(data.session);
    } catch (err: any) {
      setError(err.message);
      setUser(null);
      setSession(null);
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [validateAndSetUser]);
  
  /**
   * On component mount, check for a stored session. If none, log in anonymously.
   */
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      const storedSessionJSON = localStorage.getItem(SESSION_STORAGE_KEY);
      
      if (storedSessionJSON) {
        try {
          const storedSession = JSON.parse(storedSessionJSON);
          await validateAndSetUser(storedSession);
        } catch (error) {
          // If the stored token is invalid/expired, log in anonymously
          await loginAnonymously();
        }
      } else {
        // No session stored, so get a new anonymous one
        await loginAnonymously();
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, [validateAndSetUser, loginAnonymously]);


  /**
   * Handles login for registered users (including admins).
   */
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${AUTH_API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed.');
      await validateAndSetUser(data.session);
    } catch (err: any) {
      setError(err.message);
      setUser(null);
      setSession(null);
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logs the user out and creates a new anonymous session.
   */
  const logout = () => {
    setIsLoading(true);
    setUser(null);
    setSession(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    loginAnonymously().finally(() => setIsLoading(false));
  };

  const value = { user, session, isLoading, error, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
