import { User, TradingSession, Trade, BBTCalculation } from '../types';

const USERS_STORAGE_KEY = 'bbt_trades_users';
const SESSIONS_STORAGE_KEY = 'bbt_trades_sessions';
const TRADES_STORAGE_KEY = 'bbt_trades_trades';
const BBT_CALCULATIONS_KEY = 'bbt_trades_calculations';
const CURRENT_USER_KEY = 'bbt_trades_current_user';
const SESSION_EXPIRY_KEY = 'bbt_trades_session_expiry';

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
      // Check if localStorage is available (mobile Safari private mode)
      if (!window.localStorage) {
        return null;
      }
      const user = localStorage.getItem(CURRENT_USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch (error) {
      // Handle QuotaExceededError or other storage errors gracefully
      if (error instanceof DOMException) {
        console.warn('Storage access error (may be private mode):', error.name);
      } else {
        console.error('Error getting current user from storage:', error);
      }
      return null;
    }
  },

  setCurrentUser: (user: User | null): void => {
    if (typeof window === 'undefined') return;
    try {
      // Check if localStorage is available
      if (!window.localStorage) {
        console.warn('localStorage not available (may be private mode)');
        return;
      }
      if (user) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(CURRENT_USER_KEY);
      }
    } catch (error) {
      // Handle QuotaExceededError or other storage errors gracefully
      if (error instanceof DOMException) {
        console.warn('Storage write error (may be private mode or quota exceeded):', error.name);
      } else {
        console.error('Error setting current user in storage:', error);
      }
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

  // Trade storage methods
  getTrades: (): Trade[] => {
    if (typeof window === 'undefined') return [];
    try {
      const trades = localStorage.getItem(TRADES_STORAGE_KEY);
      return trades ? JSON.parse(trades) : [];
    } catch (error) {
      console.error('Error getting trades from storage:', error);
      return [];
    }
  },

  saveTrades: (trades: Trade[]): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(TRADES_STORAGE_KEY, JSON.stringify(trades));
    } catch (error) {
      console.error('Error saving trades to storage:', error);
    }
  },

  // BBT Calculations storage methods
  getBBTCalculations: (): BBTCalculation[] => {
    if (typeof window === 'undefined') return [];
    try {
      const calculations = localStorage.getItem(BBT_CALCULATIONS_KEY);
      return calculations ? JSON.parse(calculations) : [];
    } catch (error) {
      console.error('Error getting BBT calculations from storage:', error);
      return [];
    }
  },

  saveBBTCalculations: (calculations: BBTCalculation[]): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(BBT_CALCULATIONS_KEY, JSON.stringify(calculations));
    } catch (error) {
      console.error('Error saving BBT calculations to storage:', error);
    }
  },

  // Session expiry methods
  setSessionExpiry: (expiryTime: number): void => {
    if (typeof window === 'undefined') return;
    try {
      if (!window.localStorage) {
        console.warn('localStorage not available');
        return;
      }
      localStorage.setItem(SESSION_EXPIRY_KEY, expiryTime.toString());
    } catch (error) {
      if (error instanceof DOMException) {
        console.warn('Storage write error:', error.name);
      } else {
        console.error('Error setting session expiry:', error);
      }
    }
  },

  getSessionExpiry: (): number | null => {
    if (typeof window === 'undefined') return null;
    try {
      if (!window.localStorage) {
        return null;
      }
      const expiry = localStorage.getItem(SESSION_EXPIRY_KEY);
      return expiry ? parseInt(expiry) : null;
    } catch (error) {
      if (error instanceof DOMException) {
        console.warn('Storage access error:', error.name);
      } else {
        console.error('Error getting session expiry:', error);
      }
      return null;
    }
  },

  isSessionExpired: (): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      if (!window.localStorage) {
        // If localStorage is not available, consider session expired
        return true;
      }
      const expiry = storageUtils.getSessionExpiry();
      if (!expiry) return true; // No expiry means session is invalid
      return Date.now() > expiry;
    } catch (error) {
      if (error instanceof DOMException) {
        console.warn('Storage access error:', error.name);
      } else {
        console.error('Error checking session expiry:', error);
      }
      // On error, don't expire session - might be temporary mobile issue
      return false;
    }
  },

  // Utility methods
  clearAllData: (): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(USERS_STORAGE_KEY);
      localStorage.removeItem(SESSIONS_STORAGE_KEY);
      localStorage.removeItem(TRADES_STORAGE_KEY);
      localStorage.removeItem(BBT_CALCULATIONS_KEY);
      localStorage.removeItem(CURRENT_USER_KEY);
      localStorage.removeItem(SESSION_EXPIRY_KEY);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }
};