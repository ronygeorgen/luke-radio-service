import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Hero from './Hero';
import Filters from './Filters';
import StatsCards from './StatsCards';
import ShiftCards from './ShiftCards';
import AnalyticsTabs from './AnalyticsTabs';
import SentimentGauge from './SentimentGauge';
import SentimentChart from './SentimentChart';
import SentimentByShiftChart from './SentimentByShiftChart';
import TranscriptionCountChart from './TranscriptionCountChart';
import TopicsDistribution from './TopicsDistribution';
import WordCloud from './WordCloud';
import TopTopicsTable from './TopTopicsTable';
import TopTopicsByShift from './TopTopicsByShift';
import TranscriptionSummaries from './TranscriptionSummaries';
import { useDashboard } from '../../hooks/useDashboard';
import { fetchShiftAnalytics } from '../../store/slices/shiftAnalyticsSlice';
import ErrorBoundary from '../ErrorBoundary';
import TopicModal from './TopicModal';

function Dashboard() {
  const [activeTab, setActiveTab] = useState('main');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { loadDashboardData, loading, error, showAllTopics } = useDashboard();
  const dispatch = useDispatch();
  
  // Get shift analytics data from Redux store
  const shiftAnalytics = useSelector((state) => state.shiftAnalytics);
  
  useEffect(() => {
    // Calculate default date range: last 7 days from today
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    // Format dates as YYYY-MM-DD
    const formatDate = (date) => date.toISOString().split('T')[0];
    const startDate = formatDate(sevenDaysAgo);
    const endDate = formatDate(today);
    
    // Load both dashboard and shift analytics data with 7-day range
    const loadData = async () => {
      await loadDashboardData(startDate, endDate, showAllTopics);
      await dispatch(fetchShiftAnalytics({ startDate, endDate, showAllTopics }));
      setIsInitialLoad(false);
    };
    
    loadData();
  }, [loadDashboardData, dispatch, showAllTopics]);

  // Handle loading state for both dashboard and shift analytics
  const isLoading = loading || (activeTab === 'shift' && shiftAnalytics.loading);
  
  // Handle error state for both dashboard and shift analytics
  const hasError = error || (activeTab === 'shift' && shiftAnalytics.error);

  const handleToggleChange = (isLoading) => {
    setIsRefreshing(isLoading);
  };

  if (hasError) {
    const errorMessage = error || shiftAnalytics.error;
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {errorMessage}
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Hero onToggleChange={handleToggleChange} />
      <AnalyticsTabs activeTab={activeTab} setActiveTab={setActiveTab}>
      
      
      <TopicModal />
      
        {activeTab === 'main' ? (
          <>
          <Filters />
          <ErrorBoundary>
            <StatsCards isLoading={isRefreshing || isLoading} />
          </ErrorBoundary>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
              <ErrorBoundary>
                <SentimentGauge isLoading={isRefreshing || isLoading} />
              </ErrorBoundary>
              <div className="lg:col-span-2">
                <SentimentChart isLoading={isRefreshing || isLoading} />
              </div>
            </div>
            
            <ErrorBoundary>
              <TopicsDistribution isLoading={isRefreshing || isLoading} />
            </ErrorBoundary>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <ErrorBoundary>
                <WordCloud isLoading={isRefreshing || isLoading} />
              </ErrorBoundary>
              <ErrorBoundary>
                <TopTopicsTable isLoading={isRefreshing || isLoading} />
              </ErrorBoundary>
            </div>

            {/* <TranscriptionSummaries /> */}
          </>
        ) : (
          <>
            <Filters showPredefined={false} />
            <ErrorBoundary>
              <ShiftCards isLoading={isRefreshing || isLoading} />
            </ErrorBoundary>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <ErrorBoundary>
                <SentimentByShiftChart isLoading={isRefreshing || isLoading} />
              </ErrorBoundary>
              <ErrorBoundary>
                <TranscriptionCountChart isLoading={isRefreshing || isLoading} />
              </ErrorBoundary>
            </div>
            
            <ErrorBoundary>
              <TopTopicsByShift isLoading={isRefreshing || isLoading} />
            </ErrorBoundary>
          </>
        )}
      </AnalyticsTabs>
    </main>
  );
}

export default Dashboard;