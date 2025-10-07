'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, AlertTriangle, Clock, BarChart3 } from 'lucide-react';
import { optimizeEntryExit, generateBBTMarketData } from '../../utils/bbtCalculations';
import { BBTCalculationResult, BBTMarketData } from '../../types';

interface EntryExitOptimizerProps {
  onCalculationComplete?: (result: BBTCalculationResult) => void;
}

export const EntryExitOptimizer: React.FC<EntryExitOptimizerProps> = ({ onCalculationComplete }) => {
  const [inputs, setInputs] = useState({
    targetPrice: '',
    riskTolerance: 'medium' as 'low' | 'medium' | 'high',
    timeframe: 'medium' as 'short' | 'medium' | 'long'
  });
  const [marketData, setMarketData] = useState<BBTMarketData | null>(null);
  const [result, setResult] = useState<BBTCalculationResult | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load market data on component mount
    loadMarketData();
  }, []);

  const loadMarketData = async () => {
    setIsLoading(true);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // TODO: Replace with real BBT market data API
    const data = generateBBTMarketData();
    setMarketData(data);
    setIsLoading(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setInputs(prev => ({ ...prev, [field]: value }));
    setError('');
    if (result) setResult(null);
  };

  const handleOptimize = () => {
    if (!marketData) {
      setError('Market data not available. Please refresh and try again.');
      return;
    }

    try {
      const targetPrice = parseFloat(inputs.targetPrice);

      if (isNaN(targetPrice) || targetPrice <= 0) {
        setError('Please enter a valid target price');
        return;
      }

      const optimizationInputs = {
        targetPrice,
        marketData,
        riskTolerance: inputs.riskTolerance,
        timeframe: inputs.timeframe
      };

      const calculationResult = optimizeEntryExit(optimizationInputs);
      setResult(calculationResult);
      onCalculationComplete?.(calculationResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Optimization failed');
    }
  };

  const formatPrice = (price: number) => `$${price.toFixed(6)}`;
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  const getTrendIcon = () => {
    if (!marketData) return BarChart3;
    switch (marketData.trend) {
      case 'bullish': return TrendingUp;
      case 'bearish': return TrendingUp; // Will be rotated
      default: return BarChart3;
    }
  };

  const getTrendColor = () => {
    if (!marketData) return 'text-gray-600';
    switch (marketData.trend) {
      case 'bullish': return 'text-green-600';
      case 'bearish': return 'text-red-600';
      default: return 'text-gray-600';
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
          <h3 className="text-lg font-semibold text-gray-900">BBT Entry/Exit Optimizer</h3>
          <p className="text-sm text-gray-600">Find optimal entry and exit points for your BBT trades</p>
        </div>
        <Target className="w-6 h-6 text-primary-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Market Data Section */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Current Market Data</h4>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : marketData ? (
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Current Price</span>
                  <span className="font-medium">{formatPrice(marketData.price)}</span>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">24h Change</span>
                  <span className={`font-medium ${
                    marketData.changePercentage24h >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {marketData.changePercentage24h >= 0 ? '+' : ''}{marketData.changePercentage24h.toFixed(2)}%
                  </span>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Support</span>
                  <span className="font-medium">{formatPrice(marketData.support)}</span>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Resistance</span>
                  <span className="font-medium">{formatPrice(marketData.resistance)}</span>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Trend</span>
                  <div className="flex items-center space-x-1">
                    {React.createElement(getTrendIcon(), {
                      className: `w-4 h-4 ${getTrendColor()} ${marketData.trend === 'bearish' ? 'rotate-180' : ''}`
                    })}
                    <span className={`font-medium capitalize ${getTrendColor()}`}>
                      {marketData.trend}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">RSI</span>
                  <span className={`font-medium ${
                    marketData.rsi > 70 ? 'text-red-600' :
                    marketData.rsi < 30 ? 'text-green-600' :
                    'text-gray-900'
                  }`}>
                    {marketData.rsi.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-4">
              <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-sm text-red-600">Failed to load market data</p>
              <button
                onClick={loadMarketData}
                className="text-xs text-primary-600 hover:text-primary-700 mt-1"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {/* Input Section */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Optimization Settings</h4>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Price ($)
            </label>
            <input
              type="number"
              className="input-field"
              placeholder="0.0300"
              step="0.000001"
              value={inputs.targetPrice}
              onChange={(e) => handleInputChange('targetPrice', e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Your price target for this trade
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Risk Tolerance
            </label>
            <select
              className="input-field"
              value={inputs.riskTolerance}
              onChange={(e) => handleInputChange('riskTolerance', e.target.value)}
            >
              <option value="low">Low - Conservative</option>
              <option value="medium">Medium - Balanced</option>
              <option value="high">High - Aggressive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time Frame
            </label>
            <select
              className="input-field"
              value={inputs.timeframe}
              onChange={(e) => handleInputChange('timeframe', e.target.value)}
            >
              <option value="short">Short - Day/Swing</option>
              <option value="medium">Medium - Weeks</option>
              <option value="long">Long - Months</option>
            </select>
          </div>

          <button
            onClick={handleOptimize}
            className="btn-primary w-full"
            disabled={!inputs.targetPrice || !marketData}
          >
            <Target className="w-4 h-4 mr-2" />
            Optimize Entry/Exit
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
              <h4 className="font-medium text-gray-900">Optimization Results</h4>

              <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Optimal Entry</p>
                    <p className="text-xl font-bold text-blue-600">
                      {formatPrice(result.primary)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">Stop Loss</p>
                      <p className="font-medium text-red-600">
                        {formatPrice(result.details?.stopLoss as number)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Take Profit</p>
                      <p className="font-medium text-green-600">
                        {formatPrice(result.details?.takeProfit as number)}
                      </p>
                    </div>
                  </div>

                  <div className="p-2 bg-white rounded">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Risk-Reward</span>
                      <span className={`font-medium ${
                        result.secondary as number >= 3 ? 'text-green-600' :
                        result.secondary as number >= 2 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        1:{(result.secondary as number).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
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

              <div className="space-y-3">
                <h5 className="font-medium text-gray-900 text-sm">Trade Setup</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-600">Expected Gain</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(result.details?.expectedGain as number)}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-600">Max Loss</span>
                    <span className="font-medium text-red-600">
                      -{formatCurrency(result.details?.maxLoss as number)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Risk Level Indicator */}
              <div className="flex items-center justify-center p-2 bg-gray-100 rounded-lg">
                <span className="text-sm text-gray-600 mr-2">Risk Level:</span>
                <span className={`px-2 py-1 text-xs font-semibold rounded capitalize ${getRiskColor(result.riskLevel || 'medium')}`}>
                  {result.riskLevel}
                </span>
              </div>
            </motion.div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
              <div className="text-center">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 text-center">
                  {!marketData ? 'Loading market data...' : 'Set target price to optimize entry/exit'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};