import { MarketData, ChartData, BBTCalculation } from '../types';
import { subDays, format } from 'date-fns';

// Mock market data generation
export const generateMockMarketData = (symbol: string): MarketData => {
  const basePrice = {
    'BBT': 0.0234,
    'BTC': 43250.50,
    'ETH': 2650.75,
    'BNB': 315.20,
    'ADA': 0.65,
    'SOL': 98.45,
    'MATIC': 0.85,
    'DOT': 7.80,
  }[symbol] || 1.0;

  const change24h = (Math.random() - 0.5) * basePrice * 0.1; // ±10% max change
  const changePercentage24h = (change24h / basePrice) * 100;

  return {
    symbol,
    price: basePrice + change24h,
    change24h,
    changePercentage24h,
    volume24h: Math.random() * 1000000000, // Random volume
    timestamp: new Date().toISOString(),
  };
};

// Generate chart data for the last 7 days
export const generateMockChartData = (symbol: string, days: number = 7): ChartData[] => {
  const data: ChartData[] = [];
  const basePrice = {
    'BBT': 0.0234,
    'BTC': 43250.50,
    'ETH': 2650.75,
    'BNB': 315.20,
    'ADA': 0.65,
    'SOL': 98.45,
    'MATIC': 0.85,
    'DOT': 7.80,
  }[symbol] || 1.0;

  let currentPrice = basePrice;

  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(new Date(), i);

    // Random price movement (±5% daily)
    const priceChange = (Math.random() - 0.5) * currentPrice * 0.1;
    currentPrice = Math.max(currentPrice + priceChange, basePrice * 0.5); // Don't go below 50% of base

    const high = currentPrice * (1 + Math.random() * 0.03); // Up to 3% higher
    const low = currentPrice * (1 - Math.random() * 0.03); // Up to 3% lower
    const open = low + Math.random() * (high - low);
    const close = low + Math.random() * (high - low);

    data.push({
      date: format(date, 'MMM dd'),
      price: currentPrice,
      volume: Math.random() * 1000000,
      high,
      low,
      open,
      close,
    });
  }

  return data;
};

// Generate mock BBT calculations
export const generateMockBBTCalculations = (userId: string, count: number = 5): BBTCalculation[] => {
  const calculationTypes: BBTCalculation['calculationType'][] = [
    'position-size',
    'risk-reward',
    'compound',
    'profit-loss'
  ];

  const calculations: BBTCalculation[] = [];

  for (let i = 0; i < count; i++) {
    const type = calculationTypes[Math.floor(Math.random() * calculationTypes.length)];
    let inputs: Record<string, number> = {};
    let result: number = 0;

    switch (type) {
      case 'position-size':
        inputs = {
          accountSize: 10000,
          riskPercentage: 2,
          entryPrice: 50,
          stopLoss: 45,
        };
        result = (inputs.accountSize * inputs.riskPercentage / 100) / (inputs.entryPrice - inputs.stopLoss);
        break;

      case 'risk-reward':
        inputs = {
          entryPrice: 100,
          stopLoss: 90,
          takeProfit: 120,
        };
        result = (inputs.takeProfit - inputs.entryPrice) / (inputs.entryPrice - inputs.stopLoss);
        break;

      case 'compound':
        inputs = {
          principal: 1000,
          rate: 10,
          time: 1,
          frequency: 12,
        };
        result = inputs.principal * Math.pow(1 + inputs.rate / 100 / inputs.frequency, inputs.frequency * inputs.time);
        break;

      case 'profit-loss':
        inputs = {
          entryPrice: 50,
          exitPrice: 55,
          quantity: 100,
        };
        result = (inputs.exitPrice - inputs.entryPrice) * inputs.quantity;
        break;
    }

    calculations.push({
      id: `calc_${Date.now()}_${i}`,
      userId,
      calculationType: type,
      inputs,
      result,
      createdAt: subDays(new Date(), Math.floor(Math.random() * 30)).toISOString(),
    });
  }

  return calculations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

// Market insights mock data
export const generateMarketInsights = () => {
  const insights = [
    {
      title: "BBT Token Shows Strong Support",
      content: "Technical analysis indicates BBT has established strong support at $0.022 level.",
      type: "bullish" as const,
      timestamp: new Date().toISOString(),
    },
    {
      title: "Bitcoin Consolidation Phase",
      content: "BTC continues to trade in a tight range, suggesting potential breakout incoming.",
      type: "neutral" as const,
      timestamp: subDays(new Date(), 1).toISOString(),
    },
    {
      title: "Ethereum Layer 2 Growth",
      content: "Layer 2 solutions continue to drive Ethereum adoption and reduce gas fees.",
      type: "bullish" as const,
      timestamp: subDays(new Date(), 2).toISOString(),
    },
  ];

  return insights;
};

// Portfolio performance mock data
export const generatePortfolioData = () => {
  const portfolioValue = 50000 + (Math.random() - 0.5) * 10000; // $45k - $55k
  const dayChange = (Math.random() - 0.5) * 2000; // ±$1k daily change
  const dayChangePercentage = (dayChange / portfolioValue) * 100;

  return {
    totalValue: portfolioValue,
    dayChange,
    dayChangePercentage,
    weekChange: dayChange * 5 + (Math.random() - 0.5) * 3000,
    monthChange: dayChange * 20 + (Math.random() - 0.5) * 8000,
  };
};

// Trading pairs for dropdown
export const TRADING_PAIRS = [
  { symbol: 'BBT', name: 'BBT Token', icon: '🔥' },
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿' },
  { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ' },
  { symbol: 'BNB', name: 'Binance Coin', icon: '🟡' },
  { symbol: 'ADA', name: 'Cardano', icon: '🔵' },
  { symbol: 'SOL', name: 'Solana', icon: '🟣' },
  { symbol: 'MATIC', name: 'Polygon', icon: '🟪' },
  { symbol: 'DOT', name: 'Polkadot', icon: '🔴' },
];

// TODO: Connect BBT API here for real market data
// TODO: Connect crypto data streaming APIs (CoinGecko, Binance)
// TODO: Replace mock calculations with real BBT calculation history