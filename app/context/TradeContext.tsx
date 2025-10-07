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

      if (tradeData.exitPrice <= 0) {
        return { success: false, message: 'Exit price must be greater than 0' };
      }

      if (tradeData.investment <= 0) {
        return { success: false, message: 'Investment must be greater than 0' };
      }

      if (!tradeData.date) {
        return { success: false, message: 'Date is required' };
      }

      // Calculate profit/loss
      const { profitOrLoss, profitOrLossPercentage } = calculateProfitOrLoss(
        tradeData.entryPrice,
        tradeData.exitPrice,
        tradeData.investment,
        tradeData.type
      );

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
        const { profitOrLoss, profitOrLossPercentage } = calculateProfitOrLoss(
          updatedTrade.entryPrice,
          updatedTrade.exitPrice,
          updatedTrade.investment,
          updatedTrade.type
        );
        updatedTrade.profitOrLoss = profitOrLoss;
        updatedTrade.profitOrLossPercentage = profitOrLossPercentage;
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

  const value: TradeContextType = {
    trades,
    addTrade,
    updateTrade,
    deleteTrade,
    getTradeStats,
  };

  return (
    <TradeContext.Provider value={value}>
      {children}
    </TradeContext.Provider>
  );
};