'use client';

import React, { useState, useMemo } from 'react';
import { Trade } from '../types';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Target,
  Calendar,
  DollarSign,
  Activity,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';

interface AdvancedTradeAnalyticsProps {
  trades: Trade[];
  onRefresh?: () => void;
}

interface AnalyticsData {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfit: number;
  totalLoss: number;
  netProfit: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  bestTrade: Trade | null;
  worstTrade: Trade | null;
  monthlyReturns: { month: string; return: number }[];
  riskMetrics: {
    volatility: number;
    var95: number;
    expectedShortfall: number;
  };
}

export const AdvancedTradeAnalytics: React.FC<AdvancedTradeAnalyticsProps> = ({
  trades,
  onRefresh
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | '30d' | '90d' | '1y'>('all');
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'risk'>('overview');

  const analyticsData = useMemo((): AnalyticsData => {
    if (trades.length === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        totalProfit: 0,
        totalLoss: 0,
        netProfit: 0,
        averageWin: 0,
        averageLoss: 0,
        profitFactor: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        consecutiveWins: 0,
        consecutiveLosses: 0,
        bestTrade: null,
        worstTrade: null,
        monthlyReturns: [],
        riskMetrics: {
          volatility: 0,
          var95: 0,
          expectedShortfall: 0
        }
      };
    }

    // Filter trades by period
    const now = new Date();
    const filteredTrades = trades.filter(trade => {
      const tradeDate = new Date(trade.date);
      switch (selectedPeriod) {
        case '30d':
          return tradeDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        case '90d':
          return tradeDate >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        case '1y':
          return tradeDate >= new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        default:
          return true;
      }
    });

    const completedTrades = filteredTrades.filter(trade => trade.status !== 'pending');
    const winningTrades = completedTrades.filter(trade => trade.profitOrLoss > 0);
    const losingTrades = completedTrades.filter(trade => trade.profitOrLoss < 0);

    const totalProfit = winningTrades.reduce((sum, trade) => sum + trade.profitOrLoss, 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + trade.profitOrLoss, 0));
    const netProfit = totalProfit - totalLoss;

    const averageWin = winningTrades.length > 0 ? totalProfit / winningTrades.length : 0;
    const averageLoss = losingTrades.length > 0 ? totalLoss / losingTrades.length : 0;
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;

    // Calculate consecutive wins/losses
    let consecutiveWins = 0;
    let consecutiveLosses = 0;
    let currentStreak = 0;
    let currentType: 'win' | 'loss' | null = null;

    for (const trade of completedTrades) {
      if (trade.profitOrLoss > 0) {
        if (currentType === 'win') {
          currentStreak++;
        } else {
          currentStreak = 1;
          currentType = 'win';
        }
        consecutiveWins = Math.max(consecutiveWins, currentStreak);
      } else if (trade.profitOrLoss < 0) {
        if (currentType === 'loss') {
          currentStreak++;
        } else {
          currentStreak = 1;
          currentType = 'loss';
        }
        consecutiveLosses = Math.max(consecutiveLosses, currentStreak);
      }
    }

    // Calculate monthly returns
    const monthlyReturns = calculateMonthlyReturns(completedTrades);

    // Calculate risk metrics
    const returns = completedTrades.map(trade => trade.profitOrLossPercentage);
    const volatility = calculateVolatility(returns);
    const var95 = calculateVaR(returns, 0.95);
    const expectedShortfall = calculateExpectedShortfall(returns, 0.95);

    // Calculate Sharpe ratio (simplified)
    const averageReturn = returns.length > 0 ? returns.reduce((sum, r) => sum + r, 0) / returns.length : 0;
    const sharpeRatio = volatility > 0 ? averageReturn / volatility : 0;

    // Calculate max drawdown
    const maxDrawdown = calculateMaxDrawdown(completedTrades);

    return {
      totalTrades: completedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: completedTrades.length > 0 ? (winningTrades.length / completedTrades.length) * 100 : 0,
      totalProfit,
      totalLoss,
      netProfit,
      averageWin,
      averageLoss,
      profitFactor,
      sharpeRatio,
      maxDrawdown,
      consecutiveWins,
      consecutiveLosses,
      bestTrade: winningTrades.length > 0 ? winningTrades.reduce((best, trade) => 
        trade.profitOrLoss > best.profitOrLoss ? trade : best
      ) : null,
      worstTrade: losingTrades.length > 0 ? losingTrades.reduce((worst, trade) => 
        trade.profitOrLoss < worst.profitOrLoss ? trade : worst
      ) : null,
      monthlyReturns,
      riskMetrics: {
        volatility,
        var95,
        expectedShortfall
      }
    };
  }, [trades, selectedPeriod]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const exportData = () => {
    const csvContent = [
      ['Date', 'Pair', 'Type', 'Entry Price', 'Exit Price', 'Investment', 'P&L', 'P&L %', 'Status'],
      ...trades.map(trade => [
        trade.date,
        trade.pairName,
        trade.type,
        trade.entryPrice.toString(),
        trade.exitPrice?.toString() || '',
        trade.investment.toString(),
        trade.profitOrLoss.toString(),
        trade.profitOrLossPercentage.toString(),
        trade.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trades-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Advanced Analytics</h2>
          <p className="text-gray-600">Comprehensive trading performance analysis</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={exportData}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex gap-2">
          {(['all', '30d', '90d', '1y'] as const).map(period => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === period
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {period === 'all' ? 'All Time' : period.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(['overview', 'detailed', 'risk'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                viewMode === mode
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-xl shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Trades</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.totalTrades}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-xl shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Win Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatPercentage(analyticsData.winRate)}
                </p>
              </div>
              <Target className="w-8 h-8 text-green-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-xl shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Profit</p>
                <p className={`text-2xl font-bold ${analyticsData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(analyticsData.netProfit)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-xl shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Profit Factor</p>
                <p className="text-2xl font-bold text-blue-600">
                  {analyticsData.profitFactor === Infinity ? '∞' : analyticsData.profitFactor.toFixed(2)}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
          </motion.div>
        </div>
      )}

      {/* Detailed Analytics */}
      {viewMode === 'detailed' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Winning Trades:</span>
                <span className="font-semibold text-green-600">{analyticsData.winningTrades}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Losing Trades:</span>
                <span className="font-semibold text-red-600">{analyticsData.losingTrades}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Average Win:</span>
                <span className="font-semibold text-green-600">{formatCurrency(analyticsData.averageWin)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Average Loss:</span>
                <span className="font-semibold text-red-600">{formatCurrency(analyticsData.averageLoss)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Consecutive Wins:</span>
                <span className="font-semibold text-green-600">{analyticsData.consecutiveWins}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Consecutive Losses:</span>
                <span className="font-semibold text-red-600">{analyticsData.consecutiveLosses}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Best & Worst Trades</h3>
            <div className="space-y-4">
              {analyticsData.bestTrade && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-green-800">{analyticsData.bestTrade.pairName}</p>
                      <p className="text-sm text-green-600">{analyticsData.bestTrade.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-800">{formatCurrency(analyticsData.bestTrade.profitOrLoss)}</p>
                      <p className="text-sm text-green-600">{formatPercentage(analyticsData.bestTrade.profitOrLossPercentage)}</p>
                    </div>
                  </div>
                </div>
              )}

              {analyticsData.worstTrade && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-red-800">{analyticsData.worstTrade.pairName}</p>
                      <p className="text-sm text-red-600">{analyticsData.worstTrade.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-800">{formatCurrency(analyticsData.worstTrade.profitOrLoss)}</p>
                      <p className="text-sm text-red-600">{formatPercentage(analyticsData.worstTrade.profitOrLossPercentage)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Risk Analytics */}
      {viewMode === 'risk' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Metrics</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Volatility:</span>
                <span className="font-semibold">{formatPercentage(analyticsData.riskMetrics.volatility)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">VaR (95%):</span>
                <span className="font-semibold">{formatPercentage(analyticsData.riskMetrics.var95)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Expected Shortfall:</span>
                <span className="font-semibold">{formatPercentage(analyticsData.riskMetrics.expectedShortfall)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Max Drawdown:</span>
                <span className="font-semibold text-red-600">{formatPercentage(analyticsData.maxDrawdown)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sharpe Ratio</h3>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {analyticsData.sharpeRatio.toFixed(2)}
              </div>
              <p className="text-sm text-gray-600">
                {analyticsData.sharpeRatio > 1 ? 'Excellent' : 
                 analyticsData.sharpeRatio > 0.5 ? 'Good' : 
                 analyticsData.sharpeRatio > 0 ? 'Fair' : 'Poor'}
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Returns</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {analyticsData.monthlyReturns.map((month, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{month.month}</span>
                  <span className={`text-sm font-semibold ${month.return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(month.return)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions
function calculateMonthlyReturns(trades: Trade[]): { month: string; return: number }[] {
  const monthlyData: { [key: string]: number[] } = {};
  
  trades.forEach(trade => {
    const date = new Date(trade.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = [];
    }
    monthlyData[monthKey].push(trade.profitOrLossPercentage);
  });

  return Object.entries(monthlyData).map(([month, returns]) => ({
    month,
    return: returns.reduce((sum, r) => sum + r, 0) / returns.length
  })).sort((a, b) => a.month.localeCompare(b.month));
}

function calculateVolatility(returns: number[]): number {
  if (returns.length === 0) return 0;
  
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  return Math.sqrt(variance);
}

function calculateVaR(returns: number[], confidence: number): number {
  if (returns.length === 0) return 0;
  
  const sortedReturns = [...returns].sort((a, b) => a - b);
  const index = Math.floor((1 - confidence) * sortedReturns.length);
  return Math.abs(sortedReturns[index] || 0);
}

function calculateExpectedShortfall(returns: number[], confidence: number): number {
  if (returns.length === 0) return 0;
  
  const sortedReturns = [...returns].sort((a, b) => a - b);
  const varIndex = Math.floor((1 - confidence) * sortedReturns.length);
  const tailReturns = sortedReturns.slice(0, varIndex);
  
  return tailReturns.length > 0 ? Math.abs(tailReturns.reduce((sum, r) => sum + r, 0) / tailReturns.length) : 0;
}

function calculateMaxDrawdown(trades: Trade[]): number {
  if (trades.length === 0) return 0;
  
  let maxDrawdown = 0;
  let peak = 0;
  let runningBalance = 0;
  
  trades.forEach(trade => {
    runningBalance += trade.profitOrLoss;
    if (runningBalance > peak) {
      peak = runningBalance;
    }
    const drawdown = peak - runningBalance;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  });
  
  return peak > 0 ? (maxDrawdown / peak) * 100 : 0;
}




