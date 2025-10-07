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