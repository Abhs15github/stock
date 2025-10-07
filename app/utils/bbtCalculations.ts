import { BBTCalculationResult, BBTMarketData, TradeRecommendation } from '../types';

// Position Size Calculator for BBT
export const calculatePositionSize = (inputs: {
  accountSize: number;
  riskPercentage: number;
  entryPrice: number;
  stopLossPrice: number;
}): BBTCalculationResult => {
  const { accountSize, riskPercentage, entryPrice, stopLossPrice } = inputs;

  if (entryPrice <= stopLossPrice) {
    throw new Error('Entry price must be higher than stop loss price for long positions');
  }

  const riskAmount = accountSize * (riskPercentage / 100);
  const riskPerBBT = entryPrice - stopLossPrice;
  const positionSize = riskAmount / riskPerBBT;
  const positionValue = positionSize * entryPrice;
  const percentageOfAccount = (positionValue / accountSize) * 100;

  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  let recommendation = '';

  if (riskPercentage > 5) {
    riskLevel = 'high';
    recommendation = 'High risk - consider reducing position size';
  } else if (riskPercentage > 2) {
    riskLevel = 'medium';
    recommendation = 'Moderate risk - acceptable for experienced traders';
  } else {
    riskLevel = 'low';
    recommendation = 'Conservative position - good for risk management';
  }

  return {
    primary: positionSize,
    secondary: positionValue,
    recommendation,
    riskLevel,
    details: {
      positionSizeBBT: positionSize,
      positionValueUSD: positionValue,
      riskAmount: riskAmount,
      percentageOfAccount: percentageOfAccount,
      riskPerBBT: riskPerBBT
    }
  };
};

// Risk-Reward Calculator for BBT
export const calculateRiskReward = (inputs: {
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  positionSize?: number;
}): BBTCalculationResult => {
  const { entryPrice, stopLossPrice, takeProfitPrice, positionSize = 1 } = inputs;

  const risk = (entryPrice - stopLossPrice) * positionSize;
  const reward = (takeProfitPrice - entryPrice) * positionSize;
  const riskRewardRatio = reward / risk;

  let riskLevel: 'low' | 'medium' | 'high' = 'medium';
  let recommendation = '';

  if (riskRewardRatio >= 3) {
    riskLevel = 'low';
    recommendation = 'Excellent risk-reward ratio - favorable trade setup';
  } else if (riskRewardRatio >= 2) {
    riskLevel = 'medium';
    recommendation = 'Good risk-reward ratio - acceptable trade';
  } else if (riskRewardRatio >= 1) {
    riskLevel = 'high';
    recommendation = 'Low risk-reward ratio - consider better entry/exit points';
  } else {
    riskLevel = 'high';
    recommendation = 'Poor risk-reward ratio - avoid this trade';
  }

  return {
    primary: riskRewardRatio,
    secondary: reward,
    recommendation,
    riskLevel,
    details: {
      riskAmount: Math.abs(risk),
      rewardAmount: reward,
      riskRewardRatio: riskRewardRatio,
      breakEvenWinRate: (1 / (1 + riskRewardRatio)) * 100
    }
  };
};

// Compound Growth Calculator for BBT
export const calculateCompoundGrowth = (inputs: {
  initialInvestment: number;
  monthlyContribution: number;
  annualReturnRate: number;
  years: number;
  compoundingFrequency: number; // 1=yearly, 12=monthly, 365=daily
}): BBTCalculationResult => {
  const { initialInvestment, monthlyContribution, annualReturnRate, years, compoundingFrequency } = inputs;

  const rate = annualReturnRate / 100;
  const periodsPerYear = compoundingFrequency;
  const totalPeriods = years * periodsPerYear;
  const periodicRate = rate / periodsPerYear;

  // Compound interest on initial investment
  const compoundedInitial = initialInvestment * Math.pow(1 + periodicRate, totalPeriods);

  // Future value of monthly contributions (annuity)
  const monthlyRate = rate / 12;
  const monthlyPeriods = years * 12;
  const futureValueContributions = monthlyContribution *
    ((Math.pow(1 + monthlyRate, monthlyPeriods) - 1) / monthlyRate);

  const totalValue = compoundedInitial + futureValueContributions;
  const totalContributions = initialInvestment + (monthlyContribution * monthlyPeriods);
  const totalGains = totalValue - totalContributions;

  let recommendation = '';
  if (annualReturnRate >= 15) {
    recommendation = 'Aggressive growth strategy - high potential but consider volatility';
  } else if (annualReturnRate >= 8) {
    recommendation = 'Balanced growth approach - good long-term potential';
  } else {
    recommendation = 'Conservative strategy - lower risk but modest returns';
  }

  return {
    primary: totalValue,
    secondary: totalGains,
    recommendation,
    riskLevel: annualReturnRate >= 15 ? 'high' : annualReturnRate >= 8 ? 'medium' : 'low',
    details: {
      totalValue: totalValue,
      totalContributions: totalContributions,
      totalGains: totalGains,
      returnOnInvestment: (totalGains / totalContributions) * 100
    }
  };
};

