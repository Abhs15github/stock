'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import { useRouter } from 'next/navigation';
import { Header } from '../components/Header';
import { StatCard } from '../components/StatCard';
import { LoadingSpinner, PageLoader } from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';
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
  Trash2
} from 'lucide-react';
import { TradingSession } from '../types';

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { sessions, getSessionStats, updateSession, deleteSession } = useSession();
  const { showToast } = useToast();
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
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

  const stats = getSessionStats();

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
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user.name}!
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Track your trading performance and manage your sessions.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
              title="Total Sessions"
              value={stats.total}
              icon={BarChart3}
              color="blue"
              subtitle="All time"
            />
            <StatCard
              title="Active Sessions"
              value={stats.active}
              icon={TrendingUp}
              color="orange"
              subtitle="Currently running"
            />
            <StatCard
              title="Completed Sessions"
              value={stats.completed}
              icon={CheckCircle}
              color="green"
              subtitle="Finished"
            />
          </div>

          {/* Sessions Section */}
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Your Sessions</h2>
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
                        Trades
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Accuracy
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        R:R Ratio
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
                    {sessions.map((session) => (
                      <tr key={session.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{session.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                            <span className="text-gray-900">{formatCurrency(session.capital)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Target className="w-4 h-4 text-gray-400 mr-1" />
                            <span className="text-gray-900">{session.totalTrades}</span>
                          </div>
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
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          1:{session.riskRewardRatio}
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                            <span className="text-gray-500 text-sm">{formatDate(session.createdAt)}</span>
                          </div>
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
              </div>
            )}
          </div>
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
    </div>
  );
}

// Create Session Modal Component
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
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
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
      </div>
    </div>
  );
};