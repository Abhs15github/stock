export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  createdAt: string;
}

export interface TradingSession {
  id: string;
  userId: string;
  name: string;
  capital: number;
  totalTrades: number;
  accuracy: number;
  riskRewardRatio: number;
  status: 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  isLoading: boolean;
}

export interface SessionContextType {
  sessions: TradingSession[];
  createSession: (session: Omit<TradingSession, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; message: string; sessionId?: string }>;
  updateSession: (id: string, updates: Partial<TradingSession>) => Promise<{ success: boolean; message: string }>;
  deleteSession: (id: string) => Promise<{ success: boolean; message: string }>;
  getSessionStats: () => {
    total: number;
    active: number;
    completed: number;
  };
}

export interface Trade {
  id: string;
  userId: string;
  sessionId?: string; // Link trade to a session
  pairName: string;
  entryPrice: number;
  exitPrice?: number; // Optional for pending trades
  investment: number;
  date: string;
  type: 'buy' | 'sell';
  status: 'pending' | 'won' | 'lost'; // Trade status
  profitOrLoss: number;
  profitOrLossPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface TradeContextType {
  trades: Trade[];
  addTrade: (trade: Omit<Trade, 'id' | 'userId' | 'profitOrLoss' | 'profitOrLossPercentage' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; message: string }>;
  updateTrade: (id: string, updates: Partial<Trade>) => Promise<{ success: boolean; message: string }>;
  deleteTrade: (id: string) => Promise<{ success: boolean; message: string }>;
  recordTradeResult: (tradeId: string, result: 'won' | 'lost', riskRewardRatio: number) => Promise<{ success: boolean; message: string }>;
  reloadTrades: () => void;
  createNextPendingTrade: (sessionId: string, sessionCapital: number, riskPercent: number, riskRewardRatio: number, targetTrades: number) => Promise<{ success: boolean; message: string }>;
  getTradeStats: () => {
    totalTrades: number;
    totalProfit: number;
    totalLoss: number;
    profitPercentage: number;
    activeInvestment: number;
  };
  getSessionTrades: (sessionId: string) => Trade[];
}

export interface BBTCalculation {
  id: string;
  userId: string;
  calculationType: 'position-size' | 'risk-reward' | 'compound' | 'profit-loss' | 'entry-exit';
  inputs: Record<string, number>;
  result: number | BBTCalculationResult;
  createdAt: string;
}

export interface BBTCalculationResult {
  primary: number;
  secondary?: number;
  recommendation?: string;
  riskLevel?: 'low' | 'medium' | 'high';
  details?: Record<string, number | string>;
}

export interface BBTMarketData {
  price: number;
  change24h: number;
  changePercentage24h: number;
  volume24h: number;
  marketCap: number;
  support: number;
  resistance: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  rsi: number;
  volatility: number;
}

export interface TradeRecommendation {
  action: 'buy' | 'sell' | 'hold' | 'wait';
  confidence: 'low' | 'medium' | 'high';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskReward: number;
  reasoning: string[];
}

export interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  changePercentage24h: number;
  volume24h: number;
  timestamp: string;
}

export interface ChartData {
  date: string;
  price: number;
  volume?: number;
  high?: number;
  low?: number;
  open?: number;
  close?: number;
}