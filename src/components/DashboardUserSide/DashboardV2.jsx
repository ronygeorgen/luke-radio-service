import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, BarChart3, TrendingUp, Users, Heart, Sparkles, Target, Activity, Menu, X, Filter, Download, Upload } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { fetchReportFolders } from '../../store/slices/reportSlice';
import { axiosInstance } from '../../services/api';
import { convertLocalToUTC } from '../../utils/dateTimeUtils';
import OverallSummarySlideV2 from './DashboardV2Slides/OverallSummarySlideV2';
import ImpactIndexSlide from './DashboardV2Slides/ImpactIndexSlide';
import PersonalSlide from './DashboardV2Slides/PersonalSlide';
import CommunitySlide from './DashboardV2Slides/CommunitySlide';
import SpiritualSlide from './DashboardV2Slides/SpiritualSlide';
import TopTopicsSlide from './DashboardV2Slides/TopTopicsSlide';
import EntityComparisonSlide from './DashboardV2Slides/EntityComparisonSlide';
import WordCloudSlide from './DashboardV2Slides/WordCloudSlide';
import DashboardV2Filters from './DashboardV2Filters';
import ChannelSwitcher from '../ChannelSwitcher';
import UploadCustomAudioModal from '../UploadCustomAudioModal';

const slides = [
  {
    id: 'overall',
    title: 'Overall Summary',
    icon: BarChart3,
    component: OverallSummarySlideV2,
    headerBg: 'from-gray-700 to-gray-800',
    containerBg: 'from-gray-600 via-gray-700 to-gray-800',
    headerText: 'text-white',
    headerBorder: 'border-gray-600'
  },
  {
    id: 'impact',
    title: 'Impact Index',
    icon: Target,
    component: ImpactIndexSlide,
    headerBg: 'from-blue-900 to-blue-800',
    containerBg: 'from-blue-900 via-blue-800 to-blue-900',
    headerText: 'text-white',
    headerBorder: 'border-blue-700'
  },
  {
    id: 'personal',
    title: 'Personal',
    icon: Heart,
    component: PersonalSlide,
    headerBg: 'from-blue-100 to-blue-200',
    containerBg: 'from-blue-50 to-blue-100',
    headerText: 'text-gray-900',
    headerBorder: 'border-blue-300'
  },
  {
    id: 'community',
    title: 'Community',
    icon: Users,
    component: CommunitySlide,
    headerBg: 'from-teal-100 to-teal-200',
    containerBg: 'from-teal-50 to-teal-100',
    headerText: 'text-gray-900',
    headerBorder: 'border-teal-300'
  },
  {
    id: 'spiritual',
    title: 'Spiritual',
    icon: Sparkles,
    component: SpiritualSlide,
    headerBg: 'from-blue-100 to-blue-200',
    containerBg: 'from-blue-50 to-blue-100',
    headerText: 'text-gray-900',
    headerBorder: 'border-blue-300'
  },
  {
    id: 'topics',
    title: 'Top Topics',
    icon: TrendingUp,
    component: TopTopicsSlide,
    headerBg: 'from-teal-100 to-teal-200',
    containerBg: 'from-teal-50 to-teal-100',
    headerText: 'text-gray-900',
    headerBorder: 'border-teal-300'
  },
  {
    id: 'entities',
    title: 'Entity Comparison',
    icon: Activity,
    component: EntityComparisonSlide,
    headerBg: 'from-blue-100 to-blue-200',
    containerBg: 'from-blue-50 to-blue-100',
    headerText: 'text-gray-900',
    headerBorder: 'border-blue-300'
  },
  {
    id: 'wordcloud',
    title: 'Word Cloud',
    icon: Sparkles,
    component: WordCloudSlide,
    headerBg: 'from-gray-900 to-black',
    containerBg: 'from-black to-gray-900',
    headerText: 'text-white',
    headerBorder: 'border-gray-800'
  },
];

const SLIDE_TRANSITION_MS = 220;

