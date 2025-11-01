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

    // REFERENCE WEBSITE FORMULA: Uses aggressive risk percentage
    // Observed range: 15-51%, averaging around 30%

    // Calculate Kelly Criterion
    const kellyPercent = (winRate * rrRatio - (1 - winRate)) / rrRatio;

    let riskPercent;

    if (kellyPercent <= 0) {
      // Strategy not profitable, use minimum risk
      riskPercent = 0.15;
    } else {
      // Use aggressive multiplier on Kelly to match reference website
      // Reference uses 30-40% on average, which is ~4.5x Kelly for typical values
      riskPercent = kellyPercent * 4.5;

      // Cap at 50% to match observed maximum in reference website
      riskPercent = Math.min(riskPercent, 0.50);

      // Ensure minimum of 15%
      riskPercent = Math.max(riskPercent, 0.15);
    }

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

  const createNextPendingTrade = async (session: TradingSession) => {
    try {
      const riskPercent = calculateRiskPercentage(session);
      const allTrades = storageUtils.getTrades();
      
      // Get existing trades for this session
      const sessionTrades = allTrades.filter(trade => trade.sessionId === session.id);
      
      // Check if target trades limit has been reached
      const completedTrades = sessionTrades.filter(t => t.status !== 'pending');
      if (completedTrades.length >= session.totalTrades) {
        console.log('Target trades limit reached:', completedTrades.length, '/', session.totalTrades);
        return;
      }
      
      // Calculate current balance based on completed trades
      let currentBalance = session.capital;
      
      completedTrades.forEach(trade => {
        currentBalance += trade.profitOrLoss;
      });
      
      // Calculate stake as percentage of current balance (dynamic)
      const calculatedRisk = currentBalance * riskPercent;
      const timestamp = Date.now();

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

      allTrades.push(newTrade);
      storageUtils.saveTrades(allTrades);
      
      console.log('Created next pending trade with stake:', calculatedRisk);
      console.log('Current balance:', currentBalance);
      console.log('Completed trades:', completedTrades.length, '/', session.totalTrades);
    } catch (error) {
      console.error('Error creating next pending trade:', error);
    }
  };

  const createAllPendingTrades = async (session: TradingSession) => {
    try {
      console.log('Creating initial pending trade for session:', session.id);
      
      // Only create the first pending trade
      await createNextPendingTrade(session);
    } catch (error) {
      console.error('Error creating initial pending trade:', error);
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