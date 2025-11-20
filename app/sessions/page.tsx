'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import { useTrade } from '../context/TradeContext';
import { useRouter } from 'next/navigation';
import { Header } from '../components/Header';
import { StatCard } from '../components/StatCard';
import { PageLoader } from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';
import { motion } from 'framer-motion';
import {
  Layers,
  Activity,
  CheckCircle2,
  BarChart3,
  Trash2,
  Plus,
  TrendingUp,
  DollarSign,
  Target
} from 'lucide-react';
import Link from 'next/link';

export default function SessionsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { sessions, deleteSession, getSessionStats } = useSession();
  const { getSessionTrades } = useTrade();
  const { showToast } = useToast();
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Commented out for development - skip authentication
  // useEffect(() => {
  //   if (!authLoading && !user) {
  //     router.push('/login');
  //   }
  // }, [user, authLoading, router]);

  const handleDeleteSession = async (sessionId: string, sessionName: string) => {
    if (!confirm(`Are you sure you want to delete session "${sessionName}"?`)) {
      return;
    }

    setIsDeleting(sessionId);
    const result = await deleteSession(sessionId);
    setIsDeleting(null);

    if (result.success) {
      showToast(result.message, 'success');
    } else {
      showToast(result.message, 'error');
    }
  };

  if (authLoading) {
    return <PageLoader />;
  }

  if (!user) {
    return null;
  }

  const stats = getSessionStats();

  // CORRECTED CALCULATION LOGIC - Using same formula as session detail page
  const calculateSessionMetrics = (session: any) => {
    // Get trades for this session from the TradeContext
    const trades = getSessionTrades(session.id);

    // Filter completed trades (those with won or lost status)
    const completedTrades = trades.filter((t: any) => t.status === 'won' || t.status === 'lost');

    // Calculate wins and losses
    const wins = completedTrades.filter((t: any) => t.status === 'won').length;
    const losses = completedTrades.filter((t: any) => t.status === 'lost').length;

    // Win Rate Calculation
    const winRate = completedTrades.length > 0
      ? (wins / completedTrades.length) * 100
      : 0;

    // Net Profit and Current Balance
    const netProfit = completedTrades.reduce((sum: number, trade: any) => sum + trade.profitOrLoss, 0);
    const currentBalance = session.capital + netProfit;

    // Progress tracking
    const targetTrades = session.totalTrades || 10;
    const progress = {
      completed: completedTrades.length,
      target: targetTrades,
      percentage: (completedTrades.length / targetTrades) * 100
    };

    // Required ITM (In-The-Money) - Breakeven win rate
    // Formula: 1 / (RR + 1)
    const rr = session.riskRewardRatio || 3;
    const requiredITM = (1 / (rr + 1)) * 100; // For 1:3 RR = 25%

    // Target ITM (usually slightly higher than required for profitability)
    const targetITM = session.accuracy || 30; // Use session's accuracy as target ITM

    // Calculate Target Profit using the SAME formula as session detail page
    const baseRisk = 0.06; // 6% base risk per trade for target calculation
    const fixedWinRate = 0.60; // Always use 60% benchmark for aspirational target
    const expectedWins = targetTrades * fixedWinRate;
    const expectedLosses = targetTrades * (1 - fixedWinRate);

    // Calculate target multiplier using geometric mean
    const winMultiplier = 1 + (rr * baseRisk);  // e.g., 1 + (3 × 0.06) = 1.18
    const lossMultiplier = 1 - baseRisk;  // e.g., 1 - 0.06 = 0.94

    const targetMultiplier = Math.pow(winMultiplier, expectedWins) * Math.pow(lossMultiplier, expectedLosses);

    const targetBalance = session.capital * targetMultiplier;
    const rawProfit = targetBalance - session.capital;
    const step = Math.max(Number((rr * 0.01).toFixed(2)), 0.01);
    const normalizedProfit = step > 0 ? Math.round(rawProfit / step) * step : rawProfit;
    const targetNetProfit = Number(normalizedProfit.toFixed(2));

    return {
      currentBalance,
      netProfit,
      winRate,
      wins,
      losses,
      progress,
      requiredITM,
      targetITM,
      targetBalance: session.capital + targetNetProfit,
      targetNetProfit, // This is the actual target profit to display
      completedTrades: completedTrades.length,
      riskRewardRatio: rr
    };
  };

  const calculateProgress = (session: any) => {
    const metrics = calculateSessionMetrics(session);
    return {
      itm: metrics.winRate.toFixed(1),
      trades: `${metrics.completedTrades}/${metrics.progress.target}`
    };
  };

  const calculateWinRate = (session: any) => {
    const metrics = calculateSessionMetrics(session);
    return metrics.winRate;
  };

  const calculateTargetProfit = (session: any) => {
    const metrics = calculateSessionMetrics(session);
    // Return the target net profit (same as session detail page)
    return metrics.targetNetProfit;
  };

  const calculateCurrentBalance = (session: any) => {
    const metrics = calculateSessionMetrics(session);
    return metrics.currentBalance;
  };

  const getNetProfit = (session: any) => {
    const metrics = calculateSessionMetrics(session);
    return metrics.netProfit;
  };

  // Check if session has achieved its target
  const checkIfTargetReached = (session: any) => {
    const trades = getSessionTrades(session.id);
    const completedTrades = trades.filter((t: any) => t.status === 'won' || t.status === 'lost');

    if (completedTrades.length === 0) return false;

    const wins = completedTrades.filter((t: any) => t.status === 'won').length;
    const requiredWins = Math.ceil(session.totalTrades * (session.accuracy / 100));

    const netProfit = completedTrades.reduce((sum: number, trade: any) => sum + trade.profitOrLoss, 0);
    const currentBalance = session.capital + netProfit;
    const metrics = calculateSessionMetrics(session);
    const targetBalance = session.capital + metrics.targetNetProfit;

    const hitTargetProfit = currentBalance >= targetBalance && completedTrades.length > 0;
    const hitTargetItm = requiredWins > 0 && wins >= requiredWins;

    return hitTargetProfit || hitTargetItm;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto py-4 px-3 sm:py-6 sm:px-4 lg:px-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
            <div className="mb-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">BBT FINANCE Sessions</h1>
              <p className="text-xs sm:text-sm lg:text-base text-gray-600 mt-1">Manage and track your trading sessions</p>
            </div>
            <Link
              href="/sessions/new"
              className="btn-primary flex items-center justify-center space-x-2 text-sm sm:text-base self-stretch sm:self-auto py-2.5 sm:py-2"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>New Session</span>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            <StatCard
              title="Total Sessions"
              value={stats.total}
              icon={Layers}
              color="blue"
              subtitle=""
            />
            <StatCard
              title="Active Sessions"
              value={stats.active}
              icon={Activity}
              color="green"
              subtitle=""
            />
            <StatCard
              title="Completed Sessions"
              value={stats.completed}
              icon={CheckCircle2}
              color="purple"
              subtitle=""
            />
          </div>
        </motion.div>

        {/* Sessions List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Sessions</h2>

          {sessions.length === 0 ? (
            <div className="card text-center py-8 sm:py-12 px-4">
              <Layers className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No sessions yet</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Create your first trading session to get started</p>
              <Link href="/sessions/new" className="btn-primary inline-flex items-center justify-center space-x-2 text-sm sm:text-base px-4 py-2">
                <Plus className="w-4 h-4" />
                <span>Create Session</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
              {sessions
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((session, index) => {
                const progress = calculateProgress(session);
                const targetProfit = calculateTargetProfit(session);
                const currentBalance = calculateCurrentBalance(session);
                const netProfit = getNetProfit(session);
                const metrics = calculateSessionMetrics(session);
                const isTargetReached = checkIfTargetReached(session);

                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className={`relative overflow-hidden cursor-pointer group active:scale-[0.98] transition-all duration-300 rounded-lg sm:rounded-xl ${
                      isTargetReached
                        ? 'bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-50 border-2 border-amber-300 hover:border-amber-400 shadow-lg hover:shadow-2xl shadow-amber-200/50'
                        : 'bg-white border border-gray-200 hover:border-blue-300 hover:shadow-xl'
                    }`}
                    onClick={() => router.push(`/sessions/${session.id}`)}
                  >
                    {/* Status Indicator Bar */}
                    <div className={`absolute top-0 left-0 right-0 h-1 ${
                      isTargetReached
                        ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400'
                        : session.status === 'active'
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                          : 'bg-gray-300'
                    }`}></div>

                    {/* Golden Shimmer Effect for Target Reached */}
                    {isTargetReached && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-200/30 to-transparent animate-shimmer pointer-events-none"></div>
                    )}

                    <div className="p-4 sm:p-5 lg:p-6">
                      {/* Header Section */}
                      <div className="flex items-start justify-between mb-3 sm:mb-4">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                            isTargetReached
                              ? 'bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-500 ring-2 ring-amber-300 ring-offset-2'
                              : session.status === 'active'
                                ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                                : 'bg-gray-400'
                          }`}>
                            {isTargetReached ? (
                              <Target className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            ) : (
                              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className={`text-base sm:text-lg font-bold mb-1 truncate ${
                              isTargetReached ? 'text-amber-900' : 'text-gray-900'
                            }`}>{session.name}</h3>
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                              {isTargetReached && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-sm">
                                  🎯 Target Achieved
                                </span>
                              )}
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                session.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {session.status === 'active' ? 'Active' : 'Completed'}
                              </span>
                              <span className="text-[10px] sm:text-xs text-gray-500 truncate">
                                {new Date(session.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSession(session.id, session.name);
                          }}
                          disabled={isDeleting === session.id}
                          className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Progress Section - PROMINENT */}
                      <div className="mb-4 sm:mb-5 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-3 sm:p-4 border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs sm:text-sm font-semibold text-gray-700">Trade Progress</span>
                          <span className="text-base sm:text-lg font-bold text-blue-600">{metrics.completedTrades}/{metrics.progress.target}</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="relative w-full bg-gray-200 rounded-full h-2.5 sm:h-3 overflow-hidden shadow-inner mb-2">
                          <div
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500 ease-out shadow-sm"
                            style={{
                              width: `${Math.min(100, metrics.progress.percentage)}%`,
                            }}
                          >
                            <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-[10px] sm:text-xs text-gray-600 font-medium">
                            {metrics.progress.percentage.toFixed(1)}% Complete
                          </span>
                          <span className="text-[10px] sm:text-xs font-medium text-gray-700">
                            Win Rate: {progress.itm}%
                          </span>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <div className="bg-gray-50 rounded-lg p-2.5 sm:p-3 border border-gray-100">
                          <p className="text-[10px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">Win Rate</p>
                          <p className="text-base sm:text-lg font-bold text-gray-900">{progress.itm}%</p>
                          <p className="text-[10px] sm:text-xs text-gray-500">Target: {metrics.targetITM.toFixed(1)}%</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2.5 sm:p-3 border border-gray-100">
                          <p className="text-[10px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">W/L Ratio</p>
                          <p className="text-base sm:text-lg font-bold text-gray-900">{metrics.wins}/{metrics.losses}</p>
                          <p className="text-[10px] sm:text-xs text-gray-500">RR: 1:{metrics.riskRewardRatio}</p>
                        </div>
                      </div>

                      {/* Financial Metrics */}
                      <div className="pt-3 sm:pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-2 sm:mb-3">
                          <div>
                            <p className="text-[10px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">Current Balance</p>
                            <p className="text-lg sm:text-xl font-bold text-gray-900">
                              ${currentBalance.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">Net P/L</p>
                            <p className={`text-lg sm:text-xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {netProfit >= 0 ? '+' : ''}${netProfit.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        <div className="bg-blue-50 rounded-lg p-2.5 sm:p-3 border border-blue-100">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] sm:text-xs text-blue-700 font-medium">Target Net Profit</span>
                            <span className="text-sm sm:text-base font-bold text-blue-600">
                              ${targetProfit.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Hover Effect Overlay */}
                    <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none"></div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}