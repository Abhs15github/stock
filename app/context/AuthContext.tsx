'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType } from '../types';
import { storageUtils } from '../utils/storage';

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

  useEffect(() => {
    try {
      const storedUser = storageUtils.getCurrentUser();
      if (!storedUser) {
        setUser(null);
        return;
      }

      const matchedUser = HARDCODED_USERS.find(
        (hardUser) => hardUser.id === storedUser.id
      );

      if (!matchedUser || storageUtils.isSessionExpired()) {
        storageUtils.setCurrentUser(null);
        setUser(null);
        return;
      }

      const hydratedUser: User = {
        id: matchedUser.id,
        email: `${matchedUser.username}@secure.local`,
        password: matchedUser.password,
        name: matchedUser.displayName,
        createdAt: storedUser.createdAt ?? new Date().toISOString(),
      };

      setUser(hydratedUser);
    } catch (error) {
      console.error('Error loading current user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === COMMENTED OUT FOR LOCAL DEVELOPMENT ===
  // Check session expiry every minute
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     if (user && storageUtils.isSessionExpired()) {
  //       setUser(null);
  //       storageUtils.setCurrentUser(null);
  //     }
  //   }, 60000); // Check every minute

  //   return () => clearInterval(interval);
  // }, [user]);

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

      const normalizedUsername = usernameInput.trim().toLowerCase();

      const matchedUser = HARDCODED_USERS.find(
        (hardUser) => hardUser.username.toLowerCase() === normalizedUsername
      );

      if (!matchedUser) {
        return { success: false, message: 'Invalid username or password' };
      }

      if (matchedUser.password !== password) {
        return { success: false, message: 'Invalid username or password' };
      }

      const authenticatedUser: User = {
        id: matchedUser.id,
        email: `${matchedUser.username}@secure.local`,
        password: matchedUser.password,
        name: matchedUser.displayName,
        createdAt: new Date().toISOString(),
      };

      setUser(authenticatedUser);
      storageUtils.setCurrentUser(authenticatedUser);

      // Set session expiry (30 minutes from now)
      storageUtils.setSessionExpiry(Date.now() + SESSION_DURATION_MS);

      return { success: true, message: 'Login successful' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed. Please try again.' };
    }
  };

  const logout = (): void => {
    try {
      setUser(null);
      storageUtils.setCurrentUser(null);
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