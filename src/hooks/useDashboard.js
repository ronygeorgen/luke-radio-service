import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { 
  fetchDashboardStats, 
  setDateRange, 
  clearError,
  setSelectedPredefinedFilter,
  clearPredefinedFilter
} from '../store/slices/dashboardSlice';

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
    predefinedFilters: [],
    selectedPredefinedFilter: null,
    dateRange: {
      startDate: '',
      endDate: ''
    },
    loading: false,
    error: null
  });

  // Get showAllTopics from Redux store
  const showAllTopics = useSelector((state) => state.dashboardSettings?.showAllTopics || false);

  // Memoize the load function with predefinedFilterId parameter
  const loadDashboardData = useCallback((startDate, endDate, showAllTopicsParam = showAllTopics, predefinedFilterId = null) => {
    dispatch(fetchDashboardStats({ 
      startDate, 
      endDate, 
      showAllTopics: showAllTopicsParam,
      predefinedFilterId 
    }));
  }, [dispatch, showAllTopics]);

  // Add function to load predefined filters - FIXED
  const loadPredefinedFilters = useCallback((params = {}) => {
    // Import the action directly in the callback to avoid circular dependencies
    import('../store/slices/dashboardSlice').then(({ fetchPredefinedFilters }) => {
      dispatch(fetchPredefinedFilters(params));
    });
  }, [dispatch]);

  // Add function to select predefined filter
  const selectPredefinedFilter = useCallback((filter) => {
    dispatch(setSelectedPredefinedFilter(filter));
  }, [dispatch]);

  // Add function to clear predefined filter
  const clearPredefinedFilterSelection = useCallback(() => {
    dispatch(clearPredefinedFilter());
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
    predefinedFilters: dashboardState.predefinedFilters,
    selectedPredefinedFilter: dashboardState.selectedPredefinedFilter,
    dateRange: dashboardState.dateRange,
    loading: dashboardState.loading,
    error: dashboardState.error,
    showAllTopics,
    loadDashboardData,
    loadPredefinedFilters,
    selectPredefinedFilter,
    clearPredefinedFilterSelection,
    updateDateRange,
    clearDashboardError
  };
};