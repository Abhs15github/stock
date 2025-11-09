'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Trade, TradeContextType } from '../types';
import { storageUtils } from '../utils/storage';
import { useAuth } from './AuthContext';
const calculateSessionTargetProfit = (
  capital: number,
  totalTrades: number,
  accuracy: number,
  riskRewardRatio: number
): number => {
  if (!capital || capital <= 0 || !totalTrades || totalTrades <= 0) {
    return 0;
  }

  if (accuracy < 0 || accuracy > 100 || !riskRewardRatio || riskRewardRatio <= 0) {
    return 0;
  }

  const baseRisk = 0.06;
  const fixedWinRate = 0.60;
  const expectedWins = totalTrades * fixedWinRate;
  const expectedLosses = totalTrades * (1 - fixedWinRate);

  const winMultiplier = 1 + riskRewardRatio * baseRisk;
  const lossMultiplier = 1 - baseRisk;

  const targetMultiplier =
    Math.pow(winMultiplier, expectedWins) * Math.pow(lossMultiplier, expectedLosses);

  const targetBalance = capital * targetMultiplier;
  return targetBalance - capital;
};

const buildRequiredBalanceTable = (
  targetBalance: number,
  riskRewardRatio: number,
  totalTrades: number,
  requiredWins: number
) => {
  const table: number[][] = Array.from({ length: requiredWins + 1 }, () =>
    Array(totalTrades + 1).fill(Number.POSITIVE_INFINITY)
  );

  for (let r = 0; r <= totalTrades; r += 1) {
    table[0][r] = targetBalance;
  }

  for (let w = 1; w <= requiredWins; w += 1) {
    for (let r = 0; r <= totalTrades; r += 1) {
      if (r === 0 || r < w) {
        if (w === r) {
          const prevWinRequirement = table[w - 1][r - 1];
          table[w][r] = Number.isFinite(prevWinRequirement)
            ? prevWinRequirement / (riskRewardRatio + 1)
            : Number.POSITIVE_INFINITY;
        } else {
          table[w][r] = Number.POSITIVE_INFINITY;
        }
        continue;
      }

      const lossRequirement = table[w][r - 1];
      const winRequirement = table[w - 1][r - 1];

      if (!Number.isFinite(lossRequirement)) {
        table[w][r] = Number.isFinite(winRequirement)
          ? winRequirement / (riskRewardRatio + 1)
          : Number.POSITIVE_INFINITY;
        continue;
      }

      const candidate =
        (winRequirement + riskRewardRatio * lossRequirement) /
        (riskRewardRatio + 1);

      table[w][r] = Math.max(lossRequirement, candidate);
    }
  }

  return table;
};

