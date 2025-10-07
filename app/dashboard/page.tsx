'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import { useTrade } from '../context/TradeContext';
import { useRouter } from 'next/navigation';
import { Header } from '../components/Header';
import { StatCard } from '../components/StatCard';
import { MarketChart } from '../components/MarketChart';
import { BBTCalculationsWidget } from '../components/BBTCalculationsWidget';
import { LoadingSpinner, PageLoader } from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  CheckCircle,
  Plus,
  Calendar,
  DollarSign,
  Target,
  MoreVertical,
  Edit,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Wallet,
  PieChart
} from 'lucide-react';
import { TradingSession } from '../types';

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { sessions, getSessionStats, updateSession, deleteSession } = useSession();
  const { trades, getTradeStats } = useTrade();
  const { showToast } = useToast();
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTradeTracker, setShowTradeTracker] = useState(false);
  const [selectedSession, setSelectedSession] = useState<TradingSession | null>(null);
  const [showDropdown, setShowDropdown] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return <PageLoader />;
  }

  if (!user) {
    return null;
  }

  const sessionStats = getSessionStats();
  const tradeStats = getTradeStats();

  const handleToggleStatus = async (session: TradingSession) => {
    const newStatus = session.status === 'active' ? 'completed' : 'active';

    try {
      const result = await updateSession(session.id, { status: newStatus });
      if (result.success) {
        showToast(`Session marked as ${newStatus}`, 'success');
      } else {
        showToast(result.message, 'error');
      }
    } catch (error) {
      showToast('Failed to update session status', 'error');
    }
    setShowDropdown(null);
  };

  const handleDeleteSession = async (session: TradingSession) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      try {
        const result = await deleteSession(session.id);
        if (result.success) {
          showToast('Session deleted successfully', 'success');
        } else {
          showToast(result.message, 'error');
        }
      } catch (error) {
        showToast('Failed to delete session', 'error');
      }
    }
    setShowDropdown(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user.name}! 👋
            </h1>
            <p className="mt-2 text-gray-600">
              Track your trading performance, manage sessions, and access BBT analytics.
            </p>
          </motion.div>

          {/* Enhanced Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <StatCard
              title="Total Trades"
              value={tradeStats.totalTrades}
              icon={BarChart3}
              color="blue"
              subtitle="All time trades"
            />
            <StatCard
              title="Profit/Loss"
              value={Math.round(tradeStats.profitPercentage)}
              icon={tradeStats.profitPercentage >= 0 ? ArrowUpRight : ArrowDownRight}
              color={tradeStats.profitPercentage >= 0 ? "green" : "red"}
              subtitle={`${tradeStats.profitPercentage >= 0 ? '+' : ''}${tradeStats.profitPercentage.toFixed(1)}%`}
            />
            <StatCard
              title="Active Investment"
              value={Math.round(tradeStats.activeInvestment)}
              icon={Wallet}
              color="purple"
              subtitle={formatCurrency(tradeStats.activeInvestment)}
            />
            <StatCard
              title="Active Sessions"
              value={sessionStats.active}
              icon={Activity}
              color="orange"
              subtitle="Currently running"
            />
          </motion.div>

          {/* Analytics and Market Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Market Chart */}
            <div className="lg:col-span-2">
              <MarketChart />
            </div>

            {/* BBT Calculations Widget */}
            <div>
              <BBTCalculationsWidget />
            </div>
          </div>

          {/* Trade Tracker and Sessions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="card"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowTradeTracker(true)}
                  className="w-full flex items-center justify-between p-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Add New Trade</p>
                      <p className="text-sm text-gray-600">Track your latest trading activity</p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-primary-600" />
                </button>

                <button
                  onClick={() => setShowCreateModal(true)}
                  className="w-full flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                      <Plus className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">New Session</p>
                      <p className="text-sm text-gray-600">Create a trading session</p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-green-600" />
                </button>
              </div>
            </motion.div>

            {/* Session Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="card"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Overview</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <PieChart className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-gray-700">Total Sessions</span>
                  </div>
                  <span className="font-semibold text-gray-900">{sessionStats.total}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Activity className="w-4 h-4 text-orange-600" />
                    </div>
                    <span className="text-gray-700">Active</span>
                  </div>
                  <span className="font-semibold text-orange-600">{sessionStats.active}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-gray-700">Completed</span>
                  </div>
                  <span className="font-semibold text-green-600">{sessionStats.completed}</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Recent Sessions Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="card"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Recent Sessions</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Session</span>
              </button>
            </div>

            {sessions.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions yet</h3>
                <p className="text-gray-600 mb-4">
                  Create your first trading session to start tracking your performance.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary"
                >
                  Create Session
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Session
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Capital
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Accuracy
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sessions.slice(0, 5).map((session) => (
                      <tr key={session.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{session.name}</div>
                          <div className="text-sm text-gray-500">{session.totalTrades} trades</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-gray-900">{formatCurrency(session.capital)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            session.accuracy >= 70
                              ? 'bg-green-100 text-green-800'
                              : session.accuracy >= 50
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {session.accuracy}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            session.status === 'active'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {session.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(session.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="relative">
                            <button
                              onClick={() => setShowDropdown(showDropdown === session.id ? null : session.id)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {showDropdown === session.id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                                <div className="py-1">
                                  <button
                                    onClick={() => handleToggleStatus(session)}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Mark as {session.status === 'active' ? 'Completed' : 'Active'}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSession(session)}
                                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Session
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {sessions.length > 5 && (
                  <div className="mt-4 text-center">
                    <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                      View All Sessions ({sessions.length})
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </main>

      {/* Create Session Modal */}
      {showCreateModal && (
        <CreateSessionModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            showToast('Session created successfully!', 'success');
          }}
        />
      )}

      {/* Trade Tracker Modal */}
      {showTradeTracker && (
        <TradeTrackerModal
          onClose={() => setShowTradeTracker(false)}
          onSuccess={() => {
            setShowTradeTracker(false);
            showToast('Trade added successfully!', 'success');
          }}
        />
      )}
    </div>
  );
}

