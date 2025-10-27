'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Trade, TradeContextType } from '../types';
import { storageUtils } from '../utils/storage';
import { useAuth } from './AuthContext';

const TradeContext = createContext<TradeContextType | null>(null);

export const useTrade = () => {
  const context = useContext(TradeContext);
  if (!context) {
    throw new Error('useTrade must be used within a TradeProvider');
  }
  return context;
};

export const TradeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);

  useEffect(() => {
    if (user) {
      try {
        const allTrades = storageUtils.getTrades();
        const userTrades = allTrades.filter(trade => trade.userId === user.id);
        setTrades(userTrades);
      } catch (error) {
        console.error('Error loading trades:', error);
        setTrades([]);
      }
    } else {
      setTrades([]);
    }
  }, [user]);

  const calculateProfitOrLoss = (entryPrice: number, exitPrice: number, investment: number, type: 'buy' | 'sell') => {
    let profitOrLoss: number;

    if (type === 'buy') {
      // For buy trades: profit if exit price > entry price
      profitOrLoss = ((exitPrice - entryPrice) / entryPrice) * investment;
    } else {
      // For sell trades: profit if entry price > exit price
      profitOrLoss = ((entryPrice - exitPrice) / entryPrice) * investment;
    }

    const profitOrLossPercentage = (profitOrLoss / investment) * 100;

    return { profitOrLoss, profitOrLossPercentage };
  };

  const addTrade = async (tradeData: Omit<Trade, 'id' | 'userId' | 'profitOrLoss' | 'profitOrLossPercentage' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; message: string }> => {
    try {
      if (!user) {
        return { success: false, message: 'User must be logged in to add trades' };
      }

      // Validate trade data
      if (!tradeData.pairName.trim()) {
        return { success: false, message: 'Pair name is required' };
      }

      if (tradeData.entryPrice <= 0) {
        return { success: false, message: 'Entry price must be greater than 0' };
      }

      if (tradeData.exitPrice && tradeData.exitPrice <= 0) {
        return { success: false, message: 'Exit price must be greater than 0' };
      }

      if (tradeData.investment <= 0) {
        return { success: false, message: 'Investment must be greater than 0' };
      }

      if (!tradeData.date) {
        return { success: false, message: 'Date is required' };
      }

      // Calculate profit/loss only if trade is not pending
      let profitOrLoss = 0;
      let profitOrLossPercentage = 0;

      if (tradeData.status !== 'pending' && tradeData.exitPrice) {
        const result = calculateProfitOrLoss(
          tradeData.entryPrice,
          tradeData.exitPrice,
          tradeData.investment,
          tradeData.type
        );
        profitOrLoss = result.profitOrLoss;
        profitOrLossPercentage = result.profitOrLossPercentage;
      }

      // Create new trade
      const newTrade: Trade = {
        ...tradeData,
        id: Date.now().toString(),
        userId: user.id,
        profitOrLoss,
        profitOrLossPercentage,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Get all trades and add the new one
      const allTrades = storageUtils.getTrades();
      allTrades.push(newTrade);
      storageUtils.saveTrades(allTrades);

      // Update local state
      setTrades(prev => [...prev, newTrade]);

      return { success: true, message: 'Trade added successfully' };
    } catch (error) {
      console.error('Add trade error:', error);
      return { success: false, message: 'Failed to add trade. Please try again.' };
    }
  };

  const updateTrade = async (id: string, updates: Partial<Trade>): Promise<{ success: boolean; message: string }> => {
    try {
      if (!user) {
        return { success: false, message: 'User must be logged in to update trades' };
      }

      // Get all trades
      const allTrades = storageUtils.getTrades();
      const tradeIndex = allTrades.findIndex(trade => trade.id === id && trade.userId === user.id);

      if (tradeIndex === -1) {
        return { success: false, message: 'Trade not found' };
      }

      // Update trade
      const updatedTrade = {
        ...allTrades[tradeIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      // Recalculate profit/loss if relevant fields are updated
      if (updates.entryPrice || updates.exitPrice || updates.investment || updates.type) {
        if (updatedTrade.status !== 'pending' && updatedTrade.exitPrice) {
          const { profitOrLoss, profitOrLossPercentage } = calculateProfitOrLoss(
            updatedTrade.entryPrice,
            updatedTrade.exitPrice,
            updatedTrade.investment,
            updatedTrade.type
          );
          updatedTrade.profitOrLoss = profitOrLoss;
          updatedTrade.profitOrLossPercentage = profitOrLossPercentage;
        }
      }

      // Save updated trades
      allTrades[tradeIndex] = updatedTrade;
      storageUtils.saveTrades(allTrades);

      // Update local state
      setTrades(prev => prev.map(trade => trade.id === id ? updatedTrade : trade));

      return { success: true, message: 'Trade updated successfully' };
    } catch (error) {
      console.error('Update trade error:', error);
      return { success: false, message: 'Failed to update trade. Please try again.' };
    }
  };

  const deleteTrade = async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      if (!user) {
        return { success: false, message: 'User must be logged in to delete trades' };
      }

      // Get all trades
      const allTrades = storageUtils.getTrades();
      const tradeExists = allTrades.find(trade => trade.id === id && trade.userId === user.id);

      if (!tradeExists) {
        return { success: false, message: 'Trade not found' };
      }

      // Remove trade
      const filteredTrades = allTrades.filter(trade => !(trade.id === id && trade.userId === user.id));
      storageUtils.saveTrades(filteredTrades);

      // Update local state
      setTrades(prev => prev.filter(trade => trade.id !== id));

      return { success: true, message: 'Trade deleted successfully' };
    } catch (error) {
      console.error('Delete trade error:', error);
      return { success: false, message: 'Failed to delete trade. Please try again.' };
    }
  };

  const getTradeStats = () => {
    const totalTrades = trades.length;
    const totalProfit = trades.reduce((sum, trade) => sum + (trade.profitOrLoss > 0 ? trade.profitOrLoss : 0), 0);
    const totalLoss = trades.reduce((sum, trade) => sum + (trade.profitOrLoss < 0 ? Math.abs(trade.profitOrLoss) : 0), 0);
    const netProfit = totalProfit - totalLoss;
    const totalInvestment = trades.reduce((sum, trade) => sum + trade.investment, 0);
    const profitPercentage = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;
    const activeInvestment = totalInvestment; // In a real app, this would be current open positions

    return {
      totalTrades,
      totalProfit,
      totalLoss,
      profitPercentage,
      activeInvestment,
    };
  };

  const getSessionTrades = (sessionId: string) => {
    return trades.filter(trade => trade.sessionId === sessionId);
  };

  const reloadTrades = () => {
    if (user) {
      try {
        const allTrades = storageUtils.getTrades();
        const userTrades = allTrades.filter(trade => trade.userId === user.id);
        setTrades(userTrades);
        console.log('Trades reloaded:', userTrades.length);
      } catch (error) {
        console.error('Error reloading trades:', error);
      }
    }
  };

  const createNextPendingTrade = async (sessionId: string, sessionCapital: number, riskPercent: number, riskRewardRatio: number) => {
    try {
      const allTrades = storageUtils.getTrades();
      
      // Get existing trades for this session
      const sessionTrades = allTrades.filter(trade => trade.sessionId === sessionId);
      
      // Calculate current balance based on completed trades
      let currentBalance = sessionCapital;
      const completedTrades = sessionTrades.filter(t => t.status !== 'pending');
      
      completedTrades.forEach(trade => {
        currentBalance += trade.profitOrLoss;
      });
      
      // Calculate stake as percentage of current balance (dynamic)
      const calculatedRisk = currentBalance * riskPercent;
      const timestamp = Date.now();

      const newTrade = {
        id: timestamp.toString(),
        userId: user!.id,
        sessionId: sessionId,
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
      
      // Update local state
      setTrades(prev => [...prev, newTrade]);
      
      console.log('Created next pending trade with stake:', calculatedRisk);
      console.log('Current balance:', currentBalance);
      
      return { success: true, message: 'Next pending trade created' };
    } catch (error) {
      console.error('Error creating next pending trade:', error);
      return { success: false, message: 'Failed to create next pending trade' };
    }
  };

  const recordTradeResult = async (tradeId: string, result: 'won' | 'lost', riskRewardRatio: number): Promise<{ success: boolean; message: string }> => {
    try {
      if (!user) {
        return { success: false, message: 'User must be logged in to record trade results' };
      }

      const allTrades = storageUtils.getTrades();
      const tradeIndex = allTrades.findIndex(trade => trade.id === tradeId && trade.userId === user.id);

      if (tradeIndex === -1) {
        return { success: false, message: 'Trade not found' };
      }

      const trade = allTrades[tradeIndex];

      if (trade.status !== 'pending') {
        return { success: false, message: 'Trade result already recorded' };
      }

      // Calculate profit or loss based on result
      let profitOrLoss: number;
      let profitOrLossPercentage: number;

      if (result === 'won') {
        // Win = investment * riskRewardRatio (e.g., $100 * 3 = $300 profit)
        profitOrLoss = trade.investment * riskRewardRatio;
        profitOrLossPercentage = riskRewardRatio * 100;
      } else {
        // Loss = -investment (e.g., -$100)
        profitOrLoss = -trade.investment;
        profitOrLossPercentage = -100;
      }

      // Update the trade
      const updatedTrade = {
        ...trade,
        status: result,
        profitOrLoss,
        profitOrLossPercentage,
        updatedAt: new Date().toISOString(),
      };

      allTrades[tradeIndex] = updatedTrade;

      storageUtils.saveTrades(allTrades);

      // Update local state - only update the specific trade that was recorded
      setTrades(prev => {
        const updatedTrades = [...prev];
        const idx = updatedTrades.findIndex(t => t.id === tradeId);
        if (idx !== -1) {
          updatedTrades[idx] = updatedTrade;
        }
        return updatedTrades;
      });

      return { success: true, message: `Trade marked as ${result}` };
    } catch (error) {
      console.error('Record trade result error:', error);
      return { success: false, message: 'Failed to record trade result. Please try again.' };
    }
  };

  const value: TradeContextType = {
    trades,
    addTrade,
    updateTrade,
    deleteTrade,
    getTradeStats,
    getSessionTrades,
    recordTradeResult,
    reloadTrades,
    createNextPendingTrade,
  };

  return (
    <TradeContext.Provider value={value}>
      {children}
    </TradeContext.Provider>
  );
};