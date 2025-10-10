'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import { useTrade } from '../context/TradeContext';
import { useRouter } from 'next/navigation';
import { Header } from '../components/Header';
import { BBTMarketAnalysis } from '../components/BBTMarketAnalysis';
import { BBTTradePlanner } from '../components/BBTTradePlanner';
import { StatCard } from '../components/StatCard';
import { LoadingSpinner, PageLoader } from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';
import { motion } from 'framer-motion';
import {
  Calculator,
  Target,
  TrendingUp,
  BarChart3,
  DollarSign,
  Zap,
  ArrowRight,
  Brain,
  Activity,
  Wallet,
  PieChart,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';

import { generateBBTMarketData, generateMockBBTCalculations } from '../utils/bbtCalculations';
import { BBTMarketData } from '../types';

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { sessions, getSessionStats } = useSession();
  const { trades, getTradeStats } = useTrade();
  const { showToast } = useToast();
  const router = useRouter();

  const [bbtMarketData, setBbtMarketData] = useState<BBTMarketData | null>(null);
  const [recentCalculations, setRecentCalculations] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadBBTData();
    }
  }, [user]);

  const loadBBTData = async () => {
    try {
      // Load BBT market data
      // TODO: Replace with real BBT API
      const marketData = generateBBTMarketData();
      setBbtMarketData(marketData);

      // Load recent BBT calculations
      const calculations = generateMockBBTCalculations();
      setRecentCalculations(calculations.slice(0, 3));
    } catch (error) {
      console.error('Error loading BBT data:', error);
    }
  };

  if (authLoading) {
    return <PageLoader />;
  }

  if (!user) {
    return null;
  }

  const sessionStats = getSessionStats();
  const tradeStats = getTradeStats();

  const calculatorActions = [
    {
      title: 'Position Size Calculator',
      description: 'Calculate optimal BBT position size based on your risk tolerance',
      icon: Target,
      href: '/calculators',
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
      textColor: 'text-blue-700'
    },
    {
      title: 'Risk-Reward Analyzer',
      description: 'Analyze potential risk and reward for your BBT trades',
      icon: TrendingUp,
      href: '/calculators',
      color: 'bg-green-50 hover:bg-green-100 border-green-200',
      textColor: 'text-green-700'
    },
    {
      title: 'Entry/Exit Optimizer',
      description: 'Find optimal entry and exit points for BBT trades',
      icon: Zap,
      href: '/calculators',
      color: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
      textColor: 'text-purple-700'
    },
    {
      title: 'Compound Growth',
      description: 'Project your BBT investment growth over time',
      icon: BarChart3,
      href: '/calculators',
      color: 'bg-orange-50 hover:bg-orange-100 border-orange-200',
      textColor: 'text-orange-700'
    }
  ];

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const formatPrice = (price: number) => `$${price.toFixed(6)}`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto py-3 sm:py-6 px-4 sm:px-6 lg:px-8">
        <div className="sm:px-0">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 sm:mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                  Welcome to your BBT Trading Assistant, {user.name}! 🚀
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                  Your intelligent companion for BBT trading decisions and performance tracking
                </p>
              </div>
            </div>
          </motion.div>

          {/* BBT Overview Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8"
          >
            {bbtMarketData && (
              <StatCard
                title="BBT Price"
                value={parseFloat((bbtMarketData.price * 1000).toFixed(3))}
                icon={DollarSign}
                color="blue"
                subtitle={`$${bbtMarketData.price.toFixed(6)} (${bbtMarketData.changePercentage24h >= 0 ? '+' : ''}${bbtMarketData.changePercentage24h.toFixed(2)}%)`}
              />
            )}
            <StatCard
              title="BBT Trades"
              value={tradeStats.totalTrades}
              icon={Activity}
              color="green"
              subtitle="Total BBT positions"
            />
            <StatCard
              title="Portfolio P&L"
              value={Math.round(tradeStats.profitPercentage)}
              icon={tradeStats.profitPercentage >= 0 ? TrendingUp : TrendingUp}
              color={tradeStats.profitPercentage >= 0 ? "green" : "red"}
              subtitle={`${tradeStats.profitPercentage >= 0 ? '+' : ''}${tradeStats.profitPercentage.toFixed(1)}%`}
            />
            <StatCard
              title="Active Capital"
              value={Math.round(tradeStats.activeInvestment)}
              icon={Wallet}
              color="purple"
              subtitle={formatCurrency(tradeStats.activeInvestment)}
            />
          </motion.div>

          {/* BBT Calculator Quick Access */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">BBT Trading Calculators</h2>
                  <p className="text-gray-600 dark:text-gray-400">Professional tools to optimize your BBT trading decisions</p>
                </div>
                <Link href="/calculators" className="btn-primary flex items-center space-x-2">
                  <Calculator className="w-4 h-4" />
                  <span>View All</span>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {calculatorActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <motion.div
                      key={action.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Link
                        href={action.href}
                        className={`block p-4 rounded-lg border transition-all duration-200 ${action.color} dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                            <Icon className={`w-5 h-5 ${action.textColor} dark:text-blue-400`} />
                          </div>
                          <div className="flex-1">
                            <h3 className={`font-semibold ${action.textColor} dark:text-blue-300`}>{action.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{action.description}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* BBT Market Analysis */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-8"
          >
            <BBTMarketAnalysis />
          </motion.div>

          {/* BBT Trade Planner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-8"
          >
            <BBTTradePlanner onPlanCreated={(plan) => {
              showToast(`Trade plan created for ${plan.direction} BBT at ${plan.entryPrice.toFixed(6)}`, 'success');
            }} />
          </motion.div>

          {/* Recent Activity & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Recent BBT Calculations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent BBT Calculations</h3>
                <Link href="/calculators" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                  View All →
                </Link>
              </div>

              {recentCalculations.length === 0 ? (
                <div className="text-center py-8">
                  <Calculator className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">No calculations yet</p>
                  <Link href="/calculators" className="btn-primary text-sm">
                    Start Calculating
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentCalculations.map((calc, index) => (
                    <motion.div
                      key={calc.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                          <Calculator className="w-4 h-4 text-primary-600 dark:text-primary-300" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                            {calc.calculationType.replace('-', ' ')} Calculator
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(calc.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        {typeof calc.result === 'number' ? calc.result.toFixed(2) : 'Calculated'}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Quick Trading Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="card"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>

              <div className="space-y-3">
                <Link
                  href="/trades"
                  className="w-full flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors border border-green-200 dark:border-green-800"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-600 dark:bg-green-700 rounded-lg flex items-center justify-center">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white">Log BBT Trade</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Record your latest BBT position</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-green-600 dark:text-green-400" />
                </Link>

                <Link
                  href="/calculators"
                  className="w-full flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 dark:bg-blue-700 rounded-lg flex items-center justify-center">
                      <Calculator className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white">BBT Calculators</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Position size, risk-reward & more</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </Link>

                <button
                  onClick={() => {
                    const plannerElement = document.querySelector('[data-testid="bbt-trade-planner"]');
                    plannerElement?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-800"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-indigo-600 dark:bg-indigo-700 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white">Create Trade Plan</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Generate comprehensive trade strategy</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </button>

                <div className="w-full flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-600 dark:bg-purple-700 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white">BBT Education</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Learn BBT trading strategies</p>
                    </div>
                  </div>
                  <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">
                    Coming Soon
                  </span>
                </div>
              </div>

              {/* Portfolio Summary */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Portfolio Summary</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Sessions</span>
                    <span className="font-medium text-gray-900 dark:text-white">{sessionStats.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Active Sessions</span>
                    <span className="font-medium text-orange-600 dark:text-orange-400">{sessionStats.active}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Trades</span>
                    <span className="font-medium text-gray-900 dark:text-white">{tradeStats.totalTrades}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Win Rate</span>
                    <span className={`font-medium ${
                      tradeStats.profitPercentage >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {tradeStats.profitPercentage >= 0 ? '+' : ''}{tradeStats.profitPercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* BBT Learning Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="card"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">💡 BBT Trading Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h4 className="font-medium text-blue-900 dark:text-blue-300">Position Sizing</h4>
                </div>
                <p className="text-blue-800 dark:text-blue-400">
                  Use the position size calculator to never risk more than 1-2% of your account on a single BBT trade.
                </p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <h4 className="font-medium text-green-900 dark:text-green-300">Risk Management</h4>
                </div>
                <p className="text-green-800 dark:text-green-400">
                  Always maintain a minimum 1:2 risk-reward ratio on your BBT trades for long-term profitability.
                </p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center space-x-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <h4 className="font-medium text-purple-900 dark:text-purple-300">Market Analysis</h4>
                </div>
                <p className="text-purple-800 dark:text-purple-400">
                  Use the market analysis tools to identify optimal entry and exit points for your BBT positions.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}