import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchTopics, setShowAllTopics } from '../../store/slices/dashboardSettingsSlice';
import {
  fetchShifts,
  fetchPredefinedFilters,
  setCurrentView,
  clearError
} from '../../store/slices/shiftManagementSlice';
import CommonHeader from './CommonHeader';
import NavigationTabs from './NavigationTabs';
import TopicManagement from './TopicManagement';
import ShiftManagement from './ShiftManagement';
import PredefinedFilters from './PredefinedFilters';
import ErrorDisplay from './ErrorDisplay';
import LoadingSpinner from './LoadingSpinner';

const DashboardSettingsPage = () => {
  const dispatch = useDispatch();
  const { 
    topics, 
    loading: topicsLoading, 
    error: topicsError, 
    showAllTopics 
  } = useSelector((state) => state.dashboardSettings);
  
  const {
    shifts,
    predefinedFilters,
    loading: shiftLoading,
    error: shiftError,
    currentView
  } = useSelector((state) => state.shiftManagement);

  const error = topicsError || shiftError;
  const loading = topicsLoading || shiftLoading;

  useEffect(() => {
    if (currentView === 'topics') {
      dispatch(fetchTopics(showAllTopics));
    } else if (currentView === 'shifts') {
      dispatch(fetchShifts({ is_active: true }));
    } else if (currentView === 'predefined-filters') {
      dispatch(fetchPredefinedFilters());
    }
  }, [dispatch, currentView, showAllTopics]);

  const renderCurrentView = () => {
    switch (currentView) {
      case 'topics':
        return <TopicManagement />;
      case 'shifts':
        return <ShiftManagement />;
      case 'predefined-filters':
        return <PredefinedFilters />;
      default:
        return <TopicManagement />;
    }
  };



  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <CommonHeader 
        title="Settings Management"
        subtitle="Manage topics, shifts, and predefined filters"
      />

      <ErrorDisplay error={error} />

      <NavigationTabs />

      {renderCurrentView()}
    </div>
  );
};

export default DashboardSettingsPage;