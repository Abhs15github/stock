'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, DollarSign, Target, AlertTriangle, CheckCircle } from 'lucide-react';
import { calculatePositionSize } from '../../utils/bbtCalculations';
import { BBTCalculationResult } from '../../types';

interface PositionSizeCalculatorProps {
  onCalculationComplete?: (result: BBTCalculationResult) => void;
}

export const PositionSizeCalculator: React.FC<PositionSizeCalculatorProps> = ({ onCalculationComplete }) => {
  const [inputs, setInputs] = useState({
    accountSize: '',
    riskPercentage: '',
    entryPrice: '',
    stopLossPrice: ''
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
        accountSize: parseFloat(inputs.accountSize),
        riskPercentage: parseFloat(inputs.riskPercentage),
        entryPrice: parseFloat(inputs.entryPrice),
        stopLossPrice: parseFloat(inputs.stopLossPrice)
      };

      // Validation
      if (Object.values(numericInputs).some(val => isNaN(val) || val <= 0)) {
        setError('Please enter valid positive numbers for all fields');
        return;
      }

      if (numericInputs.riskPercentage > 20) {
        setError('Risk percentage should not exceed 20% for safety');
        return;
      }

      if (numericInputs.entryPrice <= numericInputs.stopLossPrice) {
        setError('Entry price must be higher than stop loss price for long positions');
        return;
      }

      const calculationResult = calculatePositionSize(numericInputs);
      setResult(calculationResult);
      onCalculationComplete?.(calculationResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation failed');
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const getRiskIcon = () => {
    if (!result) return Calculator;
    switch (result.riskLevel) {
      case 'low': return CheckCircle;
      case 'medium': return Target;
      case 'high': return AlertTriangle;
      default: return Calculator;
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="card"
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 space-y-3 sm:space-y-0">
        <div className="flex-1">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            BBT Position Size Calculator
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Calculate optimal position size based on your risk tolerance
          </p>
        </div>
        <Calculator className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 flex-shrink-0" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Size ($)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                className="input-field pl-10"
                placeholder="10000"
                value={inputs.accountSize}
                onChange={(e) => handleInputChange('accountSize', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Risk Percentage (%)
            </label>
            <input
              type="number"
              className="input-field"
              placeholder="2"
              min="0.1"
              max="20"
              step="0.1"
              value={inputs.riskPercentage}
              onChange={(e) => handleInputChange('riskPercentage', e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">Recommended: 1-5% for safe trading</p>
          </div>

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

          <button
            onClick={handleCalculate}
            className="btn-primary w-full"
            disabled={!Object.values(inputs).every(val => val)}
          >
            Calculate Position Size
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
                  <h4 className="font-semibold text-gray-900">Position Size</h4>
                  {React.createElement(getRiskIcon(), {
                    className: `w-5 h-5 ${getRiskColor()}`
                  })}
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {result.primary.toLocaleString(undefined, { maximumFractionDigits: 0 })} BBT
                    </p>
                    <p className="text-sm text-gray-600">
                      Worth {formatCurrency(result.secondary || 0)}
                    </p>
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
                <h5 className="font-medium text-gray-900">Details</h5>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Risk Amount</p>
                    <p className="font-medium">{formatCurrency(result.details?.riskAmount as number)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">% of Account</p>
                    <p className="font-medium">{(result.details?.percentageOfAccount as number).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Risk per BBT</p>
                    <p className="font-medium">${(result.details?.riskPerBBT as number).toFixed(6)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Risk Level</p>
                    <p className={`font-medium capitalize ${getRiskColor()}`}>
                      {result.riskLevel}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
              <div className="text-center">
                <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Enter values to calculate position size</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};