function DashboardV2() {
  // Load saved slide from localStorage or default to 0
  const getInitialSlide = () => {
    const savedSlide = localStorage.getItem('dashboardV2CurrentSlide');
    if (savedSlide !== null) {
      const slideIndex = parseInt(savedSlide, 10);
      // Validate the saved index is still valid
      if (!isNaN(slideIndex) && slideIndex >= 0 && slideIndex < slides.length) {
        return slideIndex;
      }
    }
    return 0;
  };

  const [currentSlide, setCurrentSlide] = useState(getInitialSlide);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNavMenuVisible, setIsNavMenuVisible] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const dropdownRef = useRef(null);
  const isNavigatingRef = useRef(false);
  const slideContentRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { folders } = useSelector((state) => state.reports);
  const [searchParams] = useSearchParams();
  const reportFolderId = searchParams.get('report_folder_id');
  // Query params for initial filter: start_time, end_time (date or datetime), shift_id
  const startTimeParam = searchParams.get('start_time');
  const endTimeParam = searchParams.get('end_time');
  const shiftIdParam = searchParams.get('shift_id');
  // When true (e.g. ?hideUI=true), hide header, nav arrows, and slide menu for clean screenshots/PDF.
  // Read from both searchParams and window.location so hideUI is respected even with other params (e.g. report_folder_id).
  const hideUIRaw = searchParams.get('hideUI') ?? (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('hideUI') : null);
  const hideUI = String(hideUIRaw ?? '').toLowerCase() === 'true';

  // Helper: extract YYYY-MM-DD from a query param (accepts "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm:ss" etc.)
  const parseDateFromParam = (param) => {
    if (!param || typeof param !== 'string') return null;
    const trimmed = param.trim();
    if (!trimmed) return null;
    const datePart = trimmed.split('T')[0];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return null;
    return datePart;
  };

  // Get report folder name if reportFolderId is present
  const reportFolder = reportFolderId ? folders.find(f => f.id === parseInt(reportFolderId)) : null;
  const reportFolderName = reportFolder?.name || null;

  // Filter state - shared across all slides
  const getDefaultDateRange = () => {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return {
      start: formatDate(sevenDaysAgo),
      end: formatDate(today),
      selecting: false
    };
  };

  const [dateRange, setDateRange] = useState(getDefaultDateRange());
  const [currentShiftId, setCurrentShiftId] = useState('');

  // Apply start_time, end_time, shift_id from query params on mount and when params change
  useEffect(() => {
    const startDate = parseDateFromParam(startTimeParam);
    const endDate = parseDateFromParam(endTimeParam);
    if (startDate && endDate) {
      setDateRange((prev) => ({
        ...prev,
        start: startDate,
        end: endDate,
        selecting: false
      }));
    } else if (startDate) {
      setDateRange((prev) => ({ ...prev, start: startDate, selecting: false }));
    } else if (endDate) {
      setDateRange((prev) => ({ ...prev, end: endDate, selecting: false }));
    }
    if (shiftIdParam != null && shiftIdParam !== '') {
      setCurrentShiftId(String(shiftIdParam).trim());
    }
  }, [startTimeParam, endTimeParam, shiftIdParam]);

  // Helper function to decode URL-encoded channel name
  const decodeChannelName = (name) => {
    if (!name) return '';
    try {
      // Decode URL-encoded strings (handles %20, %2520, etc.)
      return decodeURIComponent(name);
    } catch (e) {
      // If decoding fails, return original
      return name;
    }
  };

  const [channelId, setChannelId] = useState(() => localStorage.getItem('channelId') || '');
  const [channelName, setChannelName] = useState(() => decodeChannelName(localStorage.getItem('channelName') || ''));

  // Fetch report folders if reportFolderId is present and folder not found
  useEffect(() => {
    if (reportFolderId && !reportFolder) {
      dispatch(fetchReportFolders());
    }
  }, [reportFolderId, reportFolder, dispatch]);

  // Listen for channel changes in localStorage (for when channel switcher updates it)
  useEffect(() => {
    const handleStorageChange = () => {
      const newChannelId = localStorage.getItem('channelId') || '';
      const newChannelName = decodeChannelName(localStorage.getItem('channelName') || '');
      if (newChannelId !== channelId) {
        setChannelId(newChannelId);
        setChannelName(newChannelName);
        // Reset shift selection when channel changes (shifts are channel-specific)
        setCurrentShiftId('');
      } else if (newChannelName !== channelName) {
        // Also update if channel name changes (even if ID is same)
        setChannelName(newChannelName);
      }
    };

    // Check for changes periodically (localStorage events don't fire in same tab)
    const interval = setInterval(handleStorageChange, 100);

    // Also listen to storage events (for cross-tab updates)
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [channelId]);

  // Handle channel change from ChannelSwitcher
  const handleChannelChange = useCallback((channel) => {
    if (channel) {
      setChannelId(channel.id?.toString() || '');
      // Channel name from API should already be decoded, but decode just in case
      setChannelName(decodeChannelName(channel.name || ''));
      // Reset shift selection when channel changes (shifts are channel-specific)
      setCurrentShiftId('');
    }
  }, []);

  // Save current slide to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('dashboardV2CurrentSlide', currentSlide.toString());
  }, [currentSlide]);

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), SLIDE_TRANSITION_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    setIsDropdownOpen(false);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsDropdownOpen(false);
  };

  const handleNext = useCallback(() => {
    // Prevent rapid clicks and ensure we're not at the end
    if (isNavigatingRef.current || currentSlide >= slides.length - 1) {
      return;
    }

    isNavigatingRef.current = true;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentSlide((prev) => {
        const nextSlide = prev + 1;
        // Double-check boundary before setting
        return nextSlide < slides.length ? nextSlide : prev;
      });
      setIsAnimating(false);
      isNavigatingRef.current = false;
    }, SLIDE_TRANSITION_MS);
  }, [currentSlide]);

  const handlePrev = useCallback(() => {
    // Prevent rapid clicks and ensure we're not at the beginning
    if (isNavigatingRef.current || currentSlide <= 0) {
      return;
    }

    isNavigatingRef.current = true;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentSlide((prev) => {
        const prevSlide = prev - 1;
        // Double-check boundary before setting
        return prevSlide >= 0 ? prevSlide : prev;
      });
      setIsAnimating(false);
      isNavigatingRef.current = false;
    }, SLIDE_TRANSITION_MS);
  }, [currentSlide]);

  // Keyboard navigation - must be after handlePrev and handleNext are defined
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Only handle arrow keys if not typing in an input/textarea
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        handlePrev();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        handleNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext]);

  const handleSlideSelect = (index) => {
    // Validate index and prevent rapid clicks
    if (isNavigatingRef.current || index === currentSlide || index < 0 || index >= slides.length) {
      return;
    }

    isNavigatingRef.current = true;
    setIsAnimating(true);
    setTimeout(() => {
      // Final validation before setting
      const validIndex = Math.max(0, Math.min(index, slides.length - 1));
      setCurrentSlide(validIndex);
      setIsAnimating(false);
      isNavigatingRef.current = false;
    }, SLIDE_TRANSITION_MS);
  };

  // Handle PDF download - backend generates the PDF
  const handleDownloadPDF = async () => {
    if (!dateRange.start || !dateRange.end) {
      alert('Please select a date range before downloading the PDF.');
      return;
    }
    if (!channelId && !reportFolderId) {
      alert('Please select a channel or report folder before downloading the PDF.');
      return;
    }

    try {
      setIsGeneratingPDF(true);

      const body = {
        channelId: channelId || reportFolderId,
        channelName: channelName || reportFolderName || 'Dashboard',
        start_time: dateRange.start,
        end_time: dateRange.end
      };
      if (currentShiftId) {
        body.shift_id = parseInt(currentShiftId, 10);
      }

      const response = await axiosInstance.post('/download_pdf/dashboard', body, {
        responseType: 'blob',
        headers: { 'Content-Type': 'application/json' }
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = `dashboard-${dateRange.start}-${dateRange.end}.pdf`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setIsGeneratingPDF(false);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      let message = 'Failed to download PDF. Please try again.';
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const json = JSON.parse(text);
          message = json.detail || json.message || message;
        } catch {
          message = 'The server could not generate the PDF. Please try again.';
        }
      } else if (error.response?.data?.detail) {
        message = error.response.data.detail;
      } else if (error.message) {
        message = error.message;
      }
      alert(message);
      setIsGeneratingPDF(false);
    }
  };

  // Handle CSV download
  const handleDownloadCSV = async () => {
    try {
      // Validate that we have date range
      if (!dateRange.start || !dateRange.end) {
        alert('Please select a date range before downloading CSV.');
        return;
      }

      // Format dates: convert YYYY-MM-DD to ISO format with time using channel timezone
      const formatDateTime = (dateString, isEnd = false) => {
        if (!dateString) return '';
        // If it's the end date, use 23:59:59, otherwise use 00:00:00
        const time = isEnd ? '23:59:59' : '00:00:00';

        // Get channel timezone from localStorage
        const channelTimezone = localStorage.getItem('channelTimezone') || 'UTC';

        // Use convertLocalToUTC to convert the date/time in channel timezone to UTC ISO string
        const utcISOString = convertLocalToUTC(dateString, time);

        // Return in the format expected by the API (YYYY-MM-DDTHH:mm:ss)
        // Remove the 'Z' and milliseconds if present
        if (utcISOString) {
          return utcISOString.replace(/\.\d{3}Z?$/, '').replace('Z', '');
        }

        // Fallback to simple format if conversion fails
        return `${dateString}T${time}`;
      };

      const startDateTime = formatDateTime(dateRange.start, false);
      const endDateTime = formatDateTime(dateRange.end, true);

      // Build query parameters
      const params = new URLSearchParams();
      params.append('start_datetime', startDateTime);
      params.append('end_datetime', endDateTime);
      if (reportFolderId) {
        params.append('report_folder_id', reportFolderId);
      } else if (channelId) {
        params.append('channel_id', channelId);
      }
      if (currentShiftId) params.append('shift_id', currentShiftId);

      // Make API call
      const response = await axiosInstance.get(`/v2/dashboard/csv-export/?${params.toString()}`, {
        responseType: 'blob', // Important for downloading files
      });

      // Create a blob from the response
      const blob = new Blob([response.data], { type: 'text/csv' });

      // Create a temporary URL and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Generate filename with current date range
      const filename = `dashboard-export-${dateRange.start || 'start'}-${dateRange.end || 'end'}.csv`;
      link.setAttribute('download', filename);

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading CSV:', error);
      alert('Failed to download CSV. Please try again.');
    }
  };

  // Ensure currentSlide is always valid
  const validSlideIndex = Math.max(0, Math.min(currentSlide, slides.length - 1));
  const CurrentSlideComponent = slides[validSlideIndex].component;
  const currentSlideConfig = slides[validSlideIndex];

  // Sync currentSlide if it was out of bounds (safety check)
  useEffect(() => {
    if (currentSlide < 0 || currentSlide >= slides.length) {
      setCurrentSlide(validSlideIndex);
    }
  }, [currentSlide, validSlideIndex, slides.length]);

  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentSlideConfig.containerBg} transition-all duration-300`}>
      {/* Navigation Header - Matching Other Headers (hidden when hideUI=true) */}
      {!hideUI && (
      <header className={`bg-gradient-to-r ${currentSlideConfig.headerBg} shadow-sm border-b ${currentSlideConfig.headerBorder} fixed top-0 left-0 right-0 z-40 ${reportFolderName ? 'h-20' : 'h-16'} transition-all duration-300`}>
        <div className="w-full px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full space-x-4">
            {/* Page Info */}
            <div className="flex-1 min-w-0">
              <h1 className={`text-lg font-bold ${currentSlideConfig.headerText} truncate transition-colors duration-300`}>
                Dashboard
              </h1>
              {(channelName || reportFolderName) && (
                <div className={`flex flex-col space-y-1 text-sm ${currentSlideConfig.headerText === 'text-white' ? 'text-gray-300' : 'text-gray-600'} transition-colors duration-300`}>
                  {channelName && (
                    <span className="flex items-center">
                      <svg className={`w-4 h-4 mr-1 ${currentSlideConfig.headerText === 'text-white' ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {channelName}
                    </span>
                  )}
                  {reportFolderName && (
                    <span className="flex items-center">
                      <svg className={`w-4 h-4 mr-1 ${currentSlideConfig.headerText === 'text-white' ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {reportFolderName}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Right Section - Channel Switcher, Slide Indicators and Navigation */}
            <div className="flex items-center space-x-4">
              {/* Channel Switcher - Hide if reportFolderId is present */}
              {!reportFolderId && (
                <ChannelSwitcher
                  onChannelChange={handleChannelChange}
                  showReportFolders={true}
                  className={`flex items-center space-x-2 px-3 py-1.5 text-sm font-medium rounded-lg border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md ${currentSlideConfig.headerText === 'text-white'
                    ? 'text-gray-200 bg-gray-700/50 border-gray-600 hover:bg-gray-600 hover:border-gray-500'
                    : 'text-gray-700 bg-white/80 border-gray-300 hover:bg-white hover:border-gray-400'
                    }`}
                  headerBg={currentSlideConfig.headerBg}
                  headerText={currentSlideConfig.headerText}
                  headerBorder={currentSlideConfig.headerBorder}
                />
              )}

              {/* PDF Download Button */}
              <button
                onClick={handleDownloadPDF}
                className={`flex items-center justify-center p-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md ${currentSlideConfig.headerText === 'text-white'
                  ? 'text-gray-200 bg-gray-700/50 border-gray-600 hover:bg-gray-600 hover:border-gray-500'
                  : 'text-gray-700 bg-white/80 border-gray-300 hover:bg-white hover:border-gray-400'
                  }`}
                aria-label="Download PDF"
                title="Download PDF"
              >
                <Download className="w-5 h-5" />
              </button>

              {/* Slide Indicators */}
              <div className="flex items-center space-x-2">
                {slides.map((slide, index) => (
                  <button
                    key={slide.id}
                    onClick={() => handleSlideSelect(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentSlide
                      ? 'bg-blue-500 w-8'
                      : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    aria-label={slide.title}
                  />
                ))}
              </div>
              <div className={`text-sm ${currentSlideConfig.headerText === 'text-white' ? 'text-gray-300' : 'text-gray-600'} transition-colors duration-300`}>
                {currentSlide + 1} / {slides.length}
              </div>

              {/* Navigation Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`flex items-center px-3 py-2.5 text-sm ${currentSlideConfig.headerText === 'text-white' ? 'text-gray-200 bg-gray-700/50 border-gray-600 hover:bg-gray-600 hover:border-gray-500' : 'text-gray-700 bg-white/80 border-gray-300 hover:bg-white hover:border-gray-400'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md`}
                >
                  <Menu className="h-5 w-5" />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className={`absolute right-0 mt-2 w-[28rem] bg-gradient-to-br ${currentSlideConfig.headerBg} ${currentSlideConfig.headerBorder} rounded-xl shadow-2xl border py-3 z-50 backdrop-blur-sm transition-all duration-300`}>
                    <div className={`grid ${user?.isAdmin ? 'grid-cols-2' : 'grid-cols-1'} gap-2 px-2`}>
                      <div>
                        <div className={`px-2 pb-1 text-xs font-semibold ${currentSlideConfig.headerText === 'text-white' ? 'text-gray-400' : 'text-gray-500'} uppercase`}>Channels</div>
                        <button
                          onClick={() => handleNavigation('/user-channels')}
                          className={`flex items-center w-full px-3 py-2 text-sm font-medium ${currentSlideConfig.headerText === 'text-white' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100'} rounded-lg transition-colors duration-200`}
                        >
                          <svg className={`w-4 h-4 mr-3 ${currentSlideConfig.headerText === 'text-white' ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                          </svg>
                          My Channels
                        </button>
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            const channelId = localStorage.getItem('channelId');
                            const channelName = localStorage.getItem('channelName');
                            if (channelId && channelName) {
                              const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
                              navigate(`/channels/${channelId}/segments?date=${today}&hour=0&name=${encodeURIComponent(channelName)}`);
                            } else {
                              navigate('/user-channels');
                            }
                          }}
                          className={`flex items-center w-full px-3 py-2 text-sm font-medium ${currentSlideConfig.headerText === 'text-white' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100'} rounded-lg transition-colors duration-200`}
                        >
                          <svg className={`w-4 h-4 mr-3 ${currentSlideConfig.headerText === 'text-white' ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          Search
                        </button>
                        <button onClick={() => handleNavigation('/dashboard')} className={`flex items-center w-full px-3 py-2 text-sm font-medium ${currentSlideConfig.headerText === 'text-white' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100'} rounded-lg transition-colors duration-200`}>
                          <BarChart3 className={`w-4 h-4 mr-3 ${currentSlideConfig.headerText === 'text-white' ? 'text-gray-400' : 'text-gray-500'}`} />
                          Dashboard
                        </button>
                        <button onClick={() => handleNavigation('/reports')} className={`flex items-center w-full px-3 py-2 text-sm font-medium ${currentSlideConfig.headerText === 'text-white' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100'} rounded-lg transition-colors duration-200`}>
                          <svg className={`w-4 h-4 mr-3 ${currentSlideConfig.headerText === 'text-white' ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Reports
                        </button>
                        <button onClick={() => { window.open('https://forms.clickup.com/9003066468/f/8c9zt34-21136/O2BX6CH5IROJJDHYMW', '_blank', 'noopener,noreferrer'); setIsDropdownOpen(false); }} className={`flex items-center w-full px-3 py-2 text-sm font-medium ${currentSlideConfig.headerText === 'text-white' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100'} rounded-lg transition-colors duration-200`}>
                          <svg className={`w-4 h-4 mr-3 ${currentSlideConfig.headerText === 'text-white' ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          Support Ticket
                        </button>
                      </div>
                      {user?.isAdmin && (
                        <div>
                          <div className={`px-2 pb-1 text-xs font-semibold ${currentSlideConfig.headerText === 'text-white' ? 'text-gray-400' : 'text-gray-500'} uppercase`}>Settings</div>
                          <button
                            onClick={() => {
                              setIsUploadModalOpen(true);
                              setIsDropdownOpen(false);
                            }}
                            className={`flex items-center w-full px-3 py-2 text-sm font-medium ${currentSlideConfig.headerText === 'text-white' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100'} rounded-lg transition-colors duration-200`}
                          >
                            <Upload className={`w-4 h-4 mr-3 ${currentSlideConfig.headerText === 'text-white' ? 'text-gray-400' : 'text-gray-500'}`} />
                            Upload Custom Audio
                          </button>
                          <button onClick={() => handleNavigation('/dashboard/settings')} className={`flex items-center w-full px-3 py-2 text-sm font-medium ${currentSlideConfig.headerText === 'text-white' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100'} rounded-lg transition-colors duration-200`}>
                            <svg className={`w-4 h-4 mr-3 ${currentSlideConfig.headerText === 'text-white' ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Topic Settings
                          </button>
                          <button onClick={() => handleNavigation('/dashboard/shift-management')} className={`flex items-center w-full px-3 py-2 text-sm font-medium ${currentSlideConfig.headerText === 'text-white' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100'} rounded-lg transition-colors duration-200`}>
                            <svg className={`w-4 h-4 mr-3 ${currentSlideConfig.headerText === 'text-white' ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Shift Management
                          </button>
                          <button onClick={() => handleNavigation('/dashboard/predefined-filters')} className={`flex items-center w-full px-3 py-2 text-sm font-medium ${currentSlideConfig.headerText === 'text-white' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100'} rounded-lg transition-colors duration-200`}>
                            <svg className={`w-4 h-4 mr-3 ${currentSlideConfig.headerText === 'text-white' ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            Predefined Filters
                          </button>
                          <button onClick={() => handleNavigation('/admin/audio')} className={`flex items-center w-full px-3 py-2 text-sm font-medium ${currentSlideConfig.headerText === 'text-white' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100'} rounded-lg transition-colors duration-200`}>
                            <svg className={`w-4 h-4 mr-3 ${currentSlideConfig.headerText === 'text-white' ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                            Audio Management
                          </button>
                          <button onClick={() => handleNavigation('/admin/settings')} className={`flex items-center w-full px-3 py-2 text-sm font-medium ${currentSlideConfig.headerText === 'text-white' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100'} rounded-lg transition-colors duration-200`}>
                            <svg className={`w-4 h-4 mr-3 ${currentSlideConfig.headerText === 'text-white' ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                            General Settings
                          </button>
                          <button onClick={() => handleNavigation('/admin/users')} className={`flex items-center w-full px-3 py-2 text-sm font-medium ${currentSlideConfig.headerText === 'text-white' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100'} rounded-lg transition-colors duration-200`}>
                            <svg className={`w-4 h-4 mr-3 ${currentSlideConfig.headerText === 'text-white' ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            User Management
                          </button>
                          <button onClick={() => handleNavigation('/admin/users')} className={`flex items-center w-full px-3 py-2 text-sm font-medium ${currentSlideConfig.headerText === 'text-white' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100'} rounded-lg transition-colors duration-200`}>
                            <svg className={`w-4 h-4 mr-3 ${currentSlideConfig.headerText === 'text-white' ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create New User
                          </button>
                          <button onClick={() => handleNavigation('/admin/channels')} className={`flex items-center w-full px-3 py-2 text-sm font-medium ${currentSlideConfig.headerText === 'text-white' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100'} rounded-lg transition-colors duration-200`}>
                            <svg className={`w-4 h-4 mr-3 ${currentSlideConfig.headerText === 'text-white' ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                            Channel Managment
                          </button>
                          <button onClick={() => handleNavigation('/admin/channels')} className={`flex items-center w-full px-3 py-2 text-sm font-medium ${currentSlideConfig.headerText === 'text-white' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100'} rounded-lg transition-colors duration-200`}>
                            <svg className={`w-4 h-4 mr-3 ${currentSlideConfig.headerText === 'text-white' ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Onboard Channel
                          </button>
                          <button onClick={() => handleNavigation('/admin/custom-flags')} className={`flex items-center w-full px-3 py-2 text-sm font-medium ${currentSlideConfig.headerText === 'text-white' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100'} rounded-lg transition-colors duration-200`}>
                            <svg className={`w-4 h-4 mr-3 ${currentSlideConfig.headerText === 'text-white' ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                            </svg>
                            Custom Flags
                          </button>
                          <button onClick={() => handleNavigation('/admin/content-type-deactivation')} className={`flex items-center w-full px-3 py-2 text-sm font-medium ${currentSlideConfig.headerText === 'text-white' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100'} rounded-lg transition-colors duration-200`}>
                            <svg className="w-4 h-4 mr-3 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                            <span className="whitespace-nowrap">Content Type Deactivation</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <div className={`border-t ${currentSlideConfig.headerText === 'text-white' ? 'border-gray-600' : 'border-gray-200'} my-2`}></div>
                    <button onClick={handleLogout} className={`mx-2 mb-1 flex items-center w-[calc(100%-1rem)] px-3 py-2 text-sm font-medium ${currentSlideConfig.headerText === 'text-white' ? 'text-red-400 hover:bg-red-900/30' : 'text-red-600 hover:bg-red-50'} rounded-lg transition-colors duration-200`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 002 2h5a2 2 0 002-2V7a2 2 0 00-2-2h-5a2 2 0 00-2 2v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      )}

      {/* Main Content - overflow-x-hidden only so slide content is never vertically clipped at any viewport */}
      <div className={`${hideUI ? 'pt-0' : reportFolderName ? 'pt-20' : 'pt-16'} relative overflow-x-hidden`}>
        <div
          ref={slideContentRef}
          className={hideUI
            ? 'opacity-100 translate-y-0'
            : `transition-all duration-150 ease-out ${isAnimating ? 'opacity-80 translate-y-1' : 'opacity-100 translate-y-0'}`
          }
        >
          <CurrentSlideComponent
            key={`${currentSlide}-${channelId}-${reportFolderId || ''}`}
            dateRange={dateRange}
            setDateRange={setDateRange}
            currentShiftId={currentShiftId}
            setCurrentShiftId={setCurrentShiftId}
            reportFolderId={reportFolderId}
            hideUI={hideUI}
          />
        </div>
      </div>

      {/* Navigation Arrows (hidden when hideUI=true) */}
      {!hideUI && (
        <>
      <button
        onClick={handlePrev}
        disabled={currentSlide === 0}
        className={`fixed left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full shadow-lg border transition-all duration-200 ${currentSlideConfig.headerText === 'text-white'
          ? `bg-gray-700 border-gray-600 ${currentSlide === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-600 hover:shadow-xl'}`
          : `bg-white/80 border-gray-300 ${currentSlide === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white hover:shadow-xl'}`
          }`}
        aria-label="Previous slide"
      >
        <ChevronLeft className={`w-6 h-6 ${currentSlideConfig.headerText === 'text-white' ? 'text-gray-300' : 'text-gray-700'} transition-colors duration-300`} />
      </button>

      <button
        onClick={handleNext}
        disabled={currentSlide === slides.length - 1}
        className={`fixed right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full shadow-lg border transition-all duration-200 ${currentSlideConfig.headerText === 'text-white'
          ? `bg-gray-700 border-gray-600 ${currentSlide === slides.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-600 hover:shadow-xl'}`
          : `bg-white/80 border-gray-300 ${currentSlide === slides.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white hover:shadow-xl'}`
          }`}
        aria-label="Next slide"
      >
        <ChevronRight className={`w-6 h-6 ${currentSlideConfig.headerText === 'text-white' ? 'text-gray-300' : 'text-gray-700'} transition-colors duration-300`} />
      </button>
        </>
      )}

      {/* Slide Navigation Menu (Bottom Right - Hideable, hidden when hideUI=true) */}
      {!hideUI && isNavMenuVisible && (
        <div className={`fixed bottom-4 right-4 z-20 bg-gradient-to-br ${currentSlideConfig.headerBg} ${currentSlideConfig.headerBorder} rounded-lg shadow-lg border px-4 py-2 transition-all duration-300`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-semibold ${currentSlideConfig.headerText} transition-colors duration-300`}>
              {showFilters ? 'Filters' : 'Slide Navigation'}
            </span>
            <div className="flex items-center space-x-1">
              <button
                onClick={handleDownloadCSV}
                className={`p-1 ${currentSlideConfig.headerText === 'text-white' ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'} rounded transition-colors`}
                aria-label="Download CSV"
                title="Download CSV"
              >
                <Download className={`w-4 h-4 ${currentSlideConfig.headerText === 'text-white' ? 'text-gray-300' : 'text-gray-600'}`} />
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-1 ${currentSlideConfig.headerText === 'text-white' ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'} rounded transition-colors`}
                aria-label={showFilters ? 'Show navigation' : 'Show filters'}
                title={showFilters ? 'Show navigation' : 'Show filters'}
              >
                {showFilters ? (
                  <Menu className={`w-4 h-4 ${currentSlideConfig.headerText === 'text-white' ? 'text-gray-300' : 'text-gray-600'}`} />
                ) : (
                  <Filter className={`w-4 h-4 ${currentSlideConfig.headerText === 'text-white' ? 'text-gray-300' : 'text-gray-600'}`} />
                )}
              </button>
              <button
                onClick={() => setIsNavMenuVisible(false)}
                className={`p-1 ${currentSlideConfig.headerText === 'text-white' ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'} rounded transition-colors`}
                aria-label="Close navigation menu"
              >
                <X className={`w-4 h-4 ${currentSlideConfig.headerText === 'text-white' ? 'text-gray-300' : 'text-gray-600'}`} />
              </button>
            </div>
          </div>
          {showFilters ? (
            <div className="max-h-96 overflow-y-auto">
              <DashboardV2Filters
                dateRange={dateRange}
                setDateRange={setDateRange}
                currentShiftId={currentShiftId}
                setCurrentShiftId={setCurrentShiftId}
                headerText={currentSlideConfig.headerText}
                headerBg={currentSlideConfig.headerBg}
                headerBorder={currentSlideConfig.headerBorder}
                hideShiftFilter={currentSlideConfig.id === 'entities'}
                channelId={channelId}
                reportFolderId={reportFolderId}
              />
            </div>
          ) : (
            <div className="flex flex-col space-y-1 max-h-96 overflow-y-auto">
              {slides.map((slide, index) => {
                const Icon = slide.icon;
                return (
                  <button
                    key={slide.id}
                    onClick={() => handleSlideSelect(index)}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-md transition-all duration-200 text-left ${index === currentSlide
                      ? 'bg-blue-500 text-white'
                      : `${currentSlideConfig.headerText} ${currentSlideConfig.headerText === 'text-white' ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'}`
                      }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-medium">{slide.title}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Show Navigation Button (when hidden; also hidden when hideUI=true) */}
      {!hideUI && !isNavMenuVisible && (
        <button
          onClick={() => setIsNavMenuVisible(true)}
          className={`fixed bottom-4 right-4 z-20 p-3 ${currentSlideConfig.headerText === 'text-white' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-full shadow-lg transition-all duration-300`}
          aria-label="Show navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* PDF Generation Overlay */}
      {isGeneratingPDF && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-xl shadow-2xl flex flex-col items-center max-w-md w-full mx-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Generating PDF Report</h3>
            <p className="text-gray-600 mb-2 text-center">
              Your dashboard PDF is being generated on the server. This may take 1–2 minutes depending on the date range and number of slides.
            </p>
            <p className="text-gray-500 text-sm text-center mb-4">
              Please don&apos;t close this page. You&apos;ll see a download when it&apos;s ready.
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse w-full" />
            </div>
            <p className="mt-3 text-xs text-gray-400">Processing…</p>
          </div>
        </div>
      )}

      {/* Upload Custom Audio Modal */}
      <UploadCustomAudioModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </div>
  );
}

export default DashboardV2;

