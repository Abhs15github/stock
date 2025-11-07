'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType } from '../types';
import { validateEmail, validatePassword } from '../utils/validation';
import { storageUtils } from '../utils/storage';

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
      // === COMMENTED OUT FOR LOCAL DEVELOPMENT ===
      // Auto-login with mock user for development
      const mockUser: User = {
        id: 'dev-user-001',
        email: 'dev@test.com',
        password: 'password',
        name: 'Dev User',
        createdAt: new Date().toISOString(),
      };

      setUser(mockUser);
      storageUtils.setCurrentUser(mockUser);
      // Set long expiry for dev (24 hours)
      storageUtils.setSessionExpiry(Date.now() + (24 * 60 * 60 * 1000));

      // === ORIGINAL CODE (COMMENTED OUT) ===
      // // Check if session is expired
      // if (storageUtils.isSessionExpired()) {
      //   storageUtils.setCurrentUser(null);
      //   setUser(null);
      // } else {
      //   const currentUser = storageUtils.getCurrentUser();
      //   setUser(currentUser);
      // }
    } catch (error) {
      console.error('Error loading current user:', error);
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

  const register = async (email: string, password: string, name: string): Promise<{ success: boolean; message: string }> => {
    try {
      // Validate email
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        return { success: false, message: emailValidation.message };
      }

      // Validate password
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        return { success: false, message: passwordValidation.message };
      }

      // Validate name
      if (!name.trim()) {
        return { success: false, message: 'Name is required' };
      }

      // Check if user already exists
      const users = storageUtils.getUsers();
      const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (existingUser) {
        return { success: false, message: 'User with this email already exists' };
      }

      // Create new user
      const newUser: User = {
        id: Date.now().toString(),
        email: email.toLowerCase(),
        password, // In production, this would be hashed
        name: name.trim(),
        createdAt: new Date().toISOString(),
      };

      // Save user
      users.push(newUser);
      storageUtils.saveUsers(users);

      // Set as current user (auto-login after registration)
      const userToStore = { ...newUser };
      setUser(userToStore);
      storageUtils.setCurrentUser(userToStore);

      // Set session expiry (30 minutes from now)
      const expiryTime = Date.now() + (30 * 60 * 1000);
      storageUtils.setSessionExpiry(expiryTime);

      return { success: true, message: 'Registration successful' };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Registration failed. Please try again.' };
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      // Validate email format
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        return { success: false, message: emailValidation.message };
      }

      if (!password) {
        return { success: false, message: 'Password is required' };
      }

      // Find user
      const users = storageUtils.getUsers();
      const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!foundUser) {
        return { success: false, message: 'Invalid email or password' };
      }

      // Check password
      if (foundUser.password !== password) {
        return { success: false, message: 'Invalid email or password' };
      }

      // Set current user
      setUser(foundUser);
      storageUtils.setCurrentUser(foundUser);

      // Set session expiry (30 minutes from now)
      const expiryTime = Date.now() + (30 * 60 * 1000);
      storageUtils.setSessionExpiry(expiryTime);

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