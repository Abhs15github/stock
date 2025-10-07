'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Bell,
  Eye,
  Zap,
  Calculator,
  BookOpen
} from 'lucide-react';

import { BBTMarketData, TradeRecommendation } from '../types';
import { generateBBTMarketData, generateBBTRecommendation, generateMockChartData } from '../utils/bbtCalculations';

export const BBTMarketAnalysis: React.FC = () => {
  const [marketData, setMarketData] = useState<BBTMarketData | null>(null);
  const [recommendation, setRecommendation] = useState<TradeRecommendation | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadMarketData();
    const interval = setInterval(loadMarketData, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const loadMarketData = async () => {
    setIsLoading(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      // TODO: Replace with real BBT market data API
      const data = generateBBTMarketData();
      const rec = generateBBTRecommendation(data);
      const chart = generateMockChartData('BBT', 30); // 30 days of data

      setMarketData(data);
      setRecommendation(rec);
      setChartData(chart);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading BBT market data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => `$${price.toFixed(6)}`;
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

  const getTrendIcon = () => {
    if (!marketData) return Activity;
    switch (marketData.trend) {
      case 'bullish': return TrendingUp;
      case 'bearish': return TrendingDown;
      default: return Activity;
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

  const getRecommendationIcon = () => {
    if (!recommendation) return Clock;
    switch (recommendation.action) {
      case 'buy': return TrendingUp;
      case 'sell': return TrendingDown;
      case 'hold': return Target;
      default: return Clock;
    }
  };

  const getRecommendationColor = () => {
    if (!recommendation) return 'text-gray-600';
    switch (recommendation.action) {
      case 'buy': return 'text-green-600';
      case 'sell': return 'text-red-600';
      case 'hold': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getConfidenceColor = () => {
    if (!recommendation) return 'text-gray-600';
    switch (recommendation.confidence) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (isLoading && !marketData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Market Overview */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">BBT Market Analysis</h3>
            <p className="text-sm text-gray-600">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={loadMarketData}
            className="btn-secondary text-sm"
            disabled={isLoading}
          >
            {isLoading ? 'Updating...' : 'Refresh'}
          </button>
        </div>

        {marketData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Current Price */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">BBT Price</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatPrice(marketData.price)}
                  </p>
                  <p className={`text-sm ${
                    marketData.changePercentage24h >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {marketData.changePercentage24h >= 0 ? '+' : ''}{marketData.changePercentage24h.toFixed(2)}% (24h)
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            {/* Market Cap */}
            <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Market Cap</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {formatCurrency(marketData.marketCap)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Vol: {formatCurrency(marketData.volume24h)}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
            </div>

            {/* Market Trend */}
            <div className={`p-4 rounded-lg border ${
              marketData.trend === 'bullish' ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-200' :
              marketData.trend === 'bearish' ? 'bg-gradient-to-r from-red-50 to-red-100 border-red-200' :
              'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${getTrendColor()}`}>Market Trend</p>
                  <p className={`text-2xl font-bold capitalize ${getTrendColor()}`}>
                    {marketData.trend}
                  </p>
                  <p className="text-sm text-gray-600">
                    RSI: {marketData.rsi.toFixed(1)}
                  </p>
                </div>
                {React.createElement(getTrendIcon(), {
                  className: `w-8 h-8 ${getTrendColor()}`
                })}
              </div>
            </div>
          </div>
        )}

        {/* Price Chart */}
        <div className="h-64 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                stroke="#666"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#666"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value.toFixed(6)}`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-3 rounded-lg shadow-lg border">
                        <p className="text-sm text-gray-600">{label}</p>
                        <p className="text-sm font-medium">
                          Price: {formatPrice(payload[0].value as number)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorPrice)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Support and Resistance */}
        {marketData && (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">Support Level</p>
                  <p className="text-lg font-bold text-red-900">
                    {formatPrice(marketData.support)}
                  </p>
                </div>
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Resistance Level</p>
                  <p className="text-lg font-bold text-green-900">
                    {formatPrice(marketData.resistance)}
                  </p>
                </div>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Trading Recommendation */}
      {recommendation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">BBT Trading Recommendation</h3>
            {React.createElement(getRecommendationIcon(), {
              className: `w-6 h-6 ${getRecommendationColor()}`
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recommendation Summary */}
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border ${
                recommendation.action === 'buy' ? 'bg-green-50 border-green-200' :
                recommendation.action === 'sell' ? 'bg-red-50 border-red-200' :
                recommendation.action === 'hold' ? 'bg-blue-50 border-blue-200' :
                'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Action</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold uppercase ${
                    recommendation.action === 'buy' ? 'bg-green-100 text-green-800' :
                    recommendation.action === 'sell' ? 'bg-red-100 text-red-800' :
                    recommendation.action === 'hold' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {recommendation.action}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Confidence</p>
                    <p className={`font-semibold capitalize ${getConfidenceColor()}`}>
                      {recommendation.confidence}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Risk-Reward</p>
                    <p className="font-semibold">1:{recommendation.riskReward.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Trade Setup */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Suggested Trade Setup</h4>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex justify-between p-2 bg-blue-50 rounded">
                    <span className="text-gray-600">Entry Price</span>
                    <span className="font-medium">{formatPrice(recommendation.entryPrice)}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-red-50 rounded">
                    <span className="text-gray-600">Stop Loss</span>
                    <span className="font-medium">{formatPrice(recommendation.stopLoss)}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-green-50 rounded">
                    <span className="text-gray-600">Take Profit</span>
                    <span className="font-medium">{formatPrice(recommendation.takeProfit)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Analysis Reasoning */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Analysis Reasoning</h4>
              <div className="space-y-2">
                {recommendation.reasoning.map((reason, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{reason}</p>
                  </div>
                ))}
              </div>

              {/* Disclaimer */}
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Trading Disclaimer</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      This analysis is for educational purposes only. Always do your own research and never invest more than you can afford to lose.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Trading Decision Support */}
      {marketData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Trading Decision Support</h3>
            <Zap className="w-6 h-6 text-yellow-500" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Market Signals */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center">
                <Bell className="w-4 h-4 mr-2 text-blue-600" />
                Market Signals
              </h4>

              <div className="space-y-3">
                {/* RSI Signal */}
                <div className={`p-3 rounded-lg border ${
                  marketData.rsi > 70 ? 'bg-red-50 border-red-200' :
                  marketData.rsi < 30 ? 'bg-green-50 border-green-200' :
                  'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">RSI Signal</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      marketData.rsi > 70 ? 'bg-red-100 text-red-800' :
                      marketData.rsi < 30 ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {marketData.rsi > 70 ? 'OVERBOUGHT' :
                       marketData.rsi < 30 ? 'OVERSOLD' :
                       'NEUTRAL'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {marketData.rsi > 70 ? 'Consider taking profits or avoid buying' :
                     marketData.rsi < 30 ? 'Potential buying opportunity' :
                     'No strong RSI signal'}
                  </p>
                </div>

                {/* Price vs Support/Resistance */}
                <div className={`p-3 rounded-lg border ${
                  marketData.price <= marketData.support * 1.02 ? 'bg-green-50 border-green-200' :
                  marketData.price >= marketData.resistance * 0.98 ? 'bg-red-50 border-red-200' :
                  'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Price Level</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      marketData.price <= marketData.support * 1.02 ? 'bg-green-100 text-green-800' :
                      marketData.price >= marketData.resistance * 0.98 ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {marketData.price <= marketData.support * 1.02 ? 'NEAR SUPPORT' :
                       marketData.price >= marketData.resistance * 0.98 ? 'NEAR RESISTANCE' :
                       'NEUTRAL ZONE'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {marketData.price <= marketData.support * 1.02 ? 'Potential bounce opportunity' :
                     marketData.price >= marketData.resistance * 0.98 ? 'May face selling pressure' :
                     'Price in neutral trading range'}
                  </p>
                </div>

                {/* Trend Momentum */}
                <div className={`p-3 rounded-lg border ${
                  marketData.trend === 'bullish' && marketData.changePercentage24h > 5 ? 'bg-green-50 border-green-200' :
                  marketData.trend === 'bearish' && marketData.changePercentage24h < -5 ? 'bg-red-50 border-red-200' :
                  'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Momentum</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      marketData.trend === 'bullish' && marketData.changePercentage24h > 5 ? 'bg-green-100 text-green-800' :
                      marketData.trend === 'bearish' && marketData.changePercentage24h < -5 ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {marketData.trend === 'bullish' && marketData.changePercentage24h > 5 ? 'STRONG BULL' :
                       marketData.trend === 'bearish' && marketData.changePercentage24h < -5 ? 'STRONG BEAR' :
                       'WEAK/MIXED'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {marketData.trend === 'bullish' && marketData.changePercentage24h > 5 ? 'Strong upward momentum' :
                     marketData.trend === 'bearish' && marketData.changePercentage24h < -5 ? 'Strong downward momentum' :
                     'Weak or mixed momentum signals'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center">
                <Target className="w-4 h-4 mr-2 text-green-600" />
                Quick Actions
              </h4>

              <div className="space-y-3">
                <a
                  href="/calculators"
                  className="w-full p-3 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg text-left hover:from-green-100 hover:to-green-200 transition-colors block"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-green-900 text-sm">Calculate Position Size</p>
                      <p className="text-xs text-green-700">Determine optimal trade size</p>
                    </div>
                    <Calculator className="w-4 h-4 text-green-600" />
                  </div>
                </a>

                <button
                  onClick={() => {
                    const plannerElement = document.querySelector('[data-testid="bbt-trade-planner"]');
                    plannerElement?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full p-3 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg text-left hover:from-blue-100 hover:to-blue-200 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-blue-900 text-sm">Create Trade Plan</p>
                      <p className="text-xs text-blue-700">Generate comprehensive strategy</p>
                    </div>
                    <BookOpen className="w-4 h-4 text-blue-600" />
                  </div>
                </button>

                <a
                  href="/calculators"
                  className="w-full p-3 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg text-left hover:from-purple-100 hover:to-purple-200 transition-colors block"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-purple-900 text-sm">Risk Analysis</p>
                      <p className="text-xs text-purple-700">Analyze trade risk-reward</p>
                    </div>
                    <BarChart3 className="w-4 h-4 text-purple-600" />
                  </div>
                </a>
              </div>
            </div>

            {/* Market Watch */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center">
                <Eye className="w-4 h-4 mr-2 text-indigo-600" />
                Key Levels to Watch
              </h4>

              <div className="space-y-3">
                <div className="p-3 bg-gradient-to-r from-red-50 to-red-100 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-red-900">Resistance</span>
                    <TrendingUp className="w-4 h-4 text-red-600" />
                  </div>
                  <p className="text-lg font-bold text-red-900">{formatPrice(marketData.resistance)}</p>
                  <p className="text-xs text-red-700">
                    {((marketData.resistance - marketData.price) / marketData.price * 100).toFixed(1)}% above current
                  </p>
                </div>

                <div className="p-3 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-yellow-900">Current Price</span>
                    <Activity className="w-4 h-4 text-yellow-600" />
                  </div>
                  <p className="text-lg font-bold text-yellow-900">{formatPrice(marketData.price)}</p>
                  <p className={`text-xs ${marketData.changePercentage24h >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {marketData.changePercentage24h >= 0 ? '+' : ''}{marketData.changePercentage24h.toFixed(2)}% today
                  </p>
                </div>

                <div className="p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-green-900">Support</span>
                    <TrendingDown className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-lg font-bold text-green-900">{formatPrice(marketData.support)}</p>
                  <p className="text-xs text-green-700">
                    {((marketData.price - marketData.support) / marketData.price * 100).toFixed(1)}% below current
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Trading Tips */}
          <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
            <h5 className="font-medium text-indigo-900 mb-2 flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              Smart Trading Tips
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <p className="text-indigo-800">
                • Use position sizing to manage risk effectively
              </p>
              <p className="text-indigo-800">
                • Wait for clear signals before entering trades
              </p>
              <p className="text-indigo-800">
                • Set stop losses near support/resistance levels
              </p>
              <p className="text-indigo-800">
                • Consider market sentiment and volume trends
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};