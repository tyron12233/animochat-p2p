import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import Cookies from 'js-cookie'; // Import the library

export interface AuthUser {
  id: string;
  email?: string;
  role: 'authenticated' | 'anonymous' | 'admin';
  is_anonymous: boolean;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  role?: string;
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
const SESSION_COOKIE_KEY = 'supabase.auth.session'; // Changed variable name for clarity

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

      setUser(data.user);
      setSession(currentSession);
      // Set the session in a cookie
      Cookies.set(SESSION_COOKIE_KEY, JSON.stringify(currentSession), {
        sameSite: 'strict', // For better security
        expires: 7
      });
      setError(null);

    } catch (err: any) {
      setError(err.message);
      setUser(null);
      setSession(null);
      // Remove the cookie if validation fails
      Cookies.remove(SESSION_COOKIE_KEY);
      throw err;
    }
  }, []);

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
      Cookies.remove(SESSION_COOKIE_KEY);
    }
  }, [validateAndSetUser]);
  
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      // Get the session from the cookie
      const storedSessionJSON = Cookies.get(SESSION_COOKIE_KEY);
      
      if (storedSessionJSON) {
        try {
          const storedSession = JSON.parse(storedSessionJSON);
          await validateAndSetUser(storedSession);
        } catch (error) {
          await loginAnonymously();
        }
      } else {
        await loginAnonymously();
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, [validateAndSetUser, loginAnonymously]);

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
      Cookies.remove(SESSION_COOKIE_KEY);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setIsLoading(true);
    setUser(null);
    setSession(null);
    // Remove the session cookie
    Cookies.remove(SESSION_COOKIE_KEY);
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