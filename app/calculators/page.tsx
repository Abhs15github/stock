'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { Header } from '../components/Header';
import { PageLoader } from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';
import { motion } from 'framer-motion';
import {
  Calculator,
  Target,
  TrendingUp,
  BarChart3,
  DollarSign,
  Zap
} from 'lucide-react';

// Import calculator components
import { PositionSizeCalculator } from '../components/calculators/PositionSizeCalculator';
import { RiskRewardCalculator } from '../components/calculators/RiskRewardCalculator';
import { CompoundGrowthCalculator } from '../components/calculators/CompoundGrowthCalculator';
import { ProfitLossCalculator } from '../components/calculators/ProfitLossCalculator';
import { EntryExitOptimizer } from '../components/calculators/EntryExitOptimizer';

import { BBTCalculationResult } from '../types';
import { storageUtils } from '../utils/storage';

const calculatorTabs = [
  {
    id: 'position-size',
    name: 'Position Size',
    icon: Target,
    description: 'Calculate optimal position size based on risk tolerance',
    component: PositionSizeCalculator
  },
  {
    id: 'risk-reward',
    name: 'Risk-Reward',
    icon: TrendingUp,
    description: 'Analyze potential risk and reward for trades',
    component: RiskRewardCalculator
  },
  {
    id: 'compound',
    name: 'Compound Growth',
    icon: BarChart3,
    description: 'Project long-term BBT investment growth',
    component: CompoundGrowthCalculator
  },
  {
    id: 'pnl',
    name: 'Profit/Loss',
    icon: DollarSign,
    description: 'Calculate current P&L for open positions',
    component: ProfitLossCalculator
  },
  {
    id: 'optimizer',
    name: 'Entry/Exit Optimizer',
    icon: Zap,
    description: 'Find optimal entry and exit points',
    component: EntryExitOptimizer
  }
];

export default function CalculatorsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [activeCalculator, setActiveCalculator] = useState('position-size');
  const [calculationHistory, setCalculationHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadCalculationHistory();
    }
  }, [user]);

  const loadCalculationHistory = () => {
    try {
      const allCalculations = storageUtils.getBBTCalculations();
      const userCalculations = allCalculations.filter(calc => calc.userId === user?.id);
      setCalculationHistory(userCalculations.slice(0, 5)); // Show last 5
    } catch (error) {
      console.error('Error loading calculation history:', error);
    }
  };

  const handleCalculationComplete = (result: BBTCalculationResult) => {
    try {
      if (!user) return;

      const calculation = {
        id: Date.now().toString(),
        userId: user.id,
        calculationType: activeCalculator as 'position-size' | 'risk-reward' | 'compound' | 'profit-loss' | 'entry-exit',
        inputs: {}, // Would store actual inputs in real implementation
        result: typeof result.primary === 'number' ? result.primary : result,
        createdAt: new Date().toISOString(),
      };

      const allCalculations = storageUtils.getBBTCalculations();
      allCalculations.unshift(calculation);
      storageUtils.saveBBTCalculations(allCalculations);

      loadCalculationHistory();
      showToast('Calculation saved to history', 'success');
    } catch (error) {
      console.error('Error saving calculation:', error);
    }
  };

  if (authLoading) {
    return <PageLoader />;
  }

  if (!user) {
    return null;
  }

  const ActiveCalculatorComponent = calculatorTabs.find(tab => tab.id === activeCalculator)?.component;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto py-3 sm:py-6 px-4 sm:px-6 lg:px-8">
        <div className="sm:px-0">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 sm:mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 mb-4">
              <Calculator className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                  BBT Trading Calculators
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Professional tools to optimize your BBT trading decisions
                </p>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Calculator Navigation */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-1"
            >
              <div className="card p-3 sm:p-4">
                <h3 className="font-semibold text-gray-900 mb-4 text-sm sm:text-base">
                  Available Calculators
                </h3>

                {/* Mobile: Horizontal Scroll */}
                <div className="lg:hidden">
                  <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                    {calculatorTabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveCalculator(tab.id)}
                          className={`flex flex-col items-center p-3 rounded-lg text-center transition-colors min-w-[100px] flex-shrink-0 ${
                            activeCalculator === tab.id
                              ? 'bg-primary-50 border border-primary-200 text-primary-700'
                              : 'hover:bg-gray-50 text-gray-700 border border-gray-200'
                          }`}
                        >
                          <Icon className="w-5 h-5 mb-2" />
                          <p className="font-medium text-xs">{tab.name}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Desktop: Vertical List */}
                <nav className="hidden lg:block space-y-2">
                  {calculatorTabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveCalculator(tab.id)}
                        className={`w-full flex items-start space-x-3 p-3 rounded-lg text-left transition-colors ${
                          activeCalculator === tab.id
                            ? 'bg-primary-50 border border-primary-200 text-primary-700'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm">{tab.name}</p>
                          <p className="text-xs text-gray-500 mt-1">{tab.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </nav>

                {/* Recent Calculations */}
                {calculationHistory.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3 text-sm">Recent Calculations</h4>
                    <div className="space-y-2">
                      {calculationHistory.map((calc) => (
                        <div
                          key={calc.id}
                          className="p-2 bg-gray-50 rounded text-xs"
                        >
                          <p className="font-medium capitalize">
                            {calc.calculationType.replace('-', ' ')}
                          </p>
                          <p className="text-gray-500">
                            {new Date(calc.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Active Calculator */}
            <motion.div
              key={activeCalculator}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-3"
            >
              {ActiveCalculatorComponent && (
                <ActiveCalculatorComponent onCalculationComplete={handleCalculationComplete} />
              )}
            </motion.div>
          </div>

          {/* Quick Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 card"
          >
            <h3 className="font-semibold text-gray-900 mb-4">💡 BBT Trading Tips</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-1">Position Sizing</h4>
                <p className="text-blue-700">Never risk more than 1-2% of your account on a single BBT trade</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-1">Risk-Reward</h4>
                <p className="text-green-700">Aim for a minimum 1:2 risk-reward ratio on BBT trades</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-1">Compound Growth</h4>
                <p className="text-purple-700">Small, consistent gains compound significantly over time</p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}