// Profit/Loss Calculator for BBT trades
export const calculateProfitLoss = (inputs: {
  entryPrice: number;
  currentPrice: number;
  positionSize: number;
  tradeType: 'long' | 'short';
  fees?: number;
}): BBTCalculationResult => {
  const { entryPrice, currentPrice, positionSize, tradeType, fees = 0 } = inputs;

  let pnl: number;
  if (tradeType === 'long') {
    pnl = (currentPrice - entryPrice) * positionSize;
  } else {
    pnl = (entryPrice - currentPrice) * positionSize;
  }

  const pnlAfterFees = pnl - fees;
  const pnlPercentage = (pnl / (entryPrice * positionSize)) * 100;
  const positionValue = currentPrice * positionSize;

  let recommendation = '';
  if (pnlPercentage > 10) {
    recommendation = 'Strong profit - consider taking some profits';
  } else if (pnlPercentage > 5) {
    recommendation = 'Good profit - monitor for exit opportunities';
  } else if (pnlPercentage > -5) {
    recommendation = 'Position near break-even - wait for clear direction';
  } else if (pnlPercentage > -10) {
    recommendation = 'Small loss - consider your stop loss strategy';
  } else {
    recommendation = 'Significant loss - review risk management';
  }

  return {
    primary: pnlAfterFees,
    secondary: pnlPercentage,
    recommendation,
    riskLevel: Math.abs(pnlPercentage) > 10 ? 'high' : Math.abs(pnlPercentage) > 5 ? 'medium' : 'low',
    details: {
      unrealizedPnL: pnl,
      pnlAfterFees: pnlAfterFees,
      pnlPercentage: pnlPercentage,
      positionValue: positionValue,
      breakEvenPrice: entryPrice
    }
  };
};

// Entry/Exit Point Optimizer
export const optimizeEntryExit = (inputs: {
  targetPrice: number;
  marketData: BBTMarketData;
  riskTolerance: 'low' | 'medium' | 'high';
  timeframe: 'short' | 'medium' | 'long';
}): BBTCalculationResult => {
  const { targetPrice, marketData, riskTolerance, timeframe } = inputs;

  const currentPrice = marketData.price;
  const support = marketData.support;
  const resistance = marketData.resistance;

  // Calculate optimal entry based on risk tolerance
  let optimalEntry: number;
  let stopLoss: number;
  let takeProfit: number;

  if (targetPrice > currentPrice) {
    // Bullish scenario
    switch (riskTolerance) {
      case 'low':
        optimalEntry = support + (currentPrice - support) * 0.2;
        stopLoss = support * 0.95;
        takeProfit = Math.min(targetPrice, resistance * 0.95);
        break;
      case 'medium':
        optimalEntry = currentPrice * 0.99;
        stopLoss = support * 0.98;
        takeProfit = targetPrice;
        break;
      case 'high':
        optimalEntry = currentPrice * 1.01;
        stopLoss = currentPrice * 0.95;
        takeProfit = targetPrice * 1.05;
        break;
    }
  } else {
    // Bearish scenario (short)
    switch (riskTolerance) {
      case 'low':
        optimalEntry = resistance - (resistance - currentPrice) * 0.2;
        stopLoss = resistance * 1.05;
        takeProfit = Math.max(targetPrice, support * 1.05);
        break;
      case 'medium':
        optimalEntry = currentPrice * 1.01;
        stopLoss = resistance * 1.02;
        takeProfit = targetPrice;
        break;
      case 'high':
        optimalEntry = currentPrice * 0.99;
        stopLoss = currentPrice * 1.05;
        takeProfit = targetPrice * 0.95;
        break;
    }
  }

  const riskReward = Math.abs(takeProfit - optimalEntry) / Math.abs(optimalEntry - stopLoss);

  let recommendation = '';
  if (riskReward >= 3) {
    recommendation = 'Excellent setup - proceed with confidence';
  } else if (riskReward >= 2) {
    recommendation = 'Good setup - acceptable risk-reward';
  } else {
    recommendation = 'Marginal setup - wait for better opportunity';
  }

  return {
    primary: optimalEntry,
    secondary: riskReward,
    recommendation,
    riskLevel: riskTolerance,
    details: {
      optimalEntry: optimalEntry,
      stopLoss: stopLoss,
      takeProfit: takeProfit,
      riskRewardRatio: riskReward,
      expectedGain: Math.abs(takeProfit - optimalEntry),
      maxLoss: Math.abs(optimalEntry - stopLoss)
    }
  };
};

