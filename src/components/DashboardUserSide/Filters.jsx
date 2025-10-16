// Updated Filters.jsx
import { useState, useRef, useEffect } from "react";
import { Filter, Calendar, TrendingUp, RotateCcw, X } from "lucide-react";
import { useDashboard } from "../../hooks/useDashboard";
import { useDispatch } from "react-redux";
import { fetchShiftAnalytics } from "../../store/slices/shiftAnalyticsSlice";

const Filters = ({ showPredefined = true }) => {
  const { 
    dateRange = {}, 
    loadDashboardData, 
    predefinedFilters,
    selectedPredefinedFilter,
    loadPredefinedFilters,
    selectPredefinedFilter,
    clearPredefinedFilterSelection
  } = useDashboard();
  const dispatch = useDispatch();

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(
    dateRange.startDateOrDateTime ? dateRange.startDateOrDateTime.split(' ')[0] : ""
  );
  const [tempEndDate, setTempEndDate] = useState(
    dateRange.endDateOrDateTime ? dateRange.endDateOrDateTime.split(' ')[0] : ""
  );
  const datePickerRef = useRef(null);
  const filterDropdownRef = useRef(null);

  // Load predefined filters on component mount (only when shown)
  useEffect(() => {
    if (showPredefined) {
      loadPredefinedFilters();
    }
  }, [loadPredefinedFilters, showPredefined]);

  useEffect(() => {
    if (!dateRange.startDateOrDateTime && !dateRange.endDateOrDateTime) {
      const today = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);
      
      const formatDate = (date) => date.toISOString().split('T')[0];
      setTempStartDate(formatDate(sevenDaysAgo));
      setTempEndDate(formatDate(today));
    } else {
      setTempStartDate(dateRange.startDateOrDateTime ? dateRange.startDateOrDateTime.split(' ')[0] : "");
      setTempEndDate(dateRange.endDateOrDateTime ? dateRange.endDateOrDateTime.split(' ')[0] : "");
    }
  }, [dateRange]);

  const formatDateForDisplay = (dateTimeString) => {
    if (!dateTimeString) return "N/A";
    
    const dateString = dateTimeString.includes(' ') 
      ? dateTimeString.split(' ')[0] 
      : dateTimeString;
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "N/A";
    }
  };

  const handleApplyDateRange = () => {
    if (tempStartDate && tempEndDate) {
      loadDashboardData(
        tempStartDate, 
        tempEndDate, 
        undefined, // showAllTopics will use the default from hook
        showPredefined ? selectedPredefinedFilter?.id : null // pass only when enabled
      );
      dispatch(fetchShiftAnalytics({ 
        startDate: tempStartDate, 
        endDate: tempEndDate 
      }));
      setShowDatePicker(false);
    }
  };

  const handleFilterSelect = (filter) => {
    selectPredefinedFilter(filter);
    setShowFilterDropdown(false);
    
    // Apply the filter immediately
    if (tempStartDate && tempEndDate) {
      loadDashboardData(
        tempStartDate, 
        tempEndDate, 
        undefined, 
        filter.id
      );
      dispatch(fetchShiftAnalytics({ 
        startDate: tempStartDate, 
        endDate: tempEndDate 
      }));
    }
  };

  const handleClearFilter = () => {
    clearPredefinedFilterSelection();
    
    // Reload data without the filter
    if (tempStartDate && tempEndDate) {
      loadDashboardData(tempStartDate, tempEndDate);
      dispatch(fetchShiftAnalytics({ 
        startDate: tempStartDate, 
        endDate: tempEndDate 
      }));
    }
  };

  const handleReset = () => {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    const formatDate = (date) => date.toISOString().split('T')[0];
    const startDate = formatDate(sevenDaysAgo);
    const endDate = formatDate(today);
    
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    clearPredefinedFilterSelection();
    loadDashboardData(startDate, endDate);
    dispatch(fetchShiftAnalytics({ startDate, endDate }));
  };

  const isTodaySelected = () => {
    const today = new Date().toISOString().split('T')[0];
    const startDate = dateRange.startDateOrDateTime ? dateRange.startDateOrDateTime.split(' ')[0] : '';
    const endDate = dateRange.endDateOrDateTime ? dateRange.endDateOrDateTime.split(' ')[0] : '';
    return startDate === today && endDate === today;
  };

  const isLast7DaysSelected = () => {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    const formatDate = (date) => date.toISOString().split('T')[0];
    const expectedStartDate = formatDate(sevenDaysAgo);
    const expectedEndDate = formatDate(today);
    
    const startDate = dateRange.startDateOrDateTime ? dateRange.startDateOrDateTime.split(' ')[0] : '';
    const endDate = dateRange.endDateOrDateTime ? dateRange.endDateOrDateTime.split(' ')[0] : '';
    
    return startDate === expectedStartDate && endDate === expectedEndDate;
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target) &&
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target)
      ) {
        setShowDatePicker(false);
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          {/* Filters Label */}
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-700">Filters:</span>
          </div>

          {/* Predefined Filters Dropdown (optional) */}
          {showPredefined && (
            <div className="flex items-center space-x-2 relative" ref={filterDropdownRef}>
              <span className="text-sm text-gray-600">Predefined Filter:</span>
              <button
                onClick={() => setShowFilterDropdown((prev) => !prev)}
                className="font-medium text-gray-900 hover:text-blue-600 focus:outline-none flex items-center space-x-1"
              >
                <span>
                  {selectedPredefinedFilter ? selectedPredefinedFilter.name : "Select Filter"}
                </span>
                {selectedPredefinedFilter && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearFilter();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </button>

              {/* Predefined Filters Dropdown */}
              {showFilterDropdown && (
                <div className="absolute top-full left-0 mt-2 bg-white border rounded-lg shadow-lg z-20 p-2 w-64 max-h-60 overflow-y-auto">
                  {predefinedFilters.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      No filters available
                    </div>
                  ) : (
                    predefinedFilters.map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => handleFilterSelect(filter)}
                        className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 ${
                          selectedPredefinedFilter?.id === filter.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        <div className="font-medium">{filter.name}</div>
                        <div className="text-xs text-gray-500">
                          {filter.schedule_count} schedules • {filter.channel_name}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Date Range */}
          <div
            className="flex items-center space-x-2 relative"
            ref={datePickerRef}
          >
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Date Range:</span>
            <button
              onClick={() => setShowDatePicker((prev) => !prev)}
              className="font-medium text-gray-900 hover:text-blue-600 focus:outline-none"
            >
              {formatDateForDisplay(dateRange.startDateOrDateTime)} to{" "}
              {formatDateForDisplay(dateRange.endDateOrDateTime)}
              {isTodaySelected() && (
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  Today
                </span>
              )}
              {isLast7DaysSelected() && !isTodaySelected() && (
                <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  Last 7 Days
                </span>
              )}
            </button>

            {/* Date Picker Dropdown */}
            {showDatePicker && (
              <div className="absolute top-full left-0 mt-2 bg-white border rounded-lg shadow-lg z-20 p-4 w-72 sm:w-96">
                <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={tempStartDate}
                      onChange={(e) => setTempStartDate(e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={tempEndDate}
                      onChange={(e) => setTempEndDate(e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                    />
                  </div>
                </div>
                <button
                  onClick={handleApplyDateRange}
                  className="mt-3 bg-blue-500 text-white px-3 py-1 rounded w-full hover:bg-blue-600"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Reset Button */}
        <button
          onClick={handleReset}
          className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center space-x-1 transition-colors duration-200"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset</span>
        </button>
      </div>

      {/* Selected Filter Info (only when predefined is shown) */}
      {showPredefined && selectedPredefinedFilter && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium text-blue-900">
                {selectedPredefinedFilter.name}
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                {selectedPredefinedFilter.description}
              </p>
              <div className="flex items-center space-x-4 mt-2 text-xs text-blue-600">
                <span>Channel: {selectedPredefinedFilter.channel_name}</span>
                <span>Schedules: {selectedPredefinedFilter.schedule_count}</span>
                <span>Created by: {selectedPredefinedFilter.created_by_name}</span>
              </div>
            </div>
            <button
              onClick={handleClearFilter}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Clear Filter
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Filters;