// Create Session Modal Component (keeping existing implementation)
const CreateSessionModal: React.FC<{
  onClose: () => void;
  onSuccess: () => void;
}> = ({ onClose, onSuccess }) => {
  const { createSession } = useSession();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    capital: '',
    totalTrades: '',
    accuracy: '',
    riskRewardRatio: '',
    status: 'active' as 'active' | 'completed',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const sessionData = {
        name: formData.name,
        capital: parseFloat(formData.capital),
        totalTrades: parseInt(formData.totalTrades),
        accuracy: parseFloat(formData.accuracy),
        riskRewardRatio: parseFloat(formData.riskRewardRatio),
        status: formData.status,
      };

      const result = await createSession(sessionData);

      if (result.success) {
        onSuccess();
      } else {
        showToast(result.message, 'error');
      }
    } catch (error) {
      showToast('Failed to create session', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto"
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Session</h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Session Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="input-field"
                placeholder="e.g., Morning Scalp Session"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="capital" className="block text-sm font-medium text-gray-700 mb-1">
                Starting Capital ($)
              </label>
              <input
                type="number"
                id="capital"
                name="capital"
                required
                min="0"
                step="0.01"
                className="input-field"
                placeholder="10000"
                value={formData.capital}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="totalTrades" className="block text-sm font-medium text-gray-700 mb-1">
                Total Trades
              </label>
              <input
                type="number"
                id="totalTrades"
                name="totalTrades"
                required
                min="1"
                className="input-field"
                placeholder="50"
                value={formData.totalTrades}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="accuracy" className="block text-sm font-medium text-gray-700 mb-1">
                Accuracy (%)
              </label>
              <input
                type="number"
                id="accuracy"
                name="accuracy"
                required
                min="0"
                max="100"
                step="0.1"
                className="input-field"
                placeholder="65.5"
                value={formData.accuracy}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="riskRewardRatio" className="block text-sm font-medium text-gray-700 mb-1">
                Risk-Reward Ratio (1:X)
              </label>
              <input
                type="number"
                id="riskRewardRatio"
                name="riskRewardRatio"
                required
                min="0"
                step="0.1"
                className="input-field"
                placeholder="2.5"
                value={formData.riskRewardRatio}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                className="input-field"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex-1 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : null}
                {isSubmitting ? 'Creating...' : 'Create Session'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

// Trade Tracker Modal Component
const TradeTrackerModal: React.FC<{
  onClose: () => void;
  onSuccess: () => void;
}> = ({ onClose, onSuccess }) => {
  const { addTrade } = useTrade();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    pairName: '',
    entryPrice: '',
    exitPrice: '',
    investment: '',
    date: new Date().toISOString().split('T')[0],
    type: 'buy' as 'buy' | 'sell',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const tradeData = {
        pairName: formData.pairName,
        entryPrice: parseFloat(formData.entryPrice),
        exitPrice: parseFloat(formData.exitPrice),
        investment: parseFloat(formData.investment),
        date: formData.date,
        type: formData.type,
      };

      const result = await addTrade(tradeData);

      if (result.success) {
        onSuccess();
      } else {
        showToast(result.message, 'error');
      }
    } catch (error) {
      showToast('Failed to add trade', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Calculate profit/loss preview
  const calculatePreview = () => {
    const entry = parseFloat(formData.entryPrice) || 0;
    const exit = parseFloat(formData.exitPrice) || 0;
    const investment = parseFloat(formData.investment) || 0;

    if (entry > 0 && exit > 0 && investment > 0) {
      let profit: number;
      if (formData.type === 'buy') {
        profit = ((exit - entry) / entry) * investment;
      } else {
        profit = ((entry - exit) / entry) * investment;
      }

      const percentage = (profit / investment) * 100;
      return { profit, percentage };
    }

    return { profit: 0, percentage: 0 };
  };

  const preview = calculatePreview();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto"
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Trade</h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="pairName" className="block text-sm font-medium text-gray-700 mb-1">
                Trading Pair
              </label>
              <input
                type="text"
                id="pairName"
                name="pairName"
                required
                className="input-field"
                placeholder="e.g., BTC/USDT"
                value={formData.pairName}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Trade Type
              </label>
              <select
                id="type"
                name="type"
                className="input-field"
                value={formData.type}
                onChange={handleChange}
              >
                <option value="buy">Buy (Long)</option>
                <option value="sell">Sell (Short)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="entryPrice" className="block text-sm font-medium text-gray-700 mb-1">
                  Entry Price ($)
                </label>
                <input
                  type="number"
                  id="entryPrice"
                  name="entryPrice"
                  required
                  min="0"
                  step="0.00001"
                  className="input-field"
                  placeholder="0.0000"
                  value={formData.entryPrice}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="exitPrice" className="block text-sm font-medium text-gray-700 mb-1">
                  Exit Price ($)
                </label>
                <input
                  type="number"
                  id="exitPrice"
                  name="exitPrice"
                  required
                  min="0"
                  step="0.00001"
                  className="input-field"
                  placeholder="0.0000"
                  value={formData.exitPrice}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="investment" className="block text-sm font-medium text-gray-700 mb-1">
                Investment Amount ($)
              </label>
              <input
                type="number"
                id="investment"
                name="investment"
                required
                min="0"
                step="0.01"
                className="input-field"
                placeholder="1000.00"
                value={formData.investment}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Trade Date
              </label>
              <input
                type="date"
                id="date"
                name="date"
                required
                className="input-field"
                value={formData.date}
                onChange={handleChange}
              />
            </div>

            {/* Profit/Loss Preview */}
            {(formData.entryPrice && formData.exitPrice && formData.investment) && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">Profit/Loss Preview:</p>
                <p className={`text-lg font-bold ${preview.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {preview.profit >= 0 ? '+' : ''}${preview.profit.toFixed(2)} ({preview.percentage >= 0 ? '+' : ''}{preview.percentage.toFixed(2)}%)
                </p>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex-1 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : null}
                {isSubmitting ? 'Adding...' : 'Add Trade'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};