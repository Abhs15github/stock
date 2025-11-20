'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType } from '../types';
import { storageUtils } from '../utils/storage';
import { apiClient } from '../utils/api';

const HARDCODED_USERS: Array<{
  id: string;
  username: string;
  displayName: string;
  password: string;
}> = [
  {
    id: 'user-hemant',
    username: 'hemant',
    displayName: 'Hemant',
    password: 'Hemant@122',
  },
  {
    id: 'user-akshay',
    username: 'akshay',
    displayName: 'Akshay',
    password: 'Akshay@99',
  },
  {
    id: 'user-abhs',
    username: 'abhs',
    displayName: 'Abhs',
    password: 'Abhs@123',
  },
];

const SESSION_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const SESSION_REFRESH_INTERVAL = 5 * 60 * 1000; // Refresh session every 5 minutes on activity

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user on mount and handle session restoration
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = storageUtils.getCurrentUser();
        if (!storedUser) {
          apiClient.setUserId(null);
          setUser(null);
          setIsLoading(false);
          return;
        }

        const matchedUser = HARDCODED_USERS.find(
          (hardUser) => hardUser.id === storedUser.id
        );

        if (!matchedUser) {
          apiClient.setUserId(null);
          storageUtils.setCurrentUser(null);
          setUser(null);
          setIsLoading(false);
          return;
        }

        // Check if session is expired
        if (storageUtils.isSessionExpired()) {
          apiClient.setUserId(null);
          storageUtils.setCurrentUser(null);
          setUser(null);
          setIsLoading(false);
          return;
        }

        const hydratedUser: User = {
          id: matchedUser.id,
          email: `${matchedUser.username}@secure.local`,
          password: matchedUser.password,
          name: matchedUser.displayName,
          createdAt: storedUser.createdAt ?? new Date().toISOString(),
        };

        // Ensure API client has the active user ID for subsequent requests
        apiClient.setUserId(hydratedUser.id);

        // Refresh session expiry on successful load
        storageUtils.setSessionExpiry(Date.now() + SESSION_DURATION_MS);

        setUser(hydratedUser);
      } catch (error) {
        console.error('Error loading current user:', error);
        // Don't clear user on storage errors - might be temporary mobile issue
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Refresh session on user activity and check expiry
  useEffect(() => {
    if (!user) return;

    let lastActivityTime = Date.now();
    let refreshTimer: NodeJS.Timeout | null = null;

    // Function to refresh session expiry
    const refreshSession = () => {
      try {
        if (user) {
          // Check expiry first - if expired, don't refresh
          const isExpired = storageUtils.isSessionExpired();
          if (!isExpired) {
            storageUtils.setSessionExpiry(Date.now() + SESSION_DURATION_MS);
            lastActivityTime = Date.now();
          }
        }
      } catch (error) {
        // Don't log errors for temporary storage issues - might be mobile browser quirk
        if (error instanceof DOMException && error.name !== 'QuotaExceededError') {
          console.warn('Error refreshing session (non-critical):', error.name);
        }
      }
    };

    // Refresh session periodically if user is active
    const setupRefreshTimer = () => {
      if (refreshTimer) clearInterval(refreshTimer);
      
      refreshTimer = setInterval(() => {
        const timeSinceActivity = Date.now() - lastActivityTime;
        
        // Only refresh if user was active in the last 10 minutes
        if (timeSinceActivity < 10 * 60 * 1000) {
          refreshSession();
        }
      }, SESSION_REFRESH_INTERVAL);
    };

    // Track user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    const handleActivity = () => {
      lastActivityTime = Date.now();
      refreshSession();
    };

    // Add activity listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Handle visibility change (when user returns to tab/app)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Check if session is still valid when user returns
        try {
          if (storageUtils.isSessionExpired()) {
            setUser(null);
            storageUtils.setCurrentUser(null);
            apiClient.setUserId(null);
          } else {
            // Refresh session when user returns
            refreshSession();
          }
        } catch (error) {
          console.error('Error checking session on visibility change:', error);
        }
      }
    };

    // Handle page focus (mobile browsers)
    const handleFocus = () => {
      try {
        if (storageUtils.isSessionExpired()) {
          setUser(null);
          storageUtils.setCurrentUser(null);
          apiClient.setUserId(null);
        } else {
          refreshSession();
        }
      } catch (error) {
        console.error('Error checking session on focus:', error);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    // Initial refresh
    refreshSession();
    setupRefreshTimer();

    // Check session expiry periodically
    const expiryCheckInterval = setInterval(() => {
      try {
        if (user && storageUtils.isSessionExpired()) {
          setUser(null);
          storageUtils.setCurrentUser(null);
          apiClient.setUserId(null);
        }
      } catch (error) {
        console.error('Error checking session expiry:', error);
      }
    }, 60000); // Check every minute

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      if (refreshTimer) clearInterval(refreshTimer);
      clearInterval(expiryCheckInterval);
    };
  }, [user]);

  const register = async (_email: string, _password: string, _name: string): Promise<{ success: boolean; message: string }> => {
    return {
      success: false,
      message: 'Registration is disabled. Please contact the administrator.',
    };
  };

  const login = async (usernameInput: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      if (!usernameInput.trim()) {
        return { success: false, message: 'Username is required' };
      }

      if (!password) {
        return { success: false, message: 'Password is required' };
      }

      // Use API for authentication
      const response = await apiClient.login(usernameInput, password);

      if (response.success && response.user) {
        const authenticatedUser: User = {
          id: response.user.id,
          email: response.user.email,
          password: password,
          name: response.user.displayName,
          createdAt: response.user.createdAt || new Date().toISOString(),
        };

        setUser(authenticatedUser);
        storageUtils.setCurrentUser(authenticatedUser);
        storageUtils.setSessionExpiry(Date.now() + SESSION_DURATION_MS);

        return { success: true, message: 'Login successful' };
      }

      return { success: false, message: response.message || 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed. Please try again.' };
    }
  };

  const logout = (): void => {
    try {
      setUser(null);
      storageUtils.setCurrentUser(null);
      apiClient.logout();

      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};