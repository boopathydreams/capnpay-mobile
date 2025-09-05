import { useState, useEffect } from 'react';
import { apiService, DashboardOverview, DashboardInsights, SpendingTrend } from '../services/api';

export function useDashboard() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [insights, setInsights] = useState<DashboardInsights | null>(null);
  const [spendingTrend, setSpendingTrend] = useState<SpendingTrend[] | null>(null);
  const [loading, setLoading] = useState(false); // Start as false since we check auth first
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if authenticated before making requests
      if (!apiService.isAuthenticated()) {
        setError('Not authenticated');
        return;
      }

      const [overviewData, insightsData, trendData] = await Promise.all([
        apiService.getDashboardOverview(),
        apiService.getDashboardInsights(),
        apiService.getSpendingTrend(),
      ]);

      setOverview(overviewData);
      setInsights(insightsData);
      setSpendingTrend(trendData.trendData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if authenticated
    if (apiService.isAuthenticated()) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, []);

  return {
    overview,
    insights,
    spendingTrend,
    loading,
    error,
    refetch: fetchDashboardData,
  };
}

export function useTransactionHistory(params?: {
  from?: string;
  to?: string;
  category?: string;
  query?: string;
  limit?: number;
  offset?: number;
}) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiService.getTransactionHistory(params);
      setTransactions(data.items);
      setHasMore(data.hasMore);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
      console.error('Transaction history fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (apiService.isAuthenticated()) {
      fetchTransactions();
    }
  }, [JSON.stringify(params)]);

  return {
    transactions,
    loading,
    error,
    hasMore,
    total,
    refetch: fetchTransactions,
  };
}
