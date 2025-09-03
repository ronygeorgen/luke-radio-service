import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react'; // Add this import
import { fetchDashboardStats, setDateRange, clearError } from '../store/slices/dashboardSlice';

export const useDashboard = () => {
  const dispatch = useDispatch();
  
  const dashboardState = useSelector((state) => state.dashboard || {
    stats: {
      totalTranscriptions: 0,
      avgSentimentScore: 0,
      uniqueTopics: 0,
      activeShifts: 0
    },
    topicsDistribution: [],
    topTopicsRanking: [],
    sentimentData: [],
    dateRange: {
      startDate: '',
      endDate: ''
    },
    loading: false,
    error: null
  });

  // Memoize the load function
  const loadDashboardData = useCallback((startDate, endDate) => {
    dispatch(fetchDashboardStats({ startDate, endDate }));
  }, [dispatch]);

  const updateDateRange = useCallback((dateRange) => {
    dispatch(setDateRange(dateRange));
  }, [dispatch]);

  const clearDashboardError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    stats: dashboardState.stats,
    topicsDistribution: dashboardState.topicsDistribution,
    topTopicsRanking: dashboardState.topTopicsRanking,
    sentimentData: dashboardState.sentimentData,
    dateRange: dashboardState.dateRange,
    loading: dashboardState.loading,
    error: dashboardState.error,
    loadDashboardData,
    updateDateRange,
    clearDashboardError
  };
};