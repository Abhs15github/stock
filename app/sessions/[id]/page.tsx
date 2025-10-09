'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSession } from '../../context/SessionContext';
import { useTrade } from '../../context/TradeContext';
import { useRouter, useParams } from 'next/navigation';
import { Header } from '../../components/Header';
import { StatCard } from '../../components/StatCard';
import { PageLoader } from '../../components/LoadingSpinner';
import { useToast } from '../../components/Toast';
import { AddPendingTradeModal } from '../../components/AddPendingTradeModal';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Target,
  Activity,
  AlertCircle,
  BarChart3,
  Settings,
  ChevronDown,
  CheckCircle,
  XCircle,
  Calculator,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { TradingSession } from '../../types';

export default function SessionDetailPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { sessions } = useSession();
  const { trades, getSessionTrades, recordTradeResult } = useTrade();
  const { showToast } = useToast();
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<TradingSession | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'trades' | 'analytics'>('dashboard');
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const [showAddTradeModal, setShowAddTradeModal] = useState(false);
  const [recordingTrade, setRecordingTrade] = useState<string | null>(null);
  const [sessionTrades, setSessionTrades] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (sessions && sessionId) {
      const foundSession = sessions.find(s => s.id === sessionId);
      if (foundSession) {
        setSession(foundSession);
      } else {
        showToast('Session not found', 'error');
        router.push('/sessions');
      }
    }
  }, [sessions, sessionId, router, showToast]);

  useEffect(() => {
    if (session) {
      const sessionTradesList = getSessionTrades(session.id);
      setSessionTrades(sessionTradesList);
    }
  }, [session, trades, getSessionTrades]);

  const handleRecordResult = async (tradeId: string, result: 'won' | 'lost') => {
    if (!session) return;

    setRecordingTrade(tradeId);
    const response = await recordTradeResult(tradeId, result, session.riskRewardRatio);
    setRecordingTrade(null);

    if (response.success) {
      showToast(response.message, 'success');
    } else {
      showToast(response.message, 'error');
    }
  };

  if (authLoading || !session) {
    return <PageLoader />;
  }

  if (!user) {
    return null;
  }

  // Calculate session metrics
  const calculateSessionBalance = () => {
    let balance = session.capital;
    const completedTrades = sessionTrades.filter(t => t.status !== 'pending');

    completedTrades.forEach(trade => {
      balance += trade.profitOrLoss;
    });

    return balance;
  };

  const calculateNetProfit = () => {
    const completedTrades = sessionTrades.filter(t => t.status !== 'pending');
    return completedTrades.reduce((sum, trade) => sum + trade.profitOrLoss, 0);
  };

  const calculateWinRate = () => {
    const completedTrades = sessionTrades.filter(t => t.status !== 'pending');
    if (completedTrades.length === 0) return 0;

    const wins = completedTrades.filter(t => t.status === 'won').length;
    return (wins / completedTrades.length) * 100;
  };

  const calculateProgress = () => {
    const completedTrades = sessionTrades.filter(t => t.status !== 'pending').length;
    const total = session.totalTrades;
    const percentage = total > 0 ? (completedTrades / total) * 100 : 0;

    return {
      completed: completedTrades,
      total,
      percentage: percentage.toFixed(0)
    };
  };

  const calculateTargetProfit = () => {
    const winRate = session.accuracy / 100;
    const avgWin = session.capital * 0.02 * session.riskRewardRatio;
    const avgLoss = session.capital * 0.02;
    const expectedValue = (winRate * avgWin) - ((1 - winRate) * avgLoss);
    return expectedValue * session.totalTrades;
  };

  const calculateMinTotalBalance = () => {
    const targetProfit = calculateTargetProfit();
    return session.capital + targetProfit;
  };

  const currentBalance = calculateSessionBalance();
  const netProfit = calculateNetProfit();
  const winRate = calculateWinRate();
  const progress = calculateProgress();
  const targetProfit = calculateTargetProfit();
  const minTotalBalance = calculateMinTotalBalance();

  // Get pending trades - SHOW ONLY THE FIRST ONE (oldest)
  const allPendingTrades = sessionTrades.filter(t => t.status === 'pending').sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const pendingTrades = allPendingTrades.length > 0 ? [allPendingTrades[0]] : []; // Only show first pending trade
  const completedTrades = sessionTrades.filter(t => t.status !== 'pending').reverse(); // Most recent first

  const tools = [
    { name: 'Forex Position Size Calculator', href: '/calculators' },
    { name: 'Crypto Position Size Calculator', href: '/calculators' },
    { name: 'Stock Position Size Calculator', href: '/calculators' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Link
                href="/sessions"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{session.name}</h1>
                <div className="flex items-center space-x-3 mt-1">
                  <p className="text-gray-600">
                    Created {new Date(session.createdAt).toLocaleDateString()}
                  </p>
                  <span className="text-gray-400">•</span>
                  <span
                    className={`px-3 py-1 text-sm rounded-full ${
                      session.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {session.status === 'active' ? 'Active' : 'Completed'}
                  </span>
                </div>
              </div>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowToolsDropdown(!showToolsDropdown)}
                className="btn-secondary flex items-center space-x-2"
              >
                <Calculator className="w-4 h-4" />
                <span>Tools</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showToolsDropdown ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showToolsDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10"
                  >
                    {tools.map((tool, index) => (
                      <Link
                        key={index}
                        href={tool.href}
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 transition-colors"
                        onClick={() => setShowToolsDropdown(false)}
                      >
                        <Calculator className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">{tool.name}</span>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Alert for pending trades */}
          {allPendingTrades.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-orange-900">Action Required: Pending Trade Results</p>
                <p className="text-sm text-orange-800 mt-1">
                  {allPendingTrades.length} trade(s) are waiting for results. Please record outcomes.
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6"
        >
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'dashboard'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('trades')}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'trades'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Trade List
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'analytics'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Analytics
              </button>
            </nav>
          </div>
        </motion.div>

        {/* Dashboard Tab Content */}
        {activeTab === 'dashboard' && (
          <>
            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            >
              <StatCard
                title="CURRENT BALANCE"
                value={currentBalance.toFixed(2)}
                icon={DollarSign}
                color="blue"
                subtitle=""
              />
              <StatCard
                title="NET PROFIT"
                value={netProfit.toFixed(2)}
                icon={TrendingUp}
                color={netProfit >= 0 ? "green" : "red"}
                subtitle=""
              />
              <StatCard
                title="WIN RATE"
                value={`${winRate.toFixed(1)}%`}
                icon={Target}
                color="orange"
                subtitle={`Target: ${session.accuracy.toFixed(0)}%`}
              />
              <StatCard
                title="PROGRESS"
                value={`${progress.completed}/${progress.total}`}
                icon={Activity}
                color="purple"
                subtitle={`${progress.percentage}% complete`}
              />
            </motion.div>

            {/* Progress and Strategy Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Progress to Goal */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="card"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Progress to Goal</h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Min. Total Balance</span>
                    <span className="font-semibold">${minTotalBalance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Min. Total Return</span>
                    <span className="font-semibold">${targetProfit.toFixed(2)}</span>
                  </div>
                </div>

                <div className="my-8 text-center">
                  <div className="text-sm font-medium text-blue-600 mb-2">TARGET NET PROFIT</div>
                  <div className="text-4xl font-bold text-blue-600">${targetProfit.toFixed(2)}</div>
                </div>
              </motion.div>

              {/* Strategy Configuration */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="card"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Strategy Configuration</h3>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Initial Balance</span>
                    </div>
                    <p className="text-2xl font-bold">${session.capital.toFixed(2)}</p>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">RR (Risk Reward)</span>
                    </div>
                    <p className="text-2xl font-bold">{session.riskRewardRatio}:1</p>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Target Trades</span>
                    </div>
                    <p className="text-2xl font-bold">{session.totalTrades}</p>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Required ITM</span>
                    </div>
                    <p className="text-2xl font-bold">{session.accuracy.toFixed(0)}%</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}

        {/* Trade List Tab Content */}
        {activeTab === 'trades' && (
          <div className="space-y-6">
            {/* Pending Trades Section */}
            {pendingTrades.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-yellow-50 border border-yellow-200 rounded-lg p-6"
              >
                <div className="flex items-center space-x-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <h3 className="text-lg font-semibold text-yellow-900">
                    Record Trade Results ({allPendingTrades.length} pending)
                  </h3>
                </div>
                <p className="text-sm text-yellow-800 mb-4">Update the outcome for each pending trade to continue.</p>

                {pendingTrades.map((trade) => (
                  <div key={trade.id} className="bg-white rounded-lg p-4 mb-3 last:mb-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Risk</p>
                        <p className="text-xl font-bold">${trade.investment.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Potential Return</p>
                        <p className="text-xl font-bold text-green-600">
                          +${(trade.investment * session.riskRewardRatio).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleRecordResult(trade.id, 'won')}
                          disabled={recordingTrade === trade.id}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>WON</span>
                        </button>
                        <button
                          onClick={() => handleRecordResult(trade.id, 'lost')}
                          disabled={recordingTrade === trade.id}
                          className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>LOST</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Complete Trading History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Complete Trading History</h3>
                <button
                  onClick={() => setShowAddTradeModal(true)}
                  className="btn-primary flex items-center space-x-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Trade</span>
                </button>
              </div>

              {sessionTrades.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No trades yet</h4>
                  <p className="text-gray-600 mb-6">Start logging trades for this session</p>
                  <Link href="/trades" className="btn-primary inline-flex items-center">
                    Log First Trade
                  </Link>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Trade #</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Result</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Stake</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Return</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessionTrades.map((trade, index) => {
                          // Calculate running balance
                          let runningBalance = session.capital;
                          for (let i = sessionTrades.length - 1; i > sessionTrades.length - 1 - index; i--) {
                            if (sessionTrades[i].status !== 'pending') {
                              runningBalance += sessionTrades[i].profitOrLoss;
                            }
                          }

                          return (
                            <tr key={trade.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4 text-sm font-medium">#{sessionTrades.length - index}</td>
                              <td className="py-3 px-4">
                                {trade.status === 'pending' ? (
                                  <span className="px-3 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">
                                    Pending
                                  </span>
                                ) : trade.status === 'won' ? (
                                  <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-bold text-green-700">W</span>
                                  </div>
                                ) : (
                                  <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-bold text-red-700">L</span>
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-4 text-sm">${trade.investment.toFixed(2)}</td>
                              <td className="py-3 px-4">
                                {trade.status === 'pending' ? (
                                  <span className="text-sm text-gray-500">Pending</span>
                                ) : (
                                  <span className={`text-sm font-medium ${
                                    trade.profitOrLoss >= 0 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {trade.profitOrLoss >= 0 ? '+' : ''}${trade.profitOrLoss.toFixed(2)}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-sm font-medium">
                                ${runningBalance.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                    <span>Rows per page: 10</span>
                    <span>1-{sessionTrades.length} of {sessionTrades.length}</span>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}

        {/* Analytics Tab Content */}
        {activeTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="card"
          >
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Analytics Coming Soon</h4>
              <p className="text-gray-600">
                Detailed analytics and insights for your trading session will be available soon
              </p>
            </div>
          </motion.div>
        )}
      </main>

      {/* Add Pending Trade Modal */}
      <AddPendingTradeModal
        sessionId={sessionId}
        isOpen={showAddTradeModal}
        onClose={() => setShowAddTradeModal(false)}
      />
    </div>
  );
}
