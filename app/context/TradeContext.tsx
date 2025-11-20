'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Trade, TradeContextType, TradingSession } from '../types';
import { apiClient } from '../utils/api';
import { useAuth } from './AuthContext';
import { storageUtils } from '../utils/storage';
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
  const fixedWinRate = 0.60; // Always use 60% benchmark for aspirational target
  const expectedWins = totalTrades * fixedWinRate;
  const expectedLosses = totalTrades * (1 - fixedWinRate);

  const winMultiplier = 1 + riskRewardRatio * baseRisk;
  const lossMultiplier = 1 - baseRisk;

  const targetMultiplier =
    Math.pow(winMultiplier, expectedWins) * Math.pow(lossMultiplier, expectedLosses);

  const rawProfit = targetMultiplier * capital - capital;
  const step = Math.max(Number((riskRewardRatio * 0.01).toFixed(2)), 0.01);
  const normalizedProfit =
    step > 0 ? Math.round(rawProfit / step) * step : rawProfit;

  return Number(normalizedProfit.toFixed(2));
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

  const resolveActiveUserId = useCallback(() => {
    if (user?.id) {
      return user.id;
    }
    const storedUser = storageUtils.getCurrentUser();
    return storedUser?.id ?? null;
  }, [user]);

  const loadTrades = useCallback(async () => {
    const activeUserId = resolveActiveUserId();

    if (!activeUserId) {
      setTrades([]);
      return;
    }

    try {
      const response = await apiClient.getTrades();
      if (response.success && response.trades) {
        const userTrades = response.trades.filter(
          (trade: Trade) => trade.userId === activeUserId
        );
        setTrades(userTrades);
      } else {
        setTrades([]);
      }
    } catch (error) {
      console.error('Error loading trades:', error);
      setTrades([]);
    }
  }, [resolveActiveUserId]);

  useEffect(() => {
    loadTrades();
  }, [loadTrades]);

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

      // Save to API
      const response = await apiClient.createTrade(newTrade);

      if (response.success && response.trade) {
        // Update local state
        setTrades(prev => [...prev, response.trade]);
        return { success: true, message: 'Trade added successfully' };
      }

      return { success: false, message: response.message || 'Failed to add trade' };
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

      // Find the trade in local state
      const trade = trades.find(t => t.id === id);
      if (!trade) {
        return { success: false, message: 'Trade not found' };
      }

      // Update trade
      const updatedTrade = {
        ...trade,
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

      // Update via API
      const response = await apiClient.updateTrade(id, updatedTrade);

      if (response.success && response.trade) {
        // Update local state
        setTrades(prev => prev.map(t => t.id === id ? response.trade : t));
        return { success: true, message: 'Trade updated successfully' };
      }

      return { success: false, message: response.message || 'Failed to update trade' };
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

      // Delete via API
      const response = await apiClient.deleteTrade(id);

      if (response.success) {
        // Update local state
        setTrades(prev => prev.filter(trade => trade.id !== id));
        return { success: true, message: 'Trade deleted successfully' };
      }

      return { success: false, message: response.message || 'Failed to delete trade' };
    } catch (error) {
      console.error('Delete trade error:', error);
      return { success: false, message: 'Failed to delete trade. Please try again.' };
    }
  };

  const getTradeStats = (sessions?: TradingSession[]) => {
    // If sessions are provided, only count trades from active sessions
    let relevantTrades = trades;

    if (sessions && sessions.length > 0) {
      const activeSessionIds = new Set(
        sessions
          .filter(session => session.status === 'active')
          .map(session => session.id)
      );
      relevantTrades = trades.filter(trade => trade.sessionId && activeSessionIds.has(trade.sessionId));
    }

    // Only count completed trades (won or lost), not pending trades
    const completedTrades = relevantTrades.filter(trade => trade.status === 'won' || trade.status === 'lost');
    const totalTrades = completedTrades.length;

    // Calculate win rate based on completed trades from active sessions only
    const wonTrades = completedTrades.filter(trade => trade.status === 'won').length;
    const winRate = totalTrades > 0 ? (wonTrades / totalTrades) * 100 : 0;

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
      winRate,
      activeInvestment,
    };
  };

  const getSessionTrades = (sessionId: string) => {
    return trades.filter(trade => trade.sessionId === sessionId);
  };

  const reloadTrades = async () => {
    await loadTrades();
  };

  const alignSessionProfit = async (sessionId: string, targetProfit: number) => {
    if (!user) return;

    try {
      // Get session trades from API
      const response = await apiClient.getSessionTrades(sessionId);
      if (!response.success || !response.trades) {
        return;
      }

      const sessionTrades = response.trades;
      const completedTrades = sessionTrades.filter((trade: Trade) => trade.status !== 'pending');

      if (completedTrades.length === 0) {
        return;
      }

      const actualProfit = completedTrades.reduce(
        (sum: number, trade: Trade) => sum + trade.profitOrLoss,
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
          return [...sortedCompleted].reverse().find((trade: Trade) => trade.status === 'won');
        }

        if (profitDelta < 0) {
          return [...sortedCompleted].reverse().find((trade: Trade) => trade.status === 'lost');
        }

        return sortedCompleted[sortedCompleted.length - 1];
      };

      const tradeToAdjust = selectTradeForAdjustment() ?? sortedCompleted[sortedCompleted.length - 1];

      if (!tradeToAdjust) {
        return;
      }

      const originalProfit = tradeToAdjust.profitOrLoss;
      const originalInvestment = tradeToAdjust.investment;
      const isWin = tradeToAdjust.status === 'won';
      const isLoss = tradeToAdjust.status === 'lost';

      let adjustedProfit = Number((originalProfit + profitDelta).toFixed(2));
      let adjustedInvestment = originalInvestment;

      // For adjustments, maintain the risk-reward ratio to prevent calculation errors
      // Small deltas (< $0.50) can be applied directly for precision
      const isSmallDelta = Math.abs(profitDelta) < 0.5;

      if (isWin && adjustedProfit > 0) {
        // Calculate the original risk-reward ratio
        const originalRRRatio = originalInvestment > 0
          ? Number((originalProfit / originalInvestment).toFixed(6))
          : 0;

        if (originalRRRatio > 0) {
          if (isSmallDelta) {
            // For very small deltas, apply directly to profit and adjust investment to maintain RR
            adjustedInvestment = Number(
              Math.max(0, adjustedProfit / originalRRRatio).toFixed(2)
            );
            adjustedProfit = Number(
              (adjustedInvestment * originalRRRatio).toFixed(2)
            );
          } else {
            // For larger adjustments, maintain RR ratio by adjusting both investment and profit
            adjustedInvestment = Number(
              Math.max(0, adjustedProfit / originalRRRatio).toFixed(2)
            );
            adjustedProfit = Number(
              (adjustedInvestment * originalRRRatio).toFixed(2)
            );
          }
        } else {
          // If no original RR ratio, keep investment and adjust profit
          adjustedInvestment = originalInvestment;
          adjustedProfit = Number((originalProfit + profitDelta).toFixed(2));
        }
      } else if (isLoss && adjustedProfit < 0) {
        adjustedInvestment = Number(Math.abs(adjustedProfit).toFixed(2));
        adjustedProfit = -adjustedInvestment;
      }

      // Check if we need a second adjustment
      const projectedActualProfit =
        actualProfit - originalProfit + adjustedProfit;
      const remainingDelta = Number(
        (targetProfit - projectedActualProfit).toFixed(2)
      );

      if (Math.abs(remainingDelta) >= 0.01) {
        // Apply remaining delta while maintaining RR ratio
        const newAdjustedProfit = Number(
          (adjustedProfit + remainingDelta).toFixed(2)
        );
        
        if (isWin && adjustedInvestment > 0) {
          // Calculate the original risk-reward ratio from the trade
          const originalRRRatio = originalInvestment > 0 
            ? originalProfit / originalInvestment 
            : 0;
          
          if (originalRRRatio > 0) {
            // Maintain RR ratio by adjusting investment proportionally
            adjustedInvestment = Number(
              Math.max(0, newAdjustedProfit / originalRRRatio).toFixed(2)
            );
            adjustedProfit = Number(
              (adjustedInvestment * originalRRRatio).toFixed(2)
            );
          } else {
            adjustedProfit = newAdjustedProfit;
          }
        } else {
          adjustedProfit = newAdjustedProfit;
        }
      }

      // Final check: Verify we've reached the target, and if not, apply a small final adjustment
      const finalActualProfit = actualProfit - originalProfit + adjustedProfit;
      const finalDelta = Number((targetProfit - finalActualProfit).toFixed(2));
      
      // If there's still a small delta (< $1), apply it directly to profit for exact alignment
      // This ensures we reach the target while maintaining RR ratio as closely as possible
      if (Math.abs(finalDelta) >= 0.01 && Math.abs(finalDelta) < 1.0) {
        if (isWin && adjustedInvestment > 0) {
          const originalRRRatio = originalInvestment > 0 
            ? originalProfit / originalInvestment 
            : 0;
          
          if (originalRRRatio > 0) {
            // Apply small delta and recalculate to maintain RR ratio
            const finalAdjustedProfit = Number((adjustedProfit + finalDelta).toFixed(2));
            adjustedInvestment = Number(
              Math.max(0, finalAdjustedProfit / originalRRRatio).toFixed(2)
            );
            adjustedProfit = Number(
              (adjustedInvestment * originalRRRatio).toFixed(2)
            );
          } else {
            adjustedProfit = Number((adjustedProfit + finalDelta).toFixed(2));
          }
        } else {
          adjustedProfit = Number((adjustedProfit + finalDelta).toFixed(2));
        }
      } else if (Math.abs(finalDelta) >= 1.0) {
        // If delta is large, maintain RR ratio strictly
        if (isWin && adjustedInvestment > 0) {
          const originalRRRatio = originalInvestment > 0 
            ? originalProfit / originalInvestment 
            : 0;
          
          if (originalRRRatio > 0) {
            // Recalculate to maintain exact RR ratio
            adjustedInvestment = Number(
              Math.max(0, adjustedProfit / originalRRRatio).toFixed(2)
            );
            adjustedProfit = Number(
              (adjustedInvestment * originalRRRatio).toFixed(2)
            );
          }
        }
      }

      const adjustedPercentage =
        adjustedInvestment > 0
          ? Number(((adjustedProfit / adjustedInvestment) * 100).toFixed(2))
          : tradeToAdjust.profitOrLossPercentage;

      const updatedTrade = {
        ...tradeToAdjust,
        investment: adjustedInvestment,
        profitOrLoss: adjustedProfit,
        profitOrLossPercentage: adjustedPercentage,
        updatedAt: new Date().toISOString(),
      };

      // Update via API
      const updateResponse = await apiClient.updateTrade(tradeToAdjust.id, updatedTrade);

      if (updateResponse.success) {
        // Update local state
        setTrades(prev => prev.map(t => t.id === tradeToAdjust.id ? updateResponse.trade : t));
      }
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
      // Get existing trades for this session from API
      const response = await apiClient.getSessionTrades(sessionId);
      if (!response.success || !response.trades) {
        return { success: false, message: 'Failed to load session trades' };
      }

      const sessionTrades = response.trades;

      // Check if target trades limit has been reached
      const completedTrades = sessionTrades.filter((t: Trade) => t.status !== 'pending');
    if (completedTrades.length >= targetTrades) {
        console.log('Target trades limit reached:', completedTrades.length, '/', targetTrades);
        return { success: false, message: 'Target trades limit reached' };
      }

      const wins = completedTrades.filter((trade: Trade) => trade.status === 'won').length;
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

      completedTrades.forEach((trade: Trade) => {
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

      // For low ITM scenarios (≤25%), use a more conservative target balance for stake calculation
      // This prevents over-aggressive staking while keeping the display target aspirational
      let stakingTargetBalance: number;

      if (targetAccuracy <= 25) {
        // Use a break-even target: just preserve the initial capital
        // This ensures conservative staking that allows completing all trades
        stakingTargetBalance = sessionCapital * 1.05; // Aim to just break even + small buffer
      } else {
        // For normal ITM (>25%), use the full aspirational target
        stakingTargetBalance = sessionCapital + targetProfit;
      }

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
        stakingTargetBalance,
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

      // Save to API
      const createResponse = await apiClient.createTrade(newTrade);

      if (createResponse.success && createResponse.trade) {
        // Update local state
        setTrades(prev => [...prev, createResponse.trade]);

        console.log('Created next pending trade with stake:', nextStake);
        console.log('Current balance:', currentBalance);
        console.log('Completed trades:', completedTrades.length, '/', targetTrades);

        return { success: true, message: 'Next pending trade created' };
      }

      return { success: false, message: createResponse.message || 'Failed to create trade' };
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

      // Find the trade in local state
      const trade = trades.find(t => t.id === tradeId);
      if (!trade) {
        return { success: false, message: 'Trade not found' };
      }

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

      // Update via API
      const response = await apiClient.updateTrade(tradeId, updatedTrade);

      if (response.success && response.trade) {
        // Update local state
        setTrades(prev => prev.map(t => t.id === tradeId ? response.trade : t));
        return { success: true, message: `Trade marked as ${result}` };
      }

      return { success: false, message: response.message || 'Failed to record trade result' };
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