// Generate BBT-specific trade recommendation
export const generateBBTRecommendation = (marketData: BBTMarketData): TradeRecommendation => {
  const { price, trend, rsi, volatility, support, resistance } = marketData;

  let action: 'buy' | 'sell' | 'hold' | 'wait' = 'wait';
  let confidence: 'low' | 'medium' | 'high' = 'low';
  const reasoning: string[] = [];

  // Price position analysis
  const pricePosition = (price - support) / (resistance - support);

  if (trend === 'bullish') {
    reasoning.push('BBT is in a bullish trend');
    if (rsi < 30) {
      action = 'buy';
      confidence = 'high';
      reasoning.push('RSI indicates oversold conditions - good buying opportunity');
    } else if (rsi < 50 && pricePosition < 0.3) {
      action = 'buy';
      confidence = 'medium';
      reasoning.push('Price near support with room for upward movement');
    } else if (rsi > 70) {
      action = 'hold';
      confidence = 'medium';
      reasoning.push('RSI indicates overbought - wait for pullback');
    }
  } else if (trend === 'bearish') {
    reasoning.push('BBT is in a bearish trend');
    if (rsi > 70) {
      action = 'sell';
      confidence = 'high';
      reasoning.push('RSI indicates overbought in bearish trend - sell signal');
    } else if (pricePosition > 0.7) {
      action = 'sell';
      confidence = 'medium';
      reasoning.push('Price near resistance in bearish trend');
    }
  } else {
    reasoning.push('BBT is in neutral trend - wait for clear direction');
    if (pricePosition < 0.2 && rsi < 40) {
      action = 'buy';
      confidence = 'low';
      reasoning.push('Price near support - potential reversal');
    } else if (pricePosition > 0.8 && rsi > 60) {
      action = 'sell';
      confidence = 'low';
      reasoning.push('Price near resistance - potential reversal');
    }
  }

  // Volatility considerations
  if (volatility > 15) {
    reasoning.push('High volatility - use smaller position sizes');
    if (confidence === 'high') confidence = 'medium';
  }

  // Calculate suggested entry/exit points
  const entryPrice = action === 'buy' ? price * 0.995 : price * 1.005;
  const stopLoss = action === 'buy' ? support * 0.98 : resistance * 1.02;
  const takeProfit = action === 'buy' ? resistance * 0.95 : support * 1.05;
  const riskReward = Math.abs(takeProfit - entryPrice) / Math.abs(entryPrice - stopLoss);

  return {
    action,
    confidence,
    entryPrice,
    stopLoss,
    takeProfit,
    riskReward,
    reasoning
  };
};

// Mock BBT market data generator
export const generateBBTMarketData = (): BBTMarketData => {
  const basePrice = 0.0234;
  const change24h = (Math.random() - 0.5) * basePrice * 0.15; // ±15% max change
  const price = basePrice + change24h;

  return {
    price,
    change24h,
    changePercentage24h: (change24h / basePrice) * 100,
    volume24h: Math.random() * 10000000 + 1000000, // 1M - 11M
    marketCap: price * 1000000000, // 1B tokens
    support: price * (0.85 + Math.random() * 0.1), // 85-95% of current price
    resistance: price * (1.05 + Math.random() * 0.1), // 105-115% of current price
    trend: Math.random() > 0.6 ? 'bullish' : Math.random() > 0.3 ? 'neutral' : 'bearish',
    rsi: Math.random() * 100,
    volatility: Math.random() * 20 + 5 // 5-25%
  };
};

// Generate mock chart data for visualization
export const generateMockChartData = (symbol: string, days: number = 30) => {
  const data = [];
  const basePrice = symbol === 'BBT' ? 0.0234 : 50;
  let currentPrice = basePrice;

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i));

    // Add some realistic price movement
    const change = (Math.random() - 0.5) * 0.05 * currentPrice; // ±5% daily max
    currentPrice = Math.max(currentPrice + change, basePrice * 0.5); // Prevent going below 50% of base

    data.push({
      date: date.toLocaleDateString(),
      price: currentPrice,
      volume: Math.random() * 1000000 + 100000
    });
  }

  return data;
};

// Generate mock BBT calculations for dashboard
export const generateMockBBTCalculations = () => {
  const calculations = [];
  const types = ['position-size', 'risk-reward', 'compound', 'profit-loss', 'entry-exit'];

  for (let i = 0; i < 5; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    calculations.push({
      id: `calc-${Date.now()}-${i}`,
      userId: 'demo-user',
      calculationType: types[Math.floor(Math.random() * types.length)] as 'position-size' | 'risk-reward' | 'compound' | 'profit-loss' | 'entry-exit',
      inputs: {},
      result: Math.random() * 1000,
      createdAt: date.toISOString()
    });
  }

  return calculations;
};