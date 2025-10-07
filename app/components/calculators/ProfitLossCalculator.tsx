'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, BarChart3, AlertTriangle } from 'lucide-react';
import { calculateProfitLoss } from '../../utils/bbtCalculations';
import { BBTCalculationResult } from '../../types';

interface ProfitLossCalculatorProps {
  onCalculationComplete?: (result: BBTCalculationResult) => void;
}

export const ProfitLossCalculator: React.FC<ProfitLossCalculatorProps> = ({ onCalculationComplete }) => {
  const [inputs, setInputs] = useState({
    entryPrice: '',
    currentPrice: '',
    positionSize: '',
    tradeType: 'long' as 'long' | 'short',
    fees: '0'
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
        currentPrice: parseFloat(inputs.currentPrice),
        positionSize: parseFloat(inputs.positionSize),
        tradeType: inputs.tradeType,
        fees: parseFloat(inputs.fees) || 0
      };

      // Validation
      if ([numericInputs.entryPrice, numericInputs.currentPrice, numericInputs.positionSize].some(val => isNaN(val) || val <= 0)) {
        setError('Please enter valid positive numbers for price and position size');
        return;
      }

      if (numericInputs.fees < 0) {
        setError('Fees cannot be negative');
        return;
      }

      const calculationResult = calculateProfitLoss(numericInputs);
      setResult(calculationResult);
      onCalculationComplete?.(calculationResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation failed');
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const getPnLIcon = () => {
    if (!result) return BarChart3;
    return result.primary >= 0 ? TrendingUp : TrendingDown;
  };

  const getPnLColor = () => {
    if (!result) return 'text-blue-600';
    return result.primary >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getPnLBgColor = () => {
    if (!result) return 'bg-blue-50 border-blue-200';
    return result.primary >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
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
          <h3 className="text-lg font-semibold text-gray-900">BBT Profit/Loss Calculator</h3>
          <p className="text-sm text-gray-600">Calculate current P&L for your BBT positions</p>
        </div>
        <DollarSign className="w-6 h-6 text-primary-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trade Type
            </label>
            <select
              className="input-field"
              value={inputs.tradeType}
              onChange={(e) => handleInputChange('tradeType', e.target.value)}
            >
              <option value="long">Long (Buy)</option>
              <option value="short">Short (Sell)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entry Price ($)
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
              Current Price ($)
            </label>
            <input
              type="number"
              className="input-field"
              placeholder="0.0250"
              step="0.000001"
              value={inputs.currentPrice}
              onChange={(e) => handleInputChange('currentPrice', e.target.value)}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trading Fees ($)
            </label>
            <input
              type="number"
              className="input-field"
              placeholder="0"
              min="0"
              step="0.01"
              value={inputs.fees}
              onChange={(e) => handleInputChange('fees', e.target.value)}
            />
          </div>

          <button
            onClick={handleCalculate}
            className="btn-primary w-full"
            disabled={!inputs.entryPrice || !inputs.currentPrice || !inputs.positionSize}
          >
            Calculate P&L
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
              <div className={`p-4 rounded-lg border ${getPnLBgColor()}`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">Current P&L</h4>
                  {React.createElement(getPnLIcon(), {
                    className: `w-5 h-5 ${getPnLColor()}`
                  })}
                </div>

                <div className="space-y-3">
                  <div>
                    <p className={`text-3xl font-bold ${getPnLColor()}`}>
                      {result.primary >= 0 ? '+' : ''}{formatCurrency(result.primary)}
                    </p>
                    <p className={`text-lg ${getPnLColor()}`}>
                      {result.secondary && result.secondary >= 0 ? '+' : ''}{(result.secondary as number)?.toFixed(2) || '0.00'}%
                    </p>
                  </div>

                  <div className={`p-3 rounded-lg ${
                    result.riskLevel === 'low' ? 'bg-green-100' :
                    result.riskLevel === 'medium' ? 'bg-yellow-100' :
                    'bg-red-100'
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
                <h5 className="font-medium text-gray-900">Position Details</h5>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Position Value</span>
                    <span className="font-medium">
                      {formatCurrency(result.details?.positionValue as number)}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Break-even Price</span>
                    <span className="font-medium">
                      ${(result.details?.breakEvenPrice as number).toFixed(6)}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Unrealized P&L</span>
                    <span className={`font-medium ${
                      (result.details?.unrealizedPnL as number) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(result.details?.unrealizedPnL as number) >= 0 ? '+' : ''}
                      {formatCurrency(result.details?.unrealizedPnL as number)}
                    </span>
                  </div>
                  {parseFloat(inputs.fees) > 0 && (
                    <div className="flex justify-between p-3 bg-red-50 rounded-lg">
                      <span className="text-gray-600">Trading Fees</span>
                      <span className="font-medium text-red-600">
                        -{formatCurrency(parseFloat(inputs.fees))}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Price Movement Indicator */}
              <div className="space-y-2">
                <h5 className="font-medium text-gray-900">Price Movement</h5>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Entry:</span>
                  <span className="font-medium">${parseFloat(inputs.entryPrice).toFixed(6)}</span>
                  <span className="text-gray-400">→</span>
                  <span className="text-sm text-gray-600">Current:</span>
                  <span className="font-medium">${parseFloat(inputs.currentPrice).toFixed(6)}</span>
                  <span className={`text-sm font-medium ${getPnLColor()}`}>
                    ({result.secondary && result.secondary >= 0 ? '+' : ''}{(result.secondary as number)?.toFixed(2) || '0.00'}%)
                  </span>
                </div>
              </div>

              {/* Trade Type Indicator */}
              <div className="flex items-center justify-center p-2 bg-gray-100 rounded-lg">
                <span className="text-sm text-gray-600 mr-2">Trade Type:</span>
                <span className={`px-2 py-1 text-xs font-semibold rounded ${
                  inputs.tradeType === 'long' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {inputs.tradeType.toUpperCase()}
                </span>
              </div>
            </motion.div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Enter position details to calculate P&L</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};