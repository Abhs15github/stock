'use client';

import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import { useTrade } from '../context/TradeContext';
import { useRouter } from 'next/navigation';
import { Header } from '../components/Header';
import { StatCard } from '../components/StatCard';
import { PageLoader } from '../components/LoadingSpinner';
import { motion } from 'framer-motion';
import {
  Plus,
  TrendingUp,
  Activity,
  Target,
  BarChart3,
  ArrowRight,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { sessions, getSessionStats } = useSession();
  const { trades, getTradeStats } = useTrade();
  const router = useRouter();

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

  // Get recent sessions (last 3)
  const recentSessions = sessions
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {user.name}! 👋
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Manage your trading sessions and track your performance
          </p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8"
        >
          <StatCard
            title="Total Sessions"
            value={sessionStats.total}
            icon={BarChart3}
            color="blue"
            subtitle=""
          />
          <StatCard
            title="Active Sessions"
            value={sessionStats.active}
            icon={Activity}
            color="green"
            subtitle=""
          />
          <StatCard
            title="Total Trades"
            value={tradeStats.totalTrades}
            icon={Target}
            color="purple"
            subtitle=""
          />
          <StatCard
            title="Win Rate"
            value={`${tradeStats.profitPercentage >= 0 ? '+' : ''}${tradeStats.profitPercentage.toFixed(1)}%`}
            icon={TrendingUp}
            color={tradeStats.profitPercentage >= 0 ? "green" : "red"}
            subtitle=""
          />
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6 sm:mb-8"
        >
          <div className="card">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <Link
                href="/sessions/new"
                className="flex items-center p-3 sm:p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-blue-900 text-sm sm:text-base">New Trading Session</h3>
                  <p className="text-xs sm:text-sm text-blue-700">Start a new trading session</p>
                </div>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
              </Link>

              <Link
                href="/sessions"
                className="flex items-center p-3 sm:p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-600 rounded-lg flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-green-900 text-sm sm:text-base">View Sessions</h3>
                  <p className="text-xs sm:text-sm text-green-700">Manage your trading sessions</p>
                </div>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
              </Link>

              <Link
                href="/trades"
                className="flex items-center p-3 sm:p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-600 rounded-lg flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                  <Target className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-purple-900 text-sm sm:text-base">View Trades</h3>
                  <p className="text-xs sm:text-sm text-purple-700">Track your trading history</p>
                </div>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" />
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Recent Sessions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="card"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-0">Recent Sessions</h2>
            <Link href="/sessions" className="text-blue-600 hover:text-blue-700 text-sm">
              View All →
            </Link>
          </div>

          {recentSessions.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No sessions yet</p>
              <Link href="/sessions/new" className="btn-primary">
                Create Your First Session
              </Link>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {recentSessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors space-y-3 sm:space-y-0"
                >
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{session.name}</h3>
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-gray-600">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          {new Date(session.createdAt).toLocaleDateString()}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full w-fit ${
                          session.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {session.status === 'active' ? 'Active' : 'Completed'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-4">
                    <div className="text-left sm:text-right">
                      <p className="text-xs sm:text-sm text-gray-600">Capital</p>
                      <p className="font-semibold text-sm sm:text-base">${session.capital.toFixed(2)}</p>
                    </div>
                    <Link
                      href={`/sessions/${session.id}`}
                      className="btn-primary text-xs sm:text-sm px-3 py-1 sm:px-4 sm:py-2"
                    >
                      View Details
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}