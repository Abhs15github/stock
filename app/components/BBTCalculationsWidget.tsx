'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calculator, TrendingUp, DollarSign, Target, BarChart3 } from 'lucide-react';
import { BBTCalculation } from '../types';
import { generateMockBBTCalculations } from '../utils/mockData';
import { useAuth } from '../context/AuthContext';

export const BBTCalculationsWidget: React.FC = () => {
  const { user } = useAuth();
  const [calculations, setCalculations] = useState<BBTCalculation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCalculations = async () => {
      if (!user) return;

      setIsLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));

      // TODO: Replace with real API call to fetch BBT calculations
      const mockCalculations = generateMockBBTCalculations(user.id, 5);
      setCalculations(mockCalculations);
      setIsLoading(false);
    };

    loadCalculations();
  }, [user]);

  const getCalculationIcon = (type: BBTCalculation['calculationType']) => {
    switch (type) {
      case 'position-size':
        return Target;
      case 'risk-reward':
        return TrendingUp;
      case 'compound':
        return BarChart3;
      case 'profit-loss':
        return DollarSign;
      case 'entry-exit':
        return Target;
      default:
        return Calculator;
    }
  };

  const formatCalculationType = (type: BBTCalculation['calculationType']) => {
    switch (type) {
      case 'position-size':
        return 'Position Size';
      case 'risk-reward':
        return 'Risk/Reward';
      case 'compound':
        return 'Compound Interest';
      case 'profit-loss':
        return 'Profit/Loss';
      case 'entry-exit':
        return 'Entry/Exit';
      default:
        return type;
    }
  };

  const formatResult = (calculation: BBTCalculation) => {
    const result = typeof calculation.result === 'number' ? calculation.result : calculation.result.primary;

    switch (calculation.calculationType) {
      case 'position-size':
        return `${result.toFixed(0)} BBT`;
      case 'risk-reward':
        return `1:${result.toFixed(2)}`;
      case 'compound':
        return `$${result.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
      case 'profit-loss':
        return `$${result.toFixed(2)}`;
      case 'entry-exit':
        return `$${result.toFixed(6)}`;
      default:
        return result.toString();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="card"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent BBT Calculations</h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="card"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent BBT Calculations</h3>
        <Calculator className="w-5 h-5 text-primary-600" />
      </div>

      {calculations.length === 0 ? (
        <div className="text-center py-8">
          <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No calculations yet</p>
          <p className="text-gray-400 text-xs mt-1">
            Start using BBT calculators to see your history here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {calculations.map((calculation, index) => {
            const Icon = getCalculationIcon(calculation.calculationType);
            return (
              <motion.div
                key={calculation.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatCalculationType(calculation.calculationType)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(calculation.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {formatResult(calculation)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <button className="w-full text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
          View All Calculations
        </button>
      </div>
    </motion.div>
  );
};