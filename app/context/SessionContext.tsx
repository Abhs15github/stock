'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { TradingSession, SessionContextType } from '../types';
import { validateSessionData } from '../utils/validation';
import { storageUtils } from '../utils/storage';
import { useAuth } from './AuthContext';

const SessionContext = createContext<SessionContextType | null>(null);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<TradingSession[]>([]);

  useEffect(() => {
    if (user) {
      try {
        const allSessions = storageUtils.getSessions();
        const userSessions = allSessions.filter(session => session.userId === user.id);
        setSessions(userSessions);
      } catch (error) {
        console.error('Error loading sessions:', error);
        setSessions([]);
      }
    } else {
      setSessions([]);
    }
  }, [user]);

  const createSession = async (sessionData: Omit<TradingSession, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; message: string; sessionId?: string }> => {
    try {
      if (!user) {
        return { success: false, message: 'User must be logged in to create sessions' };
      }

      // Validate session data
      const validation = validateSessionData(sessionData);
      if (!validation.isValid) {
        return { success: false, message: validation.message };
      }

      // Create new session
      const newSession: TradingSession = {
        ...sessionData,
        id: Date.now().toString(),
        userId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Get all sessions and add the new one
      const allSessions = storageUtils.getSessions();
      allSessions.push(newSession);
      storageUtils.saveSessions(allSessions);

      // Update local state
      setSessions(prev => [...prev, newSession]);

      // Create ALL pending trades automatically based on totalTrades
      await createAllPendingTrades(newSession);

      return { success: true, message: 'Session created successfully', sessionId: newSession.id };
    } catch (error) {
      console.error('Create session error:', error);
      return { success: false, message: 'Failed to create session. Please try again.' };
    }
  };

  const calculateRiskPercentage = (session: TradingSession): number => {
    // Lovely Profits appears to use a fixed risk model based on RR ratio
    // For 1:1 RR with 50% accuracy, they show 60.5% profit over 10 trades
    // This suggests they use ~14.7% risk with assumed 70% win rate

    const winRate = session.accuracy / 100;
    const rrRatio = session.riskRewardRatio;

    // Base risk percentage (appears to be around 12-15% in Lovely Profits)
    let riskPercent = 0.15; // Starting with 15% base

    // Adjust based on RR ratio
    // Higher RR = can afford more risk
    if (rrRatio >= 2) {
      riskPercent = 0.25; // 25% for 1:2 or better
    } else if (rrRatio >= 1.5) {
      riskPercent = 0.20; // 20% for 1:1.5 to 1:2
    } else if (rrRatio >= 1) {
      riskPercent = 0.15; // 15% for 1:1 to 1:1.5
    } else {
      riskPercent = 0.10; // 10% for less than 1:1
    }

    // Kelly Criterion for reference (but not used in Lovely Profits model)
    const kellyPercent = (winRate * rrRatio - (1 - winRate)) / rrRatio;

    // If Kelly suggests higher risk and is positive, use it with conservative multiplier
    if (kellyPercent > riskPercent) {
      riskPercent = Math.min(kellyPercent * 0.8, 0.40); // Max 40%
    }

    // Ensure risk percentage is reasonable (between 5% and 40%)
    riskPercent = Math.max(0.05, Math.min(0.40, riskPercent));

    console.log('Risk calculation:', {
      winRate: `${(winRate * 100).toFixed(1)}%`,
      rrRatio: `1:${rrRatio}`,
      kellyPercent: `${(kellyPercent * 100).toFixed(2)}%`,
      finalRiskPercent: `${(riskPercent * 100).toFixed(2)}%`,
      riskAmount: `$${(session.capital * riskPercent).toFixed(2)}`,
      note: 'Using Lovely Profits-style fixed risk model'
    });

    return riskPercent;
  };

  const createAllPendingTrades = async (session: TradingSession) => {
    try {
      const riskPercent = calculateRiskPercentage(session);
      const allTrades = storageUtils.getTrades();

      console.log('Creating pending trades for session:', session.id);
      console.log('Total trades to create:', session.totalTrades);
      console.log('Risk percentage:', riskPercent);

      // Create all pending trades at once
      const newTrades = [];
      for (let i = 0; i < session.totalTrades; i++) {
        const calculatedRisk = session.capital * riskPercent;
        const timestamp = Date.now() + i;

        const newTrade = {
          id: timestamp.toString(),
          userId: user!.id,
          sessionId: session.id,
          pairName: 'Trade Entry',
          entryPrice: 0,
          exitPrice: undefined,
          investment: calculatedRisk,
          date: new Date().toISOString(),
          type: 'buy' as const,
          status: 'pending' as const,
          profitOrLoss: 0,
          profitOrLossPercentage: 0,
          createdAt: new Date(timestamp).toISOString(),
          updatedAt: new Date(timestamp).toISOString(),
        };

        newTrades.push(newTrade);
        allTrades.push(newTrade);
      }

      console.log('Created trades:', newTrades.length);
      storageUtils.saveTrades(allTrades);
      console.log('Saved trades to storage');
    } catch (error) {
      console.error('Error creating pending trades:', error);
    }
  };

  const updateSession = async (id: string, updates: Partial<TradingSession>): Promise<{ success: boolean; message: string }> => {
    try {
      if (!user) {
        return { success: false, message: 'User must be logged in to update sessions' };
      }

      // Get all sessions
      const allSessions = storageUtils.getSessions();
      const sessionIndex = allSessions.findIndex(session => session.id === id && session.userId === user.id);

      if (sessionIndex === -1) {
        return { success: false, message: 'Session not found' };
      }

      // Update session
      const updatedSession = {
        ...allSessions[sessionIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      // Validate if updating core data
      if (updates.name || updates.capital || updates.totalTrades || updates.accuracy || updates.riskRewardRatio) {
        const validation = validateSessionData({
          name: updatedSession.name,
          capital: updatedSession.capital,
          totalTrades: updatedSession.totalTrades,
          accuracy: updatedSession.accuracy,
          riskRewardRatio: updatedSession.riskRewardRatio,
        });

        if (!validation.isValid) {
          return { success: false, message: validation.message };
        }
      }

      // Save updated sessions
      allSessions[sessionIndex] = updatedSession;
      storageUtils.saveSessions(allSessions);

      // Update local state
      setSessions(prev => prev.map(session => session.id === id ? updatedSession : session));

      return { success: true, message: 'Session updated successfully' };
    } catch (error) {
      console.error('Update session error:', error);
      return { success: false, message: 'Failed to update session. Please try again.' };
    }
  };

  const deleteSession = async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      if (!user) {
        return { success: false, message: 'User must be logged in to delete sessions' };
      }

      // Get all sessions
      const allSessions = storageUtils.getSessions();
      const sessionExists = allSessions.find(session => session.id === id && session.userId === user.id);

      if (!sessionExists) {
        return { success: false, message: 'Session not found' };
      }

      // Remove session
      const filteredSessions = allSessions.filter(session => !(session.id === id && session.userId === user.id));
      storageUtils.saveSessions(filteredSessions);

      // Update local state
      setSessions(prev => prev.filter(session => session.id !== id));

      return { success: true, message: 'Session deleted successfully' };
    } catch (error) {
      console.error('Delete session error:', error);
      return { success: false, message: 'Failed to delete session. Please try again.' };
    }
  };

  const getSessionStats = () => {
    const total = sessions.length;
    const active = sessions.filter(session => session.status === 'active').length;
    const completed = sessions.filter(session => session.status === 'completed').length;

    return { total, active, completed };
  };

  const value: SessionContextType = {
    sessions,
    createSession,
    updateSession,
    deleteSession,
    getSessionStats,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};