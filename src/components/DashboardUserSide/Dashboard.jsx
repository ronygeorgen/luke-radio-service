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
import { setShowAllTopics } from '../../store/slices/dashboardSettingsSlice';

function Dashboard() {
  const [activeTab, setActiveTab] = useState('main');
  const { loadDashboardData, loading, error, showAllTopics } = useDashboard();
  const dispatch = useDispatch();
  
  // Get shift analytics data from Redux store
  const shiftAnalytics = useSelector((state) => state.shiftAnalytics);
  
  useEffect(() => {
    // Load data for today only
    const today = new Date().toISOString().split('T')[0];
    
    // Load both dashboard and shift analytics data
    loadDashboardData(today, today, showAllTopics);
    dispatch(fetchShiftAnalytics({ startDate: today, endDate: today, showAllTopics }));
  }, [loadDashboardData, dispatch, showAllTopics]);

  // Handle loading state for both dashboard and shift analytics
  const isLoading = loading || (activeTab === 'shift' && shiftAnalytics.loading);
  
  // Handle error state for both dashboard and shift analytics
  const hasError = error || (activeTab === 'shift' && shiftAnalytics.error);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

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
      <Hero />
      <Filters />
      
      <ErrorBoundary><StatsCards /></ErrorBoundary>
      
      <AnalyticsTabs activeTab={activeTab} setActiveTab={setActiveTab}>
        {activeTab === 'main' ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
              <ErrorBoundary>
                <SentimentGauge />
              </ErrorBoundary>
              <div className="lg:col-span-2">
                <SentimentChart />
              </div>
            </div>
            
            <TopicsDistribution />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <WordCloud />
              <TopTopicsTable />
            </div>

            {/* <TranscriptionSummaries /> */}
          </>
        ) : (
          <>
            <ErrorBoundary>
              <ShiftCards />
            </ErrorBoundary>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <ErrorBoundary>
                <SentimentByShiftChart />
              </ErrorBoundary>
              <ErrorBoundary>
                <TranscriptionCountChart />
              </ErrorBoundary>
            </div>
            
            <ErrorBoundary>
              <TopTopicsByShift />
            </ErrorBoundary>
          </>
        )}
      </AnalyticsTabs>
    </main>
  );
}

export default Dashboard;