import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

// Define types for authentication state
type AuthUser = {
  _id: string;
  discord_id: string;
  username: string;
  role: string;
  permissions: string[];
  avatar?: string;
  avatar_url?: string;
  discord_username?: string;
  fingerprint: string;
};

type LoginCredentials = {
  username: string;
  password: string;
};

type AuthContextType = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<{success: boolean; message: string}>;
  logout: () => void;
  loginAttempts: number;
  loginBlocked: boolean;
  loginBlockedUntil: Date | null;
  lastActiveTime: Date;
  updateLastActive: () => void;
};

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => ({ success: false, message: 'Context not initialized' }),
  logout: () => {},
  loginAttempts: 0,
  loginBlocked: false,
  loginBlockedUntil: null,
  lastActiveTime: new Date(),
  updateLastActive: () => {},
});

// Add login service to the API
const authService = {
  login: async (credentials: LoginCredentials) => {
    try {
      const response = await fetch('/api/staff/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // CSRF token would be added here in production
        },
        body: JSON.stringify(credentials),
      });
      
      return await response.json();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  verifyToken: async (token: string) => {
    try {
      const response = await fetch('/api/staff/verify-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
      
      return await response.json();
    } catch (error) {
      console.error('Token verification error:', error);
      throw error;
    }
  }
};

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [loginBlocked, setLoginBlocked] = useState(false);
  const [loginBlockedUntil, setLoginBlockedUntil] = useState<Date | null>(null);
  const [lastActiveTime, setLastActiveTime] = useState(new Date());
  const [lastVerification, setLastVerification] = useState<number>(0);
  
  // Check for existing session on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if session token exists
        const token = localStorage.getItem('auth_token');
        const userData = localStorage.getItem('user_data');
        
        if (token && userData) {
          // Set user from localStorage first to avoid loading state
          try {
            setUser(JSON.parse(userData));
            
            // Only verify token once on initial load
            const now = Date.now();
            // Only verify if we haven't verified in the last 5 minutes
            if (now - lastVerification > 5 * 60 * 1000) {
              const result = await authService.verifyToken(token);
              
              if (result.success) {
                setUser(result.user);
                setLastVerification(now);
              } else {
                // Token is invalid, log out
                logout();
              }
            }
          } catch (error) {
            console.error('Token verification failed:', error);
            logout();
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
    
    // Set up inactivity timer (log out after 30 minutes of inactivity)
    const inactivityInterval = setInterval(() => {
      const now = new Date();
      const timeSinceLastActive = now.getTime() - lastActiveTime.getTime();
      const maxInactivityTime = 30 * 60 * 1000; // 30 minutes
      
      if (timeSinceLastActive > maxInactivityTime && user) {
        console.log('Session expired due to inactivity');
        logout();
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(inactivityInterval);
  }, [lastVerification]); // Only depend on lastVerification, not user or lastActiveTime
  
  // Update last active time
  const updateLastActive = () => {
    setLastActiveTime(new Date());
  };
  
  // Login function with rate limiting
  const login = async (credentials: LoginCredentials) => {
    // Check if login is blocked
    if (loginBlocked) {
      const now = new Date();
      if (loginBlockedUntil && now < loginBlockedUntil) {
        const timeLeft = Math.ceil((loginBlockedUntil.getTime() - now.getTime()) / 1000 / 60);
        return {
          success: false,
          message: `الرجاء المحاولة مرة أخرى بعد ${timeLeft} دقيقة`
        };
      } else {
        // Reset login attempts if block time passed
        setLoginBlocked(false);
        setLoginAttempts(0);
      }
    }
    
    try {
      // Call login API
      const response = await authService.login(credentials);
      
      if (response.success) {
        // Store auth token and user data
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('user_data', JSON.stringify(response.user));
        
        // Update state
        setUser(response.user);
        setLoginAttempts(0);
        setLastVerification(Date.now());
        updateLastActive();
        
        return {
          success: true,
          message: 'تم تسجيل الدخول بنجاح'
        };
      } else {
        // Handle server-side rate limiting
        if (response.attempts) {
          setLoginAttempts(response.attempts);
          
          if (response.attempts >= 5) {
            setLoginBlocked(true);
            const blockUntil = new Date();
            blockUntil.setMinutes(blockUntil.getMinutes() + 15); // Block for 15 minutes
            setLoginBlockedUntil(blockUntil);
          }
        } else {
          // Increment login attempts on failure (client-side)
          const newAttempts = loginAttempts + 1;
          setLoginAttempts(newAttempts);
          
          // Block login after 5 unsuccessful attempts
          if (newAttempts >= 5) {
            const blockUntil = new Date();
            blockUntil.setMinutes(blockUntil.getMinutes() + 15); // Block for 15 minutes
            
            setLoginBlocked(true);
            setLoginBlockedUntil(blockUntil);
          }
        }
        
        return {
          success: false,
          message: response.message || 'معلومات تسجيل الدخول غير صحيحة'
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'حدث خطأ أثناء تسجيل الدخول. الرجاء المحاولة مرة أخرى'
      };
    }
  };
  
  // Logout function
  const logout = () => {
    // Clear session data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    setUser(null);
  };
  
  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      loginAttempts,
      loginBlocked,
      loginBlockedUntil,
      lastActiveTime,
      updateLastActive,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useAuth = () => useContext(AuthContext);

export default AuthContext; 