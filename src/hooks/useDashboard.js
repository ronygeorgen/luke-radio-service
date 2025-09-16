import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
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

  // Get showAllTopics from Redux store
  const showAllTopics = useSelector((state) => state.dashboardSettings?.showAllTopics || false);

  // Memoize the load function with showAllTopics parameter
  const loadDashboardData = useCallback((startDate, endDate, showAllTopicsParam = showAllTopics) => {
    dispatch(fetchDashboardStats({ 
      startDate, 
      endDate, 
      showAllTopics: showAllTopicsParam 
    }));
  }, [dispatch, showAllTopics]); // Add showAllTopics to dependencies

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
    showAllTopics, // Return showAllTopics for use in components
    loadDashboardData,
    updateDateRange,
    clearDashboardError
  };
};