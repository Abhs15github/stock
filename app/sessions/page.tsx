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

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

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

  const calculateProgress = (session: any) => {
    // Calculate ITM progress based on accuracy
    const itmProgress = session.accuracy || 0;
    return {
      itm: itmProgress.toFixed(1),
      trades: `${Math.floor((session.totalTrades * session.accuracy) / 100)}/${session.totalTrades}`
    };
  };

  const calculateWinRate = (session: any) => {
    return session.accuracy || 0;
  };

  const calculateTargetProfit = (session: any) => {
    // Calculate target profit based on RR and accuracy
    const winRate = session.accuracy / 100;
    const avgWin = session.capital * 0.02 * session.riskRewardRatio;
    const avgLoss = session.capital * 0.02;
    const expectedValue = (winRate * avgWin) - ((1 - winRate) * avgLoss);
    return expectedValue * session.totalTrades;
  };

  const calculateCurrentBalance = (session: any) => {
    // Calculate current balance based on completed trades
    const completedTrades = Math.floor((session.totalTrades * session.accuracy) / 100);
    const targetProfit = calculateTargetProfit(session);
    const currentProgress = (completedTrades / session.totalTrades) * targetProfit;
    return session.capital + currentProgress;
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Lovely Profit Sessions</h1>
              <p className="text-gray-600 mt-1">Manage and track your trading sessions</p>
            </div>
            <Link
              href="/sessions/new"
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Session</span>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions.map((session, index) => {
                const progress = calculateProgress(session);
                const winRate = calculateWinRate(session);
                const targetProfit = calculateTargetProfit(session);
                const currentBalance = calculateCurrentBalance(session);

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
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
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
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Created {new Date(session.createdAt).toLocaleDateString()}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs text-gray-600">ITM Progress</p>
                          <p className="text-sm font-medium">{progress.itm}% / {winRate.toFixed(1)}%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-600">Trades</p>
                          <p className="text-sm font-medium">{progress.trades}</p>
                        </div>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{progress.trades} trades</span>
                        <span className="text-gray-600">{winRate.toFixed(1)}% win rate</span>
                      </div>
                    </div>

                    {/* Session Metrics */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      <div>
                        <p className="text-xs text-gray-600">Current</p>
                        <p className="text-lg font-bold text-gray-900">
                          ${currentBalance.toFixed(0)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-600">Target Profit</p>
                        <p className="text-lg font-bold text-green-600">
                          ${targetProfit.toFixed(0)}
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
