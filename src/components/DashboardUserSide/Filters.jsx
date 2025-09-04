import { useState, useRef, useEffect } from "react";
import { Filter, Calendar, TrendingUp, RotateCcw } from "lucide-react";
import { useDashboard } from "../../hooks/useDashboard";
import { useDispatch } from "react-redux";
import { fetchShiftAnalytics } from "../../store/slices/shiftAnalyticsSlice";

const Filters = () => {
  const { dateRange = {}, loadDashboardData } = useDashboard();
  const dispatch = useDispatch(); // Add this

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(dateRange.startDate || "");
  const [tempEndDate, setTempEndDate] = useState(dateRange.endDate || "");
  const datePickerRef = useRef(null);

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleApply = () => {
    loadDashboardData(tempStartDate, tempEndDate);
    dispatch(fetchShiftAnalytics({ startDate: tempStartDate, endDate: tempEndDate })); // Add this
    setShowDatePicker(false);
  };

  const handleReset = () => {
    const today = new Date().toISOString().split("T")[0];
    setTempStartDate(today);
    setTempEndDate(today);
    loadDashboardData(today, today);
    dispatch(fetchShiftAnalytics({ startDate: today, endDate: today })); // Add this
  };

  const isTodaySelected = () => {
    const today = new Date().toISOString().split("T")[0];
    return dateRange.startDate === today && dateRange.endDate === today;
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target)
      ) {
        setShowDatePicker(false);
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
              {formatDateForDisplay(dateRange.startDate)} to{" "}
              {formatDateForDisplay(dateRange.endDate)}
              {isTodaySelected() && (
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  Today
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
                  onClick={handleApply}
                  className="mt-3 bg-blue-500 text-white px-3 py-1 rounded w-full hover:bg-blue-600"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          {/* Sentiment */}
          {/* <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Sentiment:</span>
            <span className="font-medium text-gray-900">0 to 100</span>
          </div> */}
        </div>

        {/* Reset Button */}
        <button
          onClick={handleReset}
          className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center space-x-1 transition-colors duration-200"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Show Today</span>
        </button>
      </div>
    </div>
  );
};

export default Filters;