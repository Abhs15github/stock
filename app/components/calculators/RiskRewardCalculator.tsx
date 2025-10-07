'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, AlertTriangle, CheckCircle, BarChart3 } from 'lucide-react';
import { calculateRiskReward } from '../../utils/bbtCalculations';
import { BBTCalculationResult } from '../../types';

interface RiskRewardCalculatorProps {
  onCalculationComplete?: (result: BBTCalculationResult) => void;
}

export const RiskRewardCalculator: React.FC<RiskRewardCalculatorProps> = ({ onCalculationComplete }) => {
  const [inputs, setInputs] = useState({
    entryPrice: '',
    stopLossPrice: '',
    takeProfitPrice: '',
    positionSize: '1000'
  });
  const [result, setResult] = useState<BBTCalculationResult | null>(null);
  const [error, setError] = useState<string>('');

  const handleInputChange = (field: string, value: string) => {
    setInputs(prev => ({ ...prev, [field]: value }));
    setError('');
    if (result) setResult(null);
  };

  const handleCalculate = () => {
    try {
      const numericInputs = {
        entryPrice: parseFloat(inputs.entryPrice),
        stopLossPrice: parseFloat(inputs.stopLossPrice),
        takeProfitPrice: parseFloat(inputs.takeProfitPrice),
        positionSize: parseFloat(inputs.positionSize)
      };

      // Validation
      if (Object.values(numericInputs).some(val => isNaN(val) || val <= 0)) {
        setError('Please enter valid positive numbers for all fields');
        return;
      }

      if (numericInputs.entryPrice <= numericInputs.stopLossPrice) {
        setError('Entry price must be higher than stop loss for long positions');
        return;
      }

      if (numericInputs.takeProfitPrice <= numericInputs.entryPrice) {
        setError('Take profit must be higher than entry price for long positions');
        return;
      }

      const calculationResult = calculateRiskReward(numericInputs);
      setResult(calculationResult);
      onCalculationComplete?.(calculationResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation failed');
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const getRiskIcon = () => {
    if (!result) return TrendingUp;
    switch (result.riskLevel) {
      case 'low': return CheckCircle;
      case 'medium': return Target;
      case 'high': return AlertTriangle;
      default: return TrendingUp;
    }
  };

  const getRiskColor = () => {
    if (!result) return 'text-blue-600';
    switch (result.riskLevel) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  const getRatioColor = (ratio: number) => {
    if (ratio >= 3) return 'text-green-600';
    if (ratio >= 2) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="card"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">BBT Risk-Reward Calculator</h3>
          <p className="text-sm text-gray-600">Analyze potential risk and reward for your BBT trades</p>
        </div>
        <TrendingUp className="w-6 h-6 text-primary-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              BBT Entry Price ($)
            </label>
            <input
              type="number"
              className="input-field"
              placeholder="0.0234"
              step="0.000001"
              value={inputs.entryPrice}
              onChange={(e) => handleInputChange('entryPrice', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stop Loss Price ($)
            </label>
            <input
              type="number"
              className="input-field"
              placeholder="0.0200"
              step="0.000001"
              value={inputs.stopLossPrice}
              onChange={(e) => handleInputChange('stopLossPrice', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Take Profit Price ($)
            </label>
            <input
              type="number"
              className="input-field"
              placeholder="0.0350"
              step="0.000001"
              value={inputs.takeProfitPrice}
              onChange={(e) => handleInputChange('takeProfitPrice', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Position Size (BBT)
            </label>
            <input
              type="number"
              className="input-field"
              placeholder="1000"
              value={inputs.positionSize}
              onChange={(e) => handleInputChange('positionSize', e.target.value)}
            />
          </div>

          <button
            onClick={handleCalculate}
            className="btn-primary w-full"
            disabled={!Object.values(inputs).every(val => val)}
          >
            Calculate Risk-Reward
          </button>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          {result ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">Risk-Reward Analysis</h4>
                  {React.createElement(getRiskIcon(), {
                    className: `w-5 h-5 ${getRiskColor()}`
                  })}
                </div>

                <div className="space-y-3">
                  <div>
                    <p className={`text-3xl font-bold ${getRatioColor(result.primary)}`}>
                      1:{result.primary.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">Risk-Reward Ratio</p>
                  </div>

                  <div className={`p-3 rounded-lg ${
                    result.riskLevel === 'low' ? 'bg-green-50 border border-green-200' :
                    result.riskLevel === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
                    'bg-red-50 border border-red-200'
                  }`}>
                    <p className={`text-sm font-medium ${
                      result.riskLevel === 'low' ? 'text-green-800' :
                      result.riskLevel === 'medium' ? 'text-yellow-800' :
                      'text-red-800'
                    }`}>
                      {result.recommendation}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="font-medium text-gray-900">Trade Details</h5>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex justify-between p-3 bg-red-50 rounded-lg">
                    <span className="text-gray-600">Max Risk</span>
                    <span className="font-medium text-red-600">
                      -{formatCurrency(result.details?.riskAmount as number)}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-gray-600">Potential Reward</span>
                    <span className="font-medium text-green-600">
                      +{formatCurrency(result.details?.rewardAmount as number)}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-gray-600">Break-even Win Rate</span>
                    <span className="font-medium text-blue-600">
                      {(result.details?.breakEvenWinRate as number).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Visual Risk-Reward Bar */}
              <div className="space-y-2">
                <h5 className="font-medium text-gray-900">Visual Risk vs Reward</h5>
                <div className="flex h-8 rounded-lg overflow-hidden">
                  <div
                    className="bg-red-500 flex items-center justify-center text-white text-xs font-medium"
                    style={{ width: `${100 / (1 + result.primary)}%` }}
                  >
                    Risk
                  </div>
                  <div
                    className="bg-green-500 flex items-center justify-center text-white text-xs font-medium"
                    style={{ width: `${(result.primary * 100) / (1 + result.primary)}%` }}
                  >
                    Reward
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Enter trade details to analyze risk-reward</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};