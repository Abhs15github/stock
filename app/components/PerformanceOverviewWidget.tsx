'use client';

import React, { useMemo } from 'react';
import { TradingSession, Trade } from '../types';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Trophy,
  Flame,
  BarChart3,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Target
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import Link from 'next/link';

interface PerformanceOverviewWidgetProps {
  sessions: TradingSession[];
  trades: Trade[];
}

export const PerformanceOverviewWidget: React.FC<PerformanceOverviewWidgetProps> = ({
  sessions,
  trades
}) => {
  const performanceData = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Filter completed trades
    const completedTrades = trades.filter(t => t.status === 'won' || t.status === 'lost');
    
    // Calculate this week's metrics
    const thisWeekTrades = completedTrades.filter(t => {
      const tradeDate = new Date(t.date);
      return tradeDate >= oneWeekAgo;
    });
    
    // Calculate last week's metrics
    const lastWeekTrades = completedTrades.filter(t => {
      const tradeDate = new Date(t.date);
      return tradeDate >= twoWeeksAgo && tradeDate < oneWeekAgo;
    });

    // This week stats
    const thisWeekProfit = thisWeekTrades.reduce((sum, t) => sum + t.profitOrLoss, 0);
    const thisWeekWins = thisWeekTrades.filter(t => t.status === 'won').length;
    const thisWeekWinRate = thisWeekTrades.length > 0 
      ? (thisWeekWins / thisWeekTrades.length) * 100 
      : 0;
    const thisWeekTradesCount = thisWeekTrades.length;

    // Last week stats
    const lastWeekProfit = lastWeekTrades.reduce((sum, t) => sum + t.profitOrLoss, 0);
    const lastWeekWins = lastWeekTrades.filter(t => t.status === 'won').length;
    const lastWeekWinRate = lastWeekTrades.length > 0 
      ? (lastWeekWins / lastWeekTrades.length) * 100 
      : 0;
    const lastWeekTradesCount = lastWeekTrades.length;

    // Calculate profit/loss trend for last 30 days
    const trendData: { date: string; profit: number; cumulative: number }[] = [];
    const days = 30;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const dayTrades = completedTrades.filter(t => {
        const tradeDate = new Date(t.date);
        return tradeDate.toDateString() === date.toDateString();
      });
      
      const dayProfit = dayTrades.reduce((sum, t) => sum + t.profitOrLoss, 0);
      const previousCumulative = trendData.length > 0 ? trendData[trendData.length - 1].cumulative : 0;
      
      trendData.push({
        date: dateStr,
        profit: dayProfit,
        cumulative: previousCumulative + dayProfit
      });
    }

    // Find best session
    const sessionProfits = sessions.map(session => {
      const sessionTrades = completedTrades.filter(t => t.sessionId === session.id);
      const profit = sessionTrades.reduce((sum, t) => sum + t.profitOrLoss, 0);
      return { session, profit };
    });
    
    const bestSession = sessionProfits.length > 0
      ? sessionProfits.reduce((best, current) => 
          current.profit > best.profit ? current : best
        )
      : null;

    // Calculate current streak
    const sortedTrades = [...completedTrades].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    let currentStreak = 0;
    let streakType: 'win' | 'loss' | null = null;
    
    if (sortedTrades.length > 0) {
      streakType = sortedTrades[0].status === 'won' ? 'win' : 'loss';
      for (const trade of sortedTrades) {
        if ((streakType === 'win' && trade.status === 'won') || 
            (streakType === 'loss' && trade.status === 'lost')) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Calculate comparisons
    const profitChange = thisWeekProfit - lastWeekProfit;
    const profitChangePercent = lastWeekProfit !== 0 
      ? ((profitChange / Math.abs(lastWeekProfit)) * 100) 
      : (thisWeekProfit !== 0 ? 100 : 0);
    
    const winRateChange = thisWeekWinRate - lastWeekWinRate;
    const tradesChange = thisWeekTradesCount - lastWeekTradesCount;

    return {
      thisWeek: {
        profit: thisWeekProfit,
        winRate: thisWeekWinRate,
        tradesCount: thisWeekTradesCount
      },
      lastWeek: {
        profit: lastWeekProfit,
        winRate: lastWeekWinRate,
        tradesCount: lastWeekTradesCount
      },
      comparisons: {
        profitChange,
        profitChangePercent,
        winRateChange,
        tradesChange
      },
      trendData,
      bestSession: bestSession?.session || null,
      bestSessionProfit: bestSession?.profit || 0,
      currentStreak,
      streakType
    };
  }, [sessions, trades]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="card mb-6 sm:mb-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 xs:mb-4 sm:mb-6">
        <h2 className="text-base xs:text-lg sm:text-xl font-semibold text-gray-900 mb-1.5 xs:mb-2 sm:mb-0">
          Performance Overview
        </h2>
        <Link 
          href="/trades" 
          className="text-blue-600 hover:text-blue-700 text-xs xs:text-sm font-medium"
        >
          View Details →
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Profit/Loss Trend Chart */}
        <div className="lg:col-span-2">
          <div className="mb-3 xs:mb-4">
            <h3 className="text-xs xs:text-sm font-medium text-gray-700 mb-0.5 xs:mb-1">Profit/Loss Trend (Last 30 Days)</h3>
            <p className="text-[10px] xs:text-xs text-gray-500">Cumulative profit over time</p>
          </div>
          <div className="h-56 xs:h-64 sm:h-72 md:h-80 w-full overflow-x-auto">
            <ResponsiveContainer width="100%" height="100%" minHeight={224}>
              <AreaChart data={performanceData.trendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 9 }}
                  interval="preserveStartEnd"
                  angle={-45}
                  textAnchor="end"
                  height={50}
                  className="text-[9px]"
                  style={{ fontSize: '9px' }}
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  width={50}
                  tickFormatter={(value) => {
                    if (Math.abs(value) >= 1000) {
                      return `$${(value / 1000).toFixed(1)}k`;
                    }
                    return `$${value.toFixed(0)}`;
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    fontSize: '12px'
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ fontSize: '11px', marginBottom: '4px' }}
                />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#colorProfit)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Key Highlights */}
        <div className="space-y-3 xs:space-y-4">
          <div>
            <h3 className="text-xs xs:text-sm font-medium text-gray-700 mb-2 xs:mb-3">Key Highlights</h3>
            
            {/* This Week vs Last Week Comparison */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4 border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] xs:text-xs font-medium text-gray-600">This Week</span>
                <span className={`text-[10px] xs:text-xs font-semibold flex items-center ${
                  performanceData.comparisons.profitChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {performanceData.comparisons.profitChange >= 0 ? (
                    <ArrowUpRight className="w-2.5 h-2.5 xs:w-3 xs:h-3 mr-0.5 xs:mr-1" />
                  ) : (
                    <ArrowDownRight className="w-2.5 h-2.5 xs:w-3 xs:h-3 mr-0.5 xs:mr-1" />
                  )}
                  {Math.abs(performanceData.comparisons.profitChangePercent).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-baseline space-x-1 xs:space-x-2">
                <span className={`text-lg xs:text-xl sm:text-2xl font-bold break-words ${
                  performanceData.thisWeek.profit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(performanceData.thisWeek.profit)}
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-blue-200">
                <div className="flex justify-between text-[10px] xs:text-xs">
                  <span className="text-gray-600">Win Rate:</span>
                  <span className="font-semibold text-gray-900">
                    {performanceData.thisWeek.winRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-[10px] xs:text-xs mt-1">
                  <span className="text-gray-600">Trades:</span>
                  <span className="font-semibold text-gray-900">
                    {performanceData.thisWeek.tradesCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Best Session */}
            {performanceData.bestSession && (
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4 border border-yellow-100">
                <div className="flex items-center mb-2">
                  <Trophy className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-yellow-600 mr-1.5 xs:mr-2" />
                  <span className="text-[10px] xs:text-xs font-medium text-gray-700">Best Session</span>
                </div>
                <Link 
                  href={`/sessions/${performanceData.bestSession.id}`}
                  className="block hover:opacity-80 transition-opacity"
                >
                  <p className="font-semibold text-gray-900 text-xs xs:text-sm mb-1 truncate">
                    {performanceData.bestSession.name}
                  </p>
                  <p className={`text-base xs:text-lg font-bold break-words ${
                    performanceData.bestSessionProfit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(performanceData.bestSessionProfit)}
                  </p>
                </Link>
              </div>
            )}

            {/* Current Streak */}
            {performanceData.currentStreak > 0 && (
              <div className={`bg-gradient-to-br rounded-lg p-3 sm:p-4 border ${
                performanceData.streakType === 'win'
                  ? 'from-green-50 to-emerald-50 border-green-100'
                  : 'from-red-50 to-rose-50 border-red-100'
              }`}>
                <div className="flex items-center mb-2">
                  <Flame className={`w-3.5 h-3.5 xs:w-4 xs:h-4 mr-1.5 xs:mr-2 ${
                    performanceData.streakType === 'win' ? 'text-green-600' : 'text-red-600'
                  }`} />
                  <span className="text-[10px] xs:text-xs font-medium text-gray-700">Current Streak</span>
                </div>
                <div className="flex items-baseline space-x-1 xs:space-x-2">
                  <span className={`text-xl xs:text-2xl font-bold ${
                    performanceData.streakType === 'win' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {performanceData.currentStreak}
                  </span>
                  <span className="text-xs xs:text-sm text-gray-600">
                    {performanceData.streakType === 'win' ? 'Wins' : 'Losses'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 xs:gap-4 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
        <div className="text-center px-2">
          <div className="flex items-center justify-center mb-1.5 xs:mb-2">
            <BarChart3 className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-gray-400 mr-1.5 xs:mr-2" />
            <span className="text-[10px] xs:text-xs text-gray-600">Trades</span>
          </div>
          <div className="flex items-center justify-center flex-wrap gap-1">
            <span className="text-base xs:text-lg font-bold text-gray-900">
              {performanceData.thisWeek.tradesCount}
            </span>
            {performanceData.comparisons.tradesChange !== 0 && (
              <span className={`text-[10px] xs:text-xs ml-1 xs:ml-2 flex items-center ${
                performanceData.comparisons.tradesChange >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {performanceData.comparisons.tradesChange >= 0 ? (
                  <ArrowUpRight className="w-2.5 h-2.5 xs:w-3 xs:h-3" />
                ) : (
                  <ArrowDownRight className="w-2.5 h-2.5 xs:w-3 xs:h-3" />
                )}
                {Math.abs(performanceData.comparisons.tradesChange)}
              </span>
            )}
          </div>
          <p className="text-[10px] xs:text-xs text-gray-500 mt-1">vs last week</p>
        </div>

        <div className="text-center px-2">
          <div className="flex items-center justify-center mb-1.5 xs:mb-2">
            <Target className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-gray-400 mr-1.5 xs:mr-2" />
            <span className="text-[10px] xs:text-xs text-gray-600">Win Rate</span>
          </div>
          <div className="flex items-center justify-center flex-wrap gap-1">
            <span className="text-base xs:text-lg font-bold text-gray-900">
              {performanceData.thisWeek.winRate.toFixed(1)}%
            </span>
            {performanceData.comparisons.winRateChange !== 0 && (
              <span className={`text-[10px] xs:text-xs ml-1 xs:ml-2 flex items-center ${
                performanceData.comparisons.winRateChange >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {performanceData.comparisons.winRateChange >= 0 ? (
                  <ArrowUpRight className="w-2.5 h-2.5 xs:w-3 xs:h-3" />
                ) : (
                  <ArrowDownRight className="w-2.5 h-2.5 xs:w-3 xs:h-3" />
                )}
                {Math.abs(performanceData.comparisons.winRateChange).toFixed(1)}%
              </span>
            )}
          </div>
          <p className="text-[10px] xs:text-xs text-gray-500 mt-1">vs last week</p>
        </div>

        <div className="text-center px-2">
          <div className="flex items-center justify-center mb-1.5 xs:mb-2">
            <DollarSign className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-gray-400 mr-1.5 xs:mr-2" />
            <span className="text-[10px] xs:text-xs text-gray-600">Net Profit</span>
          </div>
          <div className="flex items-center justify-center">
            <span className={`text-base xs:text-lg font-bold break-words ${
              performanceData.thisWeek.profit >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(performanceData.thisWeek.profit)}
            </span>
          </div>
          <p className="text-[10px] xs:text-xs text-gray-500 mt-1">this week</p>
        </div>
      </div>
    </motion.div>
  );
};

