'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, DollarSign, TrendingUp, Calendar, PieChart } from 'lucide-react';
import { calculateCompoundGrowth } from '../../utils/bbtCalculations';
import { BBTCalculationResult } from '../../types';

interface CompoundGrowthCalculatorProps {
  onCalculationComplete?: (result: BBTCalculationResult) => void;
}

export const CompoundGrowthCalculator: React.FC<CompoundGrowthCalculatorProps> = ({ onCalculationComplete }) => {
  const [inputs, setInputs] = useState({
    initialInvestment: '',
    monthlyContribution: '',
    annualReturnRate: '',
    years: '',
    compoundingFrequency: '12' // Monthly by default
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
        initialInvestment: parseFloat(inputs.initialInvestment),
        monthlyContribution: parseFloat(inputs.monthlyContribution),
        annualReturnRate: parseFloat(inputs.annualReturnRate),
        years: parseFloat(inputs.years),
        compoundingFrequency: parseInt(inputs.compoundingFrequency)
      };

      // Validation
      if (Object.values(numericInputs).some(val => isNaN(val) || val < 0)) {
        setError('Please enter valid positive numbers for all fields');
        return;
      }

      if (numericInputs.annualReturnRate > 50) {
        setError('Annual return rate seems unrealistic. Please enter a reasonable percentage.');
        return;
      }

      if (numericInputs.years > 50) {
        setError('Time period should not exceed 50 years');
        return;
      }

      const calculationResult = calculateCompoundGrowth(numericInputs);
      setResult(calculationResult);
      onCalculationComplete?.(calculationResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation failed');
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const getCompoundingLabel = (frequency: string) => {
    switch (frequency) {
      case '1': return 'Annually';
      case '4': return 'Quarterly';
      case '12': return 'Monthly';
      case '365': return 'Daily';
      default: return 'Monthly';
    }
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
          <h3 className="text-lg font-semibold text-gray-900">BBT Compound Growth Calculator</h3>
          <p className="text-sm text-gray-600">Project your BBT investment growth over time</p>
        </div>
        <BarChart3 className="w-6 h-6 text-primary-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Initial BBT Investment ($)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                className="input-field pl-10"
                placeholder="1000"
                value={inputs.initialInvestment}
                onChange={(e) => handleInputChange('initialInvestment', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Contribution ($)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                className="input-field pl-10"
                placeholder="100"
                value={inputs.monthlyContribution}
                onChange={(e) => handleInputChange('monthlyContribution', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expected Annual Return (%)
            </label>
            <input
              type="number"
              className="input-field"
              placeholder="12"
              min="0"
              max="50"
              step="0.1"
              value={inputs.annualReturnRate}
              onChange={(e) => handleInputChange('annualReturnRate', e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">Crypto average: 10-20% annually</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Investment Period (Years)
            </label>
            <input
              type="number"
              className="input-field"
              placeholder="5"
              min="1"
              max="50"
              value={inputs.years}
              onChange={(e) => handleInputChange('years', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Compounding Frequency
            </label>
            <select
              className="input-field"
              value={inputs.compoundingFrequency}
              onChange={(e) => handleInputChange('compoundingFrequency', e.target.value)}
            >
              <option value="1">Annually</option>
              <option value="4">Quarterly</option>
              <option value="12">Monthly</option>
              <option value="365">Daily</option>
            </select>
          </div>

          <button
            onClick={handleCalculate}
            className="btn-primary w-full"
            disabled={!Object.values(inputs).every(val => val)}
          >
            Calculate Growth
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
              <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">Future Value</h4>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-3xl font-bold text-green-600">
                      {formatCurrency(result.primary)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Total value after {inputs.years} years
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(result.secondary || 0)}
                    </p>
                    <p className="text-sm text-gray-600">Total gains</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="font-medium text-gray-900">Breakdown</h5>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-gray-600">Total Contributions</span>
                    <span className="font-medium text-blue-600">
                      {formatCurrency(result.details?.totalContributions as number)}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-gray-600">Investment Gains</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(result.details?.totalGains as number)}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-purple-50 rounded-lg">
                    <span className="text-gray-600">Return on Investment</span>
                    <span className="font-medium text-purple-600">
                      {(result.details?.returnOnInvestment as number).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Investment Strategy Advice */}
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

              {/* Visual breakdown */}
              <div className="space-y-2">
                <h5 className="font-medium text-gray-900">Contribution vs Growth</h5>
                <div className="flex h-8 rounded-lg overflow-hidden">
                  <div
                    className="bg-blue-500 flex items-center justify-center text-white text-xs font-medium"
                    style={{
                      width: `${((result.details?.totalContributions as number) / result.primary) * 100}%`
                    }}
                  >
                    Contributions
                  </div>
                  <div
                    className="bg-green-500 flex items-center justify-center text-white text-xs font-medium"
                    style={{
                      width: `${((result.details?.totalGains as number) / result.primary) * 100}%`
                    }}
                  >
                    Growth
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
              <div className="text-center">
                <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Enter investment details to project growth</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};