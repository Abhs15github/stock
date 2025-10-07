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
  createSession: (session: Omit<TradingSession, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; message: string }>;
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
  pairName: string;
  entryPrice: number;
  exitPrice: number;
  investment: number;
  date: string;
  type: 'buy' | 'sell';
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
  getTradeStats: () => {
    totalTrades: number;
    totalProfit: number;
    totalLoss: number;
    profitPercentage: number;
    activeInvestment: number;
  };
}

export interface BBTCalculation {
  id: string;
  userId: string;
  calculationType: 'position-size' | 'risk-reward' | 'compound' | 'profit-loss';
  inputs: Record<string, number>;
  result: number;
  createdAt: string;
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