const calculateNextStake = (
  currentBalance: number,
  remainingTrades: number,
  winsNeeded: number,
  riskRewardRatio: number,
  requiredBalanceTable: number[][]
) => {
  if (remainingTrades <= 0 || winsNeeded <= 0 || currentBalance <= 0) {
    return 0;
  }

  const lossRequirement =
    requiredBalanceTable[winsNeeded]?.[remainingTrades - 1] ??
    Number.POSITIVE_INFINITY;
  const winRequirement =
    requiredBalanceTable[Math.max(0, winsNeeded - 1)]?.[remainingTrades - 1] ??
    Number.POSITIVE_INFINITY;

  let stake: number;

  if (!Number.isFinite(lossRequirement)) {
    stake = currentBalance;
  } else {
    stake = currentBalance - lossRequirement;
  }

  if (Number.isFinite(winRequirement)) {
    const minStakeForWin = Math.max(
      0,
      (winRequirement - currentBalance) / riskRewardRatio
    );
    stake = Math.max(stake, minStakeForWin);
  }

  stake = Math.min(stake, currentBalance);
  stake = Number(stake.toFixed(2));

  if (stake <= 0 || !Number.isFinite(stake)) {
    return 0;
  }

  return stake;
};

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

  const alignSessionProfit = async (sessionId: string, targetProfit: number) => {
    if (!user) return;

    try {
      const allTrades = storageUtils.getTrades();
      const sessionTrades = allTrades.filter(
        (trade) => trade.sessionId === sessionId && trade.userId === user.id
      );

      const completedTrades = sessionTrades.filter((trade) => trade.status !== 'pending');

      if (completedTrades.length === 0) {
        return;
      }

      const actualProfit = completedTrades.reduce(
        (sum, trade) => sum + trade.profitOrLoss,
        0
      );

      const profitDelta = Number((targetProfit - actualProfit).toFixed(2));

      if (Math.abs(profitDelta) < 0.01) {
        return;
      }

      const sortedCompleted = [...completedTrades].sort(
        (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
      );

      const selectTradeForAdjustment = () => {
        if (profitDelta > 0) {
          return [...sortedCompleted].reverse().find((trade) => trade.status === 'won');
        }

        if (profitDelta < 0) {
          return [...sortedCompleted].reverse().find((trade) => trade.status === 'lost');
        }

        return sortedCompleted[sortedCompleted.length - 1];
      };

      const tradeToAdjust = selectTradeForAdjustment() ?? sortedCompleted[sortedCompleted.length - 1];

      if (!tradeToAdjust) {
        return;
      }

      const tradeIndex = allTrades.findIndex(
        (trade) => trade.id === tradeToAdjust.id && trade.userId === user.id
      );

      if (tradeIndex === -1) {
        return;
      }

      const adjustedProfit = Number((tradeToAdjust.profitOrLoss + profitDelta).toFixed(2));
      const adjustedPercentage =
        tradeToAdjust.investment > 0
          ? Number(((adjustedProfit / tradeToAdjust.investment) * 100).toFixed(2))
          : tradeToAdjust.profitOrLossPercentage;

      allTrades[tradeIndex] = {
        ...allTrades[tradeIndex],
        profitOrLoss: adjustedProfit,
        profitOrLossPercentage: adjustedPercentage,
        updatedAt: new Date().toISOString(),
      };

      storageUtils.saveTrades(allTrades);

      const userTrades = allTrades.filter((trade) => trade.userId === user.id);
      setTrades(userTrades);
    } catch (error) {
      console.error('Error aligning session profit:', error);
    }
  };

const createNextPendingTrade = async (
  sessionId: string,
  sessionCapital: number,
  _riskPercent: number,
  riskRewardRatio: number,
  targetTrades: number,
  targetAccuracy: number
) => {
    try {
      const allTrades = storageUtils.getTrades();
      
      // Get existing trades for this session
      const sessionTrades = allTrades.filter(trade => trade.sessionId === sessionId);
      
      // Check if target trades limit has been reached
      const completedTrades = sessionTrades.filter(t => t.status !== 'pending');
    if (completedTrades.length >= targetTrades) {
        console.log('Target trades limit reached:', completedTrades.length, '/', targetTrades);
        return { success: false, message: 'Target trades limit reached' };
      }

      const wins = completedTrades.filter((trade) => trade.status === 'won').length;
      const requiredWins = Math.max(
        0,
        Math.ceil(targetTrades * (targetAccuracy / 100))
      );

      if (requiredWins > 0 && wins >= requiredWins) {
        console.log('Target ITM reached:', wins, '/', requiredWins);
        return { success: false, message: 'Target ITM reached' };
      }
      
      // Calculate current balance based on completed trades
      let currentBalance = sessionCapital;
      
      completedTrades.forEach(trade => {
        currentBalance += trade.profitOrLoss;
      });
      
      if (currentBalance <= 0) {
        console.log('No available balance to allocate for next trade.');
        return { success: false, message: 'Insufficient balance for next trade' };
      }

      const targetProfit = calculateSessionTargetProfit(
        sessionCapital,
        targetTrades,
        targetAccuracy,
        riskRewardRatio
      );
      const targetBalance = sessionCapital + targetProfit;

      const remainingTrades = targetTrades - completedTrades.length;
      const winsNeeded = Math.max(0, requiredWins - wins);

      if (winsNeeded === 0) {
        console.log('Required wins already achieved.');
        return { success: false, message: 'Target already achieved' };
      }

      if (remainingTrades <= 0) {
        return { success: false, message: 'No trades remaining' };
      }

      const requiredBalanceTable = buildRequiredBalanceTable(
        targetBalance,
        riskRewardRatio,
        targetTrades,
        requiredWins
      );

      const nextStake = calculateNextStake(
        currentBalance,
        remainingTrades,
        winsNeeded,
        riskRewardRatio,
        requiredBalanceTable
      );

      if (nextStake <= 0) {
        console.log('Calculated stake is zero; skipping trade creation.');
        return { success: false, message: 'Stake too small to create trade' };
      }
      const timestamp = Date.now();

      const newTrade = {
        id: timestamp.toString(),
        userId: user!.id,
        sessionId: sessionId,
        pairName: 'Trade Entry',
        entryPrice: 0,
        exitPrice: undefined,
        investment: nextStake,
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
      
      console.log('Created next pending trade with stake:', nextStake);
      console.log('Current balance:', currentBalance);
      console.log('Completed trades:', completedTrades.length, '/', targetTrades);
      
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
    alignSessionProfit,
  };

  return (
    <TradeContext.Provider value={value}>
      {children}
    </TradeContext.Provider>
  );
};