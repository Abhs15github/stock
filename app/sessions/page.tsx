'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
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

  // CORRECTED CALCULATION LOGIC
  const calculateSessionMetrics = (session: any) => {
    // Get trades array (assuming it exists in session object)
    const trades = session.trades || [];
    
    // Filter completed trades (those with W or L result)
    const completedTrades = trades.filter((t: any) => t.result === 'W' || t.result === 'L');
    
    // Calculate wins and losses
    const wins = completedTrades.filter((t: any) => t.result === 'W').length;
    const losses = completedTrades.filter((t: any) => t.result === 'L').length;
    
    // Win Rate Calculation
    const winRate = completedTrades.length > 0 
      ? (wins / completedTrades.length) * 100 
      : 0;
    
    // Current Balance (from last trade or initial capital)
    const currentBalance = trades.length > 0 && trades[trades.length - 1].balance
      ? trades[trades.length - 1].balance 
      : session.capital;
    
    // Net Profit
    const netProfit = currentBalance - session.capital;
    
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
    const targetITM = session.targetITM || requiredITM + 5; // e.g., 30% for 1:3 RR
    
    // Calculate theoretical target profit based on expected value
    // If all target trades are completed with current win rate
    const riskPercentage = session.riskPercentage || 0.02; // 2% default
    const avgStakeIfStarted = session.capital * riskPercentage;
    
    // Expected value per trade
    const avgWin = avgStakeIfStarted * rr;
    const avgLoss = avgStakeIfStarted;
    const expectedValuePerTrade = (winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss;
    
    // Target profit if all trades completed
    const projectedTotalProfit = expectedValuePerTrade * targetTrades;
    const targetBalance = session.capital + projectedTotalProfit;
    
    return {
      currentBalance,
      netProfit,
      winRate,
      wins,
      losses,
      progress,
      requiredITM,
      targetITM,
      targetBalance,
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
    // Return the profit amount, not the balance
    return metrics.targetBalance - session.capital;
  };

  const calculateCurrentBalance = (session: any) => {
    const metrics = calculateSessionMetrics(session);
    return metrics.currentBalance;
  };

  const getNetProfit = (session: any) => {
    const metrics = calculateSessionMetrics(session);
    return metrics.netProfit;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4">
            <div className="mb-2 sm:mb-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">BBT Trade Sessions</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Manage and track your trading sessions</p>
            </div>
            <Link
              href="/sessions/new"
              className="btn-primary flex items-center space-x-2 text-sm sm:text-base self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>New Session</span>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
            <div className="card text-center py-12">
              <Layers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions yet</h3>
              <p className="text-gray-600 mb-6">Create your first trading session to get started</p>
              <Link href="/sessions/new" className="btn-primary inline-flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Create Session</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {sessions
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((session, index) => {
                const progress = calculateProgress(session);
                const winRate = calculateWinRate(session);
                const targetProfit = calculateTargetProfit(session);
                const currentBalance = calculateCurrentBalance(session);
                const netProfit = getNetProfit(session);
                const metrics = calculateSessionMetrics(session);

                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="card hover:shadow-lg transition-shadow cursor-pointer relative"
                    onClick={() => router.push(`/sessions/${session.id}`)}
                  >
                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(session.id, session.name);
                      }}
                      disabled={isDeleting === session.id}
                      className="absolute top-4 right-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors z-10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Session Header */}
                    <div className="flex items-start sm:items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <h3 className="font-semibold text-gray-900 truncate">{session.name}</h3>
                        <span
                          className={`inline-block px-2 py-1 text-xs rounded-full ${
                            session.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {session.status === 'active' ? 'Active' : 'Completed'}
                        </span>
                      </div>
                    </div>

                    {/* Session Info */}
                    <div className="space-y-4 mb-4">
                      <div className="text-sm text-gray-600">
                        Created {new Date(session.createdAt).toLocaleDateString()}
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center justify-between sm:block">
                          <div>
                            <p className="text-xs text-gray-600">Win Rate</p>
                            <p className="text-sm font-medium">{progress.itm}%</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:block">
                          <div className="text-right sm:text-left">
                            <p className="text-xs text-gray-600">Progress</p>
                            <p className="text-sm font-medium">{progress.trades}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm">
                        <div className="flex items-center justify-between sm:block">
                          <span className="text-gray-600">W/L: {metrics.wins}/{metrics.losses}</span>
                        </div>
                        <div className="flex items-center justify-between sm:block">
                          <span className="text-gray-600 sm:text-right">RR: 1:{metrics.riskRewardRatio}</span>
                        </div>
                      </div>
                    </div>

                    {/* Session Metrics */}
                    <div className="space-y-3 pt-4 border-t border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-xs text-gray-600">Current Balance</p>
                          <p className="text-lg font-bold text-gray-900">
                            ${currentBalance.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex-1 text-left sm:text-right">
                          <p className="text-xs text-gray-600">Net P/L</p>
                          <p className={`text-lg font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {netProfit >= 0 ? '+' : ''}${netProfit.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-600">Projected Profit</p>
                        <p className="text-sm font-semibold text-blue-600">
                          ${targetProfit.toFixed(2)}
                        </p>
                      </div>
                    </div>
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