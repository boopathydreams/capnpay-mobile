import { APP_CONFIG } from '../../constants/AppConstants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types for API responses
export interface User {
  id: string;
  phone: string;
  name?: string;
  spendingCap: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  capAmount?: number;
  softBlock: boolean;
  nearThresholdPct: number;
  spentMonthToDate: number;
  state: 'ok' | 'near' | 'over';
}

export interface CategorySpendingCap {
  name: string;
  spent: number;
  limit: number;
  progress: number; // percentage
  status: 'OK' | 'NEAR' | 'OVER';
  color: string;
}

export interface Transaction {
  id: string;
  amount: number;
  payeeName: string;
  category: string;
  date: string;
  status: 'success' | 'pending' | 'failed';
  vpa?: string;
  upiTxnRef?: string;
}

export interface DashboardOverview {
  userData: {
    totalSpent: number;
    monthlyLimit: number;
    safeToSpendToday: number;
    projectedMonthEnd?: number;
  };
  capsData: CategorySpendingCap[];
  upcomingBills: Array<{
    id?: string;
    name: string;
    amount: number;
    daysLeft?: number;
    dueDate?: string;
    category?: string;
  }>;
  recentActivity: Transaction[];
}

export interface DashboardInsights {
  month: string;
  totalSpent: number;
  prevDeltaPct: number;
  categories: Category[];
}

export interface SpendingTrend {
  month: string;
  spent: number;
}

class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = APP_CONFIG.api.baseUrl;
    this.loadToken();
  }

  private async loadToken() {
    try {
      this.token = await AsyncStorage.getItem('auth_token');
    } catch (error) {
      console.error('Failed to load auth token:', error);
    }
  }

  private async getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = await this.getHeaders();

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Authentication APIs
  async requestOtp(phone: string) {
    return this.makeRequest<{ ok: boolean; devCode?: string }>('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  async verifyOtp(phone: string, code: string) {
    const response = await this.makeRequest<{
      accessToken: string;
      refreshToken: string;
      user: {
        id: string;
        phone: string;
        name: string | null;
        avatarUrl: string | null;
        isOnboardingComplete: boolean;
        hasCategories: boolean;
      };
    }>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    });

    // Store the token
    this.token = response.accessToken;
    await AsyncStorage.setItem('auth_token', response.accessToken);
    await AsyncStorage.setItem('refresh_token', response.refreshToken);

    return response;
  }

  async completeOnboarding(name: string, spendingCap: number) {
    return this.makeRequest<{ ok: boolean }>('/onboarding/complete', {
      method: 'POST',
      body: JSON.stringify({ name, spendingCap }),
    });
  }

  // Dashboard APIs
  async getDashboardOverview(): Promise<DashboardOverview> {
    const result = await this.makeRequest<DashboardOverview>('/dashboard');
    console.log('📊 Dashboard API response:', JSON.stringify(result, null, 2));
    return result;
  }

  async getDashboardInsights(): Promise<DashboardInsights> {
    return this.makeRequest<DashboardInsights>('/dashboard/insights');
  }

  async getSpendingTrend(): Promise<{ trendData: SpendingTrend[] }> {
    return this.makeRequest<{ trendData: SpendingTrend[] }>('/dashboard/spending-trend');
  }

  // Categories APIs
  async getCategories(): Promise<Category[]> {
    return this.makeRequest<Category[]>('/categories');
  }

  async updateCategory(
    id: string,
    updates: Partial<Pick<Category, 'capAmount' | 'softBlock' | 'nearThresholdPct'>>,
  ) {
    return this.makeRequest<Category>(`/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // Payment APIs
  async createPaymentIntent(data: {
    amount: number;
    vpa: string;
    payeeName?: string;
    entrypoint: string;
    noteLong?: string;
  }) {
    return this.makeRequest('/pay-intents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async completePayment(
    trRef: string,
    data: {
      status: 'success' | 'failure' | 'pending' | 'manual';
      upi_txn_ref?: string;
    },
  ) {
    return this.makeRequest(`/pay-intents/${trRef}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Transaction History APIs
  async getTransactionHistory(params?: {
    from?: string;
    to?: string;
    category?: string;
    query?: string;
    limit?: number;
    offset?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const query = searchParams.toString();
    return this.makeRequest<{
      items: Transaction[];
      total: number;
      hasMore: boolean;
    }>(`/pay-intents/user/history${query ? `?${query}` : ''}`);
  }

  async getTransaction(id: string) {
    return this.makeRequest<Transaction>(`/transactions/${id}`);
  }

  // User APIs
  async getMe() {
    return this.makeRequest<{ user: User; categories: Category[] }>('/users/profile');
  }

  // Utility methods
  async logout() {
    this.token = null;
    await AsyncStorage.multiRemove(['auth_token', 'refresh_token']);
  }

  isAuthenticated() {
    return !!this.token;
  }
}

export const apiService = new ApiService();
