'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartData } from '../types';
import { generateMockChartData, TRADING_PAIRS } from '../utils/mockData';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MarketChartProps {
  className?: string;
}

export const MarketChart: React.FC<MarketChartProps> = ({ className = '' }) => {
  const [selectedSymbol, setSelectedSymbol] = useState('BBT');
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadChartData = async () => {
      setIsLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // TODO: Replace with real API call
      const data = generateMockChartData(selectedSymbol);
      setChartData(data);
      setIsLoading(false);
    };

    loadChartData();
  }, [selectedSymbol]);

  const currentPrice = chartData[chartData.length - 1]?.price || 0;
  const previousPrice = chartData[chartData.length - 2]?.price || 0;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercentage = previousPrice > 0 ? (priceChange / previousPrice) * 100 : 0;
  const isPositive = priceChange >= 0;

  const formatPrice = (price: number) => {
    if (selectedSymbol === 'BBT') {
      return `$${price.toFixed(6)}`;
    }
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`card ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Market Insights</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-gray-900">
                {formatPrice(currentPrice)}
              </span>
              <div className={`flex items-center space-x-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                  {isPositive ? '+' : ''}{priceChangePercentage.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 sm:mt-0">
          <select
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="input-field text-sm"
          >
            {TRADING_PAIRS.map((pair) => (
              <option key={pair.symbol} value={pair.symbol}>
                {pair.icon} {pair.name} ({pair.symbol})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="h-64">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
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
                tickFormatter={(value) => selectedSymbol === 'BBT' ? value.toFixed(6) : value.toFixed(0)}
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
              <Line
                type="monotone"
                dataKey="price"
                stroke={isPositive ? "#10b981" : "#ef4444"}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: isPositive ? "#10b981" : "#ef4444" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
};