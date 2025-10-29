import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchTopics, setShowAllTopics } from '../../store/slices/dashboardSettingsSlice';
import CommonHeader from './CommonHeader';
import TopicManagement from './TopicManagement';
import ErrorDisplay from './ErrorDisplay';

const DashboardSettingsPage = () => {
  const dispatch = useDispatch();
  const { 
    topics, 
    loading: topicsLoading, 
    error: topicsError, 
    showAllTopics 
  } = useSelector((state) => state.dashboardSettings);

  useEffect(() => {
    dispatch(fetchTopics(showAllTopics));
  }, [dispatch, showAllTopics]);

  if (topicsLoading && topics.length === 0) {
    return (
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
        <CommonHeader 
          title="Topic Settings"
        />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
      <CommonHeader 
        title="Topic Settings"
      />

      <ErrorDisplay error={topicsError} />

      <TopicManagement />
    </div>
  );
};

export default DashboardSettingsPage;