'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  TrendingUp,
  TrendingDown,
  Calculator,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  BarChart3,
  Clock,
  Zap,
  BookOpen,
  Shield
} from 'lucide-react';

import { BBTCalculationResult, BBTMarketData } from '../types';
import { generateBBTMarketData, optimizeEntryExit, calculatePositionSize, calculateRiskReward } from '../utils/bbtCalculations';

interface TradePlan {
  id: string;
  symbol: 'BBT';
  direction: 'long' | 'short';
  accountSize: number;
  riskPercentage: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  positionSize: number;
  riskAmount: number;
  potentialProfit: number;
  riskRewardRatio: number;
  confidence: 'low' | 'medium' | 'high';
  timeframe: 'short' | 'medium' | 'long';
  reasoning: string[];
  createdAt: string;
}

interface BBTTradePlannerProps {
  onPlanCreated?: (plan: TradePlan) => void;
}

export const BBTTradePlanner: React.FC<BBTTradePlannerProps> = ({ onPlanCreated }) => {
  const [inputs, setInputs] = useState({
    accountSize: '',
    riskPercentage: '2',
    direction: 'long' as 'long' | 'short',
    entryPrice: '',
    stopLoss: '',
    takeProfit: '',
    timeframe: 'medium' as 'short' | 'medium' | 'long'
  });

  const [marketData, setMarketData] = useState<BBTMarketData | null>(null);
  const [tradePlan, setTradePlan] = useState<TradePlan | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [useOptimization, setUseOptimization] = useState(false);

  useEffect(() => {
    loadMarketData();
  }, []);

  const loadMarketData = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    const data = generateBBTMarketData();
    setMarketData(data);

    // Auto-fill entry price with current market price
    if (!inputs.entryPrice) {
      setInputs(prev => ({ ...prev, entryPrice: data.price.toFixed(6) }));
    }

    setIsLoading(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setInputs(prev => ({ ...prev, [field]: value }));
    setError('');
    if (tradePlan) setTradePlan(null);
  };

  const handleOptimizeEntry = () => {
    if (!marketData) return;

    try {
      const optimizationResult = optimizeEntryExit({
        targetPrice: parseFloat(inputs.entryPrice || '0'),
        marketData,
        riskTolerance: 'medium',
        timeframe: inputs.timeframe
      });

      setInputs(prev => ({
        ...prev,
        entryPrice: optimizationResult.primary.toFixed(6),
        stopLoss: (optimizationResult.details?.stopLoss as number).toFixed(6),
        takeProfit: (optimizationResult.details?.takeProfit as number).toFixed(6)
      }));
    } catch (err) {
      setError('Failed to optimize entry/exit points');
    }
  };

  const generateTradePlan = () => {
    if (!marketData) {
      setError('Market data not available');
      return;
    }

    try {
      const accountSize = parseFloat(inputs.accountSize);
      const riskPercentage = parseFloat(inputs.riskPercentage);
      const entryPrice = parseFloat(inputs.entryPrice);
      const stopLoss = parseFloat(inputs.stopLoss);
      const takeProfit = parseFloat(inputs.takeProfit);

      // Validation
      if (isNaN(accountSize) || accountSize <= 0) {
        setError('Please enter a valid account size');
        return;
      }
      if (isNaN(riskPercentage) || riskPercentage <= 0 || riskPercentage > 10) {
        setError('Risk percentage must be between 0.1% and 10%');
        return;
      }
      if (isNaN(entryPrice) || entryPrice <= 0) {
        setError('Please enter a valid entry price');
        return;
      }
      if (isNaN(stopLoss) || stopLoss <= 0) {
        setError('Please enter a valid stop loss');
        return;
      }
      if (isNaN(takeProfit) || takeProfit <= 0) {
        setError('Please enter a valid take profit');
        return;
      }

      // Direction-specific validation
      if (inputs.direction === 'long') {
        if (stopLoss >= entryPrice) {
          setError('For long trades, stop loss must be below entry price');
          return;
        }
        if (takeProfit <= entryPrice) {
          setError('For long trades, take profit must be above entry price');
          return;
        }
      } else {
        if (stopLoss <= entryPrice) {
          setError('For short trades, stop loss must be above entry price');
          return;
        }
        if (takeProfit >= entryPrice) {
          setError('For short trades, take profit must be below entry price');
          return;
        }
      }

      // Calculate position size
      const positionSizeResult = calculatePositionSize({
        accountSize,
        riskPercentage,
        entryPrice,
        stopLossPrice: stopLoss
      });

      // Calculate risk-reward
      const riskRewardResult = calculateRiskReward({
        entryPrice,
        stopLossPrice: stopLoss,
        takeProfitPrice: takeProfit,
        positionSize: positionSizeResult.primary
      });

      // Generate reasoning
      const reasoning: string[] = [];

      // Market condition analysis
      if (marketData.trend === 'bullish' && inputs.direction === 'long') {
        reasoning.push('Market trend aligns with long direction');
      } else if (marketData.trend === 'bearish' && inputs.direction === 'short') {
        reasoning.push('Market trend aligns with short direction');
      } else {
        reasoning.push('Trade direction goes against current market trend - higher risk');
      }

      // RSI analysis
      if (marketData.rsi > 70) {
        reasoning.push('RSI indicates overbought conditions - consider reduced position or short bias');
      } else if (marketData.rsi < 30) {
        reasoning.push('RSI indicates oversold conditions - good for long entries');
      } else {
        reasoning.push('RSI in neutral range - no strong momentum signals');
      }

      // Support/Resistance analysis
      const nearSupport = Math.abs(entryPrice - marketData.support) / marketData.support < 0.02;
      const nearResistance = Math.abs(entryPrice - marketData.resistance) / marketData.resistance < 0.02;

      if (nearSupport && inputs.direction === 'long') {
        reasoning.push('Entry near support level - good for long trades');
      } else if (nearResistance && inputs.direction === 'short') {
        reasoning.push('Entry near resistance level - good for short trades');
      }

      // Risk assessment
      let confidence: 'low' | 'medium' | 'high' = 'medium';
      if (riskRewardResult.primary >= 3 && riskPercentage <= 2) {
        confidence = 'high';
        reasoning.push('Excellent risk-reward ratio with conservative position sizing');
      } else if (riskRewardResult.primary >= 2 && riskPercentage <= 3) {
        confidence = 'medium';
        reasoning.push('Good risk-reward ratio with reasonable position sizing');
      } else {
        confidence = 'low';
        reasoning.push('Lower risk-reward ratio - consider adjusting targets');
      }

      const plan: TradePlan = {
        id: Date.now().toString(),
        symbol: 'BBT',
        direction: inputs.direction,
        accountSize,
        riskPercentage,
        entryPrice,
        stopLoss,
        takeProfit,
        positionSize: positionSizeResult.primary,
        riskAmount: accountSize * (riskPercentage / 100),
        potentialProfit: Math.abs(takeProfit - entryPrice) * positionSizeResult.primary,
        riskRewardRatio: riskRewardResult.primary,
        confidence,
        timeframe: inputs.timeframe,
        reasoning,
        createdAt: new Date().toISOString()
      };

      setTradePlan(plan);
      onPlanCreated?.(plan);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate trade plan');
    }
  };

  const formatPrice = (price: number) => `$${price.toFixed(6)}`;
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getDirectionColor = (direction: string) => {
    return direction === 'long' ? 'text-green-600' : 'text-red-600';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
      data-testid="bbt-trade-planner"
    >
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <BookOpen className="w-6 h-6 mr-2 text-blue-600" />
              BBT Trade Planner
            </h3>
            <p className="text-sm text-gray-600">
              Create comprehensive trade plans with risk management and optimization
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-600 font-medium">Risk Managed</span>
          </div>
        </div>

        {/* Market Overview */}
        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ) : marketData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-600 font-medium">Current Price</span>
                <DollarSign className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-lg font-bold text-blue-900">{formatPrice(marketData.price)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 font-medium">Trend</span>
                <BarChart3 className="w-4 h-4 text-gray-600" />
              </div>
              <p className={`text-lg font-bold capitalize ${marketData.trend === 'bullish' ? 'text-green-600' : marketData.trend === 'bearish' ? 'text-red-600' : 'text-gray-600'}`}>
                {marketData.trend}
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-purple-600 font-medium">RSI</span>
                <Target className="w-4 h-4 text-purple-600" />
              </div>
              <p className={`text-lg font-bold ${marketData.rsi > 70 ? 'text-red-600' : marketData.rsi < 30 ? 'text-green-600' : 'text-purple-900'}`}>
                {marketData.rsi.toFixed(1)}
              </p>
            </div>
          </div>
        )}

        {/* Trade Setup Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Basic Setup */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Trade Setup</h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Size ($)
                </label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="10000"
                  value={inputs.accountSize}
                  onChange={(e) => handleInputChange('accountSize', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Risk (%)
                </label>
                <select
                  className="input-field"
                  value={inputs.riskPercentage}
                  onChange={(e) => handleInputChange('riskPercentage', e.target.value)}
                >
                  <option value="1">1% - Conservative</option>
                  <option value="2">2% - Balanced</option>
                  <option value="3">3% - Moderate</option>
                  <option value="5">5% - Aggressive</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trade Direction
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleInputChange('direction', 'long')}
                  className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                    inputs.direction === 'long'
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 mx-auto mb-1" />
                  Long (Buy)
                </button>
                <button
                  onClick={() => handleInputChange('direction', 'short')}
                  className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                    inputs.direction === 'short'
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <TrendingDown className="w-4 h-4 mx-auto mb-1" />
                  Short (Sell)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timeframe
              </label>
              <select
                className="input-field"
                value={inputs.timeframe}
                onChange={(e) => handleInputChange('timeframe', e.target.value)}
              >
                <option value="short">Short - Day Trading</option>
                <option value="medium">Medium - Swing Trading</option>
                <option value="long">Long - Position Trading</option>
              </select>
            </div>
          </div>

          {/* Right Column - Price Levels */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Price Levels</h4>
              <button
                onClick={handleOptimizeEntry}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center"
                disabled={!marketData}
              >
                <Zap className="w-3 h-3 mr-1" />
                Auto-Optimize
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entry Price ($)
              </label>
              <input
                type="number"
                className="input-field"
                placeholder="0.0300"
                step="0.000001"
                value={inputs.entryPrice}
                onChange={(e) => handleInputChange('entryPrice', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stop Loss ($)
              </label>
              <input
                type="number"
                className="input-field"
                placeholder="0.0280"
                step="0.000001"
                value={inputs.stopLoss}
                onChange={(e) => handleInputChange('stopLoss', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Take Profit ($)
              </label>
              <input
                type="number"
                className="input-field"
                placeholder="0.0350"
                step="0.000001"
                value={inputs.takeProfit}
                onChange={(e) => handleInputChange('takeProfit', e.target.value)}
              />
            </div>

            <button
              onClick={generateTradePlan}
              className="btn-primary w-full"
              disabled={!inputs.accountSize || !inputs.entryPrice || !inputs.stopLoss || !inputs.takeProfit}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Generate Trade Plan
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>

      {/* Trade Plan Results */}
      {tradePlan && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Your BBT Trade Plan</h3>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getConfidenceColor(tradePlan.confidence)} bg-current bg-opacity-10`}>
                {tradePlan.confidence} Confidence
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getDirectionColor(tradePlan.direction)} bg-current bg-opacity-10`}>
                {tradePlan.direction}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trade Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-600 font-medium">Entry Price</p>
                  <p className="text-lg font-bold text-blue-900">{formatPrice(tradePlan.entryPrice)}</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-xs text-red-600 font-medium">Stop Loss</p>
                  <p className="text-lg font-bold text-red-900">{formatPrice(tradePlan.stopLoss)}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs text-green-600 font-medium">Take Profit</p>
                  <p className="text-lg font-bold text-green-900">{formatPrice(tradePlan.takeProfit)}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-xs text-purple-600 font-medium">Risk:Reward</p>
                  <p className="text-lg font-bold text-purple-900">1:{tradePlan.riskRewardRatio.toFixed(2)}</p>
                </div>
              </div>

              {/* Position Details */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-3">Position Details</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Position Size:</span>
                    <span className="font-medium">{tradePlan.positionSize.toLocaleString()} BBT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Risk Amount:</span>
                    <span className="font-medium text-red-600">{formatCurrency(tradePlan.riskAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Potential Profit:</span>
                    <span className="font-medium text-green-600">{formatCurrency(tradePlan.potentialProfit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Risk %:</span>
                    <span className="font-medium">{tradePlan.riskPercentage}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Analysis & Reasoning */}
            <div className="space-y-4">
              <h5 className="font-medium text-gray-900">Trade Analysis</h5>
              <div className="space-y-3">
                {tradePlan.reasoning.map((reason, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{reason}</p>
                  </div>
                ))}
              </div>

              {/* Risk Warning */}
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Risk Reminder</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      This is a trading plan. Always use proper risk management and never invest more than you can afford to lose.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};