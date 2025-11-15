// API client for backend server
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class APIClient {
  private baseURL: string;
  private userId: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;

    // Load userId from localStorage if available
    if (typeof window !== 'undefined') {
      const storedUserId = localStorage.getItem('bbt_user_id');
      if (storedUserId) {
        this.userId = storedUserId;
      }
    }
  }

  setUserId(userId: string | null) {
    this.userId = userId;
    if (typeof window !== 'undefined') {
      if (userId) {
        localStorage.setItem('bbt_user_id', userId);
      } else {
        localStorage.removeItem('bbt_user_id');
      }
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers = new Headers({
      'Content-Type': 'application/json',
    });

    if (options.headers) {
      const incomingHeaders = new Headers(options.headers);
      incomingHeaders.forEach((value, key) => {
        headers.set(key, value);
      });
    }

    if (this.userId) {
      headers.set('x-user-id', this.userId);
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  }

  // Auth endpoints
  async login(username: string, password: string) {
    const data = await this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (data.success && data.user) {
      this.setUserId(data.user.id);
    }

    return data;
  }

  async verifySession() {
    return this.request<any>('/auth/verify');
  }

  logout() {
    this.setUserId(null);
  }

  // Session endpoints
  async getSessions() {
    return this.request<any>('/sessions');
  }

  async createSession(sessionData: any) {
    return this.request<any>('/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  async updateSession(id: string, updates: any) {
    return this.request<any>(`/sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteSession(id: string) {
    return this.request<any>(`/sessions/${id}`, {
      method: 'DELETE',
    });
  }

  // Trade endpoints
  async getTrades() {
    return this.request<any>('/trades');
  }

  async getSessionTrades(sessionId: string) {
    return this.request<any>(`/trades/session/${sessionId}`);
  }

  async createTrade(tradeData: any) {
    return this.request<any>('/trades', {
      method: 'POST',
      body: JSON.stringify(tradeData),
    });
  }

  async createTrades(trades: any[]) {
    return this.request<any>('/trades/bulk', {
      method: 'POST',
      body: JSON.stringify({ trades }),
    });
  }

  async updateTrade(id: string, updates: any) {
    return this.request<any>(`/trades/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteTrade(id: string) {
    return this.request<any>(`/trades/${id}`, {
      method: 'DELETE',
    });
  }

  // Calculation endpoints
  async getCalculations() {
    return this.request<any>('/calculations');
  }

  async saveCalculation(calculationData: any) {
    return this.request<any>('/calculations', {
      method: 'POST',
      body: JSON.stringify(calculationData),
    });
  }

  async deleteCalculation(id: string) {
    return this.request<any>(`/calculations/${id}`, {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck() {
    return this.request<any>('/health');
  }
}

export const apiClient = new APIClient(API_BASE_URL);
