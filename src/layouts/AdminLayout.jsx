// Updated AdminLayout.js
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, Settings, Layers, Users, Plus, UserCog, Music, BarChart3, FileText, Search, LifeBuoy, Clock, Filter, Radio, Flag, Ban, Upload } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { useState, useRef, useEffect } from 'react';
import ChannelSwitcher from '../components/ChannelSwitcher';
import { fetchCustomFlags } from '../store/slices/customFlagSlice';
import { fetchContentTypeDeactivationRules } from '../store/slices/contentTypeDeactivationSlice';
import { fetchUserChannels, selectUserChannels } from '../store/slices/channelSlice';
import { fetchSettings } from '../store/slices/settingsSlice';
import SimpleChannelSelectionModal from '../pages/user/SimpleChannelSelectionModal';
import UploadCustomAudioModal from '../components/UploadCustomAudioModal';

const AdminLayout = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();
    const { user } = useSelector(state => state.auth);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const contentTypeDeactivationState = useSelector(state => state.contentTypeDeactivation);
    const userChannels = useSelector(selectUserChannels);

    // State for channel selection modal (when on /admin/channels page)
    const [isChannelSelectionOpen, setIsChannelSelectionOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState(null);
    // Force header to re-read channel name when channel is switched (e.g. on Settings page)
    const [channelHeaderKey, setChannelHeaderKey] = useState(0);

    // Fetch user channels when on /admin/channels, /admin/settings, or /admin/users pages
    useEffect(() => {
        if (location.pathname.includes('/admin/channels') ||
            location.pathname.includes('/admin/settings') ||
            location.pathname.includes('/admin/users')) {
            dispatch(fetchUserChannels());
        }
    }, [dispatch, location.pathname]);

    // Get current page name from route (channel name shown separately below user, like other pages)
    const getPageName = () => {
        const path = location.pathname;
        if (path.includes('/admin/users')) return 'User Management';
        if (path.includes('/admin/channels')) return 'Channel Management';
        if (path.includes('/admin/audio')) return 'Audio Management';
        if (path.includes('/admin/settings')) return 'General Settings';
        if (path.includes('/admin/custom-flags')) return 'Custom Flags';
        if (path.includes('/admin/content-type-deactivation')) return 'Content Type Deactivation';
        return 'Admin Panel';
    };
    const pageName = getPageName();
    const channelName = localStorage.getItem('channelName') || '';
    const isChannelScopedPage = location.pathname.includes('/admin/settings') ||
        location.pathname.includes('/admin/custom-flags') ||
        location.pathname.includes('/admin/content-type-deactivation');

    const handleLogout = () => {
        dispatch(logout());
    };

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    // Navigation handler that checks for channel selection
    const handleNavigation = (path) => {
        // Don't require channel for /admin/channels page
        if (path.includes('/admin/channels')) {
            navigate(path);
            setIsDropdownOpen(false);
            return;
        }

        // Don't require channel for /admin/users page - navigate directly
        if (path.includes('/admin/users')) {
            navigate(path);
            setIsDropdownOpen(false);
            return;
        }

        const channelId = localStorage.getItem('channelId');

        if (channelId) {
            // If channel ID exists, navigate directly
            navigate(path);
        } else {
            // General Settings (and other channel-scoped targets): always open channel selector modal, never navigate to a blank page
            if (path.includes('/admin/settings')) {
                setPendingNavigation(path);
                setIsChannelSelectionOpen(true);
                setIsDropdownOpen(false);
                return;
            }
            // If currently on /admin/channels or /admin/users page, show modal for other targets
            if (location.pathname.includes('/admin/channels') ||
                location.pathname.includes('/admin/settings') ||
                location.pathname.includes('/admin/users')) {
                setPendingNavigation(path);
                setIsChannelSelectionOpen(true);
            } else {
                // Otherwise, navigate to user channels to select one
                navigate('/user-channels');
            }
        }
        setIsDropdownOpen(false);
    };

    // Handle channel selection from modal (when on /admin/channels page)
    const handleChannelSelect = (channel) => {
        if (pendingNavigation === 'SEARCH') {
            // Handle search navigation specifically
            const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
            navigate(`/channels/${channel.id}/segments?date=${today}&hour=0&name=${encodeURIComponent(channel.name)}`);
            setPendingNavigation(null);
            setIsChannelSelectionOpen(false);
        } else if (pendingNavigation) {
            let finalPath = pendingNavigation;

            // Replace :channelId with the actual internal ID
            if (finalPath.includes(':channelId')) {
                finalPath = finalPath.replace(':channelId', channel.id);
            }

            navigate(finalPath);
            setPendingNavigation(null);
            setIsChannelSelectionOpen(false);
        }
    };

    // Handle search navigation
    const handleSearchNavigation = () => {
        setIsDropdownOpen(false);
        const channelId = localStorage.getItem('channelId');
        const channelName = localStorage.getItem('channelName');

        if (channelId && channelName) {
            const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
            navigate(`/channels/${channelId}/segments?date=${today}&hour=0&name=${encodeURIComponent(channelName)}`);
        } else {
            // If currently on /admin/channels, /admin/settings, or /admin/users page, show modal
            if (location.pathname.includes('/admin/channels') ||
                location.pathname.includes('/admin/settings') ||
                location.pathname.includes('/admin/users')) {
                setPendingNavigation('SEARCH');
                setIsChannelSelectionOpen(true);
            } else {
                // Otherwise, navigate to user channels to select one
                navigate('/user-channels');
            }
        }
    };

    // Close channel selection modal
    const handleCloseChannelSelection = () => {
        setIsChannelSelectionOpen(false);
        setPendingNavigation(null);
    };

    // Handle channel selection from modal - This function is no longer needed as per the edit hint
    // const handleChannelSelect = (channel) => {
    //     if (pendingNavigation) {
    //         let finalPath = pendingNavigation;

    //         // Replace :channelId with the actual internal ID (1)
    //         if (finalPath.includes(':channelId')) {
    //             finalPath = finalPath.replace(':channelId', channel.id);
    //         }

    //         navigate(finalPath);
    //         setPendingNavigation(null);
    //     }
    // };

    // Close channel selection modal - This function is no longer needed as per the edit hint
    // const handleCloseChannelSelection = () => {
    //     setIsChannelSelectionOpen(false);
    //     setPendingNavigation(null);
    // };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header - Matching Website Format */}
            <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-40 min-h-16 py-3 pb-5">
                <div className="w-full px-4 sm:px-6 lg:px-8 h-full">
                    <div className="flex items-center justify-between h-full space-x-4">
                        {/* Page Info - page name, then user, then channel name (like other channel-scoped pages) */}
                        <div className="flex-1 min-w-0">
                            <h1 className="text-lg font-bold text-gray-900 truncate">
                                {pageName}
                            </h1>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span className="flex items-center">
                                    <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    {user?.email || 'Admin User'}
                                </span>
                            </div>
                            {isChannelScopedPage && channelName && (
                                <div className="text-sm text-gray-500 mt-0.5 mb-1 truncate">
                                    {channelName}
                                </div>
                            )}
                        </div>

                        {/* Channel Switcher and Settings Dropdown */}
                        <div className="flex items-center space-x-2">
                            {/* Hide channel switcher on /admin/channels and /admin/users pages */}
                            {!location.pathname.includes('/admin/channels') &&
                                !location.pathname.includes('/admin/users') && (
                                    <ChannelSwitcher onChannelChange={(channel) => {
                                        // Fetch data based on current route without reloading
                                        const path = location.pathname;
                                        if (path.includes('/admin/custom-flags')) {
                                            dispatch(fetchCustomFlags());
                                        } else if (path.includes('/admin/content-type-deactivation')) {
                                            const channelId = localStorage.getItem('channelId');
                                            if (channelId) {
                                                // Get current filter state from Redux or use defaults
                                                const params = {
                                                    channelId,
                                                    search: '',
                                                    ordering: '-created_at',
                                                    isActive: true
                                                };
                                                dispatch(fetchContentTypeDeactivationRules(params));
                                            }
                                        } else if (path.includes('/admin/audio')) {
                                            // Trigger custom event for audio page to handle
                                            window.dispatchEvent(new CustomEvent('channelChanged', { detail: channel }));
                                        } else if (path.includes('/admin/settings')) {
                                            setChannelHeaderKey(k => k + 1);
                                            dispatch(fetchSettings(channel?.id));
                                        }
                                    }} />
                                )}
                            <div className="relative">
                                <button
                                    onClick={() => setIsDropdownOpen(isDropdownOpen === 'settings' ? null : 'settings')}
                                    className="flex items-center px-3 py-2.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                                >
                                    <Menu className="h-5 w-5" />
                                </button>

                                {/* Dropdown Menu - EXACT SAME DESIGN AS BEFORE */}
                                {isDropdownOpen === 'settings' && (
                                    <div className="absolute right-0 mt-2 w-[28rem] bg-white rounded-xl shadow-2xl border border-gray-200 py-3 z-50 backdrop-blur-sm">
                                        <div className={`grid ${user?.isAdmin ? 'grid-cols-2' : 'grid-cols-1'} gap-2 px-2`}>
                                            <div>
                                                <div className="px-2 pb-1 text-xs font-semibold text-gray-400 uppercase">Channels</div>
                                                <button onClick={() => { navigate('/user-channels'); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                                                    <Radio className="w-4 h-4 mr-3 text-gray-500" />
                                                    My Channels
                                                </button>
                                                <button onClick={handleSearchNavigation}
                                                    className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                                                    <Search className="w-4 h-4 mr-3 text-gray-500" />
                                                    Search
                                                </button>
                                                <button onClick={() => { handleNavigation("/dashboard"); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                                                    <BarChart3 className="w-4 h-4 mr-3 text-gray-500" />
                                                    Dashboard
                                                </button>

                                                <button onClick={() => { handleNavigation("/reports"); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                                                    <FileText className="w-4 h-4 mr-3 text-gray-500" />
                                                    Reports
                                                </button>
                                                <button onClick={() => { window.open('https://forms.clickup.com/9003066468/f/8c9zt34-21136/O2BX6CH5IROJJDHYMW', '_blank', 'noopener,noreferrer'); setIsDropdownOpen(null); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                                                    <LifeBuoy className="w-4 h-4 mr-3 text-gray-500" />
                                                    Support Ticket
                                                </button>
                                            </div>
                                            {user?.isAdmin && (
                                                <div>
                                                    <div className="px-2 pb-1 text-xs font-semibold text-gray-400 uppercase">Settings</div>
                                                    <button
                                                        onClick={() => {
                                                            setIsUploadModalOpen(true);
                                                            setIsDropdownOpen(null);
                                                        }}
                                                        className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                                    >
                                                        <Upload className="w-4 h-4 mr-3 text-gray-500" />
                                                        Upload Custom Audio
                                                    </button>
                                                    <button onClick={() => { handleNavigation("/dashboard/settings"); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                                                        <Settings className="w-4 h-4 mr-3 text-gray-500" />
                                                        Topic Settings
                                                    </button>
                                                    <button onClick={() => handleNavigation('/dashboard/shift-management')} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                                                        <Clock className="w-4 h-4 mr-3 text-gray-500" />
                                                        Shift Management
                                                    </button>
                                                    <button onClick={() => handleNavigation('/dashboard/predefined-filters')} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                                                        <Filter className="w-4 h-4 mr-3 text-gray-500" />
                                                        Predefined Filters
                                                    </button>
                                                    <button onClick={() => { handleNavigation("/admin/audio"); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                                                        <Music className="w-4 h-4 mr-3 text-gray-500" />
                                                        Audio Management
                                                    </button>
                                                    <button onClick={() => { handleNavigation("/admin/settings"); setIsDropdownOpen(null); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                                                        <Layers className="w-4 h-4 mr-3 text-gray-500" />
                                                        General Settings
                                                    </button>
                                                    <button onClick={() => { navigate("/admin/users"); setIsDropdownOpen(null); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                                                        <UserCog className="w-4 h-4 mr-3 text-gray-500" />
                                                        User Management
                                                    </button>
                                                    <button onClick={() => { navigate("/admin/users"); setIsDropdownOpen(null); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                                                        <Plus className="w-4 h-4 mr-3 text-gray-500" />
                                                        Create New User
                                                    </button>
                                                    <button onClick={() => { handleNavigation("/admin/channels"); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                                                        <Layers className="w-4 h-4 mr-3 text-gray-500" />
                                                        Channel Managment
                                                    </button>
                                                    <button onClick={() => { handleNavigation("/admin/channels"); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                                                        <Plus className="w-4 h-4 mr-3 text-gray-500" />
                                                        Onboard Channel
                                                    </button>
                                                    <button onClick={() => { handleNavigation("/admin/custom-flags"); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                                                        <Flag className="w-4 h-4 mr-3 text-gray-500" />
                                                        Custom Flags
                                                    </button>
                                                    <button onClick={() => { handleNavigation("/admin/content-type-deactivation"); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                                                        <Ban className="w-4 h-4 mr-3 text-gray-500 flex-shrink-0" />
                                                        <span className="whitespace-nowrap">Content Type Deactivation</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="border-t border-gray-200 my-2"></div>
                                        <button onClick={() => { handleLogout(); setIsDropdownOpen(null); }} className="mx-2 mb-1 flex items-center w-[calc(100%-1rem)] px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200">
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

            {/* Main Content */}
            <div className="w-full px-4 sm:px-6 lg:px-8 py-8 pt-24">
                <Outlet />
            </div>

            {/* Channel Selection Modal - Show when on /admin/channels, /admin/settings, or /admin/users pages and navigating to pages that require channel */}
            {(location.pathname.includes('/admin/channels') ||
                location.pathname.includes('/admin/settings') ||
                location.pathname.includes('/admin/users')) && (
                    <SimpleChannelSelectionModal
                        isOpen={isChannelSelectionOpen}
                        onClose={handleCloseChannelSelection}
                        onChannelSelect={handleChannelSelect}
                        channels={userChannels}
                        title="Select a Channel"
                        description="Choose a channel to access the selected feature"
                    />
                )}

            {/* Upload Custom Audio Modal */}
            <UploadCustomAudioModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
            />
        </div>
    );
};

export default AdminLayout;