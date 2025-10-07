import { User, TradingSession } from '../types';

const USERS_STORAGE_KEY = 'bbt_trades_users';
const SESSIONS_STORAGE_KEY = 'bbt_trades_sessions';
const CURRENT_USER_KEY = 'bbt_trades_current_user';

export const storageUtils = {
  // User storage methods
  getUsers: (): User[] => {
    if (typeof window === 'undefined') return [];
    try {
      const users = localStorage.getItem(USERS_STORAGE_KEY);
      return users ? JSON.parse(users) : [];
    } catch (error) {
      console.error('Error getting users from storage:', error);
      return [];
    }
  },

  saveUsers: (users: User[]): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (error) {
      console.error('Error saving users to storage:', error);
    }
  },

  getCurrentUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    try {
      const user = localStorage.getItem(CURRENT_USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error getting current user from storage:', error);
      return null;
    }
  },

  setCurrentUser: (user: User | null): void => {
    if (typeof window === 'undefined') return;
    try {
      if (user) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(CURRENT_USER_KEY);
      }
    } catch (error) {
      console.error('Error setting current user in storage:', error);
    }
  },

  // Session storage methods
  getSessions: (): TradingSession[] => {
    if (typeof window === 'undefined') return [];
    try {
      const sessions = localStorage.getItem(SESSIONS_STORAGE_KEY);
      return sessions ? JSON.parse(sessions) : [];
    } catch (error) {
      console.error('Error getting sessions from storage:', error);
      return [];
    }
  },

  saveSessions: (sessions: TradingSession[]): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving sessions to storage:', error);
    }
  },

  // Utility methods
  clearAllData: (): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(USERS_STORAGE_KEY);
      localStorage.removeItem(SESSIONS_STORAGE_KEY);
      localStorage.removeItem(CURRENT_USER_KEY);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }
};