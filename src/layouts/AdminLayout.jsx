// Updated AdminLayout.js
import { Outlet } from 'react-router-dom';
import { Settings, Layers, Users, Plus, UserCog, ChevronDown, Music, BarChart3, FileText, Search, LifeBuoy } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { useState, useRef, useEffect } from 'react';
import CreateUserModal from '../pages/admin/CreateUserModal';
import OnboardModal from '../components/OnboardModal';
import ChannelSelectionModal from '../pages/admin/ChannelSelectionModal';

const AdminLayout = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isChannelSelectionOpen, setIsChannelSelectionOpen] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState(null);
    const dropdownRef = useRef(null);

    const handleLogout = () => {
        dispatch(logout());
    };

    const handleCloseUserModal = () => {
        setIsUserModalOpen(false);
    };

    const handleCloseChannelModal = () => {
        setIsChannelModalOpen(false);
    };

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    // Navigation handler that checks for channel selection
    const handleNavigation = (path) => {
        const channelId = localStorage.getItem('channelId');
        
        if (channelId) {
            // If channel ID exists, navigate directly
            navigate(path);
        } else {
            // If no channel ID, open channel selection modal
            setPendingNavigation(path);
            setIsChannelSelectionOpen(true);
        }
        setIsDropdownOpen(false);
    };

    // Handle channel selection from modal
    const handleChannelSelect = (channel) => {
        if (pendingNavigation) {
            let finalPath = pendingNavigation;
            
            // Replace :channelId with the actual internal ID (1)
            if (finalPath.includes(':channelId')) {
                finalPath = finalPath.replace(':channelId', channel.id);
            }
            
            navigate(finalPath);
            setPendingNavigation(null);
        }
    };

    // Close channel selection modal
    const handleCloseChannelSelection = () => {
        setIsChannelSelectionOpen(false);
        setPendingNavigation(null);
    };

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
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
                            <p className="text-gray-600 mt-1">Manage your channels and system settings</p>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center space-x-4">
                            {/* Create User Button */}
                            {user?.isAdmin && (
                                <button
                                    onClick={() => setIsUserModalOpen(true)}
                                    className="flex items-center space-x-2 px-4 py-2.5 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-xl font-medium transition-all duration-200 group"
                                >
                                    <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm">Create User</span>
                                </button>
                            )}
                            
                            {/* Onboard Channel Button */}
                            {user?.isAdmin && (
                                <button
                                    onClick={() => setIsChannelModalOpen(true)}
                                    className="flex items-center space-x-2 px-4 py-2.5 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl font-medium transition-all duration-200 group"
                                >
                                    <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm">Onboard Channel</span>
                                </button>
                            )}

                            {/* Settings Dropdown */}
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={toggleDropdown}
                                    className="flex items-center space-x-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                >
                                    <Settings className="h-5 w-5" />
                                    <span>Navigation</span>
                                    <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Dropdown Menu */}
                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-[28rem] bg-white rounded-xl shadow-2xl border border-gray-200 py-3 z-50">
                                        <div className="grid grid-cols-2 gap-2 px-2">
                                            <div>
                                                <div className="px-2 pb-1 text-xs font-semibold text-gray-400 uppercase">Channels</div>
                                                <button onClick={() => handleNavigation('/user-channels')} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                                                    <Search className="w-4 h-4 mr-3 text-gray-500" />
                                                    Search
                                                </button>
                                                <button onClick={() => handleNavigation('/dashboard')} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                                                    <BarChart3 className="w-4 h-4 mr-3 text-gray-500" />
                                                    Dashboard
                                                </button>
                                                <button onClick={() => handleNavigation('/reports')} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                                                    <FileText className="w-4 h-4 mr-3 text-gray-500" />
                                                    Reports
                                                </button>
                                                <button onClick={() => { window.open('https://forms.clickup.com/9003066468/f/8c9zt34-21136/O2BX6CH5IROJJDHYMW', '_blank', 'noopener,noreferrer'); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                                                    <LifeBuoy className="w-4 h-4 mr-3 text-gray-500" />
                                                    Support Ticket
                                                </button>
                                            </div>
                                            <div>
                                                <div className="px-2 pb-1 text-xs font-semibold text-gray-400 uppercase">Settings</div>
                                                <button onClick={() => handleNavigation('/dashboard/settings')} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                                                    <Settings className="w-4 h-4 mr-3 text-gray-500" />
                                                    Topic Settings
                                                </button>
                                                <button onClick={() => handleNavigation('/admin/audio')} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                                                    <Music className="w-4 h-4 mr-3 text-gray-500" />
                                                    Audio Management
                                                </button>
                                                <button onClick={() => handleNavigation('/admin/settings')} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                                                    <Layers className="w-4 h-4 mr-3 text-gray-500" />
                                                    General Settings
                                                </button>
                                                <button onClick={() => handleNavigation('/admin/users')} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                                                    <UserCog className="w-4 h-4 mr-3 text-gray-500" />
                                                    User Management
                                                </button>
                                                <button onClick={() => handleNavigation('/admin/users')} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                                                    <Plus className="w-4 h-4 mr-3 text-gray-500" />
                                                    Create New User
                                                </button>
                                                <button onClick={() => handleNavigation('/admin/channels')} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                                                    <Layers className="w-4 h-4 mr-3 text-gray-500" />
                                                    Channel Settings
                                                </button>
                                                <button onClick={() => handleNavigation('/admin/channels')} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                                                    <Plus className="w-4 h-4 mr-3 text-gray-500" />
                                                    Onboard Channel
                                                </button>
                                            </div>
                                        </div>
                                        <div className="border-t border-gray-200 my-2"></div>
                                        <button onClick={() => { handleLogout(); setIsDropdownOpen(false); }} className="mx-2 mb-1 flex items-center w-[calc(100%-1rem)] px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
                    
                    {/* Navigation Tabs */}
                    <div className="flex space-x-8 border-b border-gray-200">
                        <NavLink
                            to="/admin/channels"
                            className={({ isActive }) =>
                                `flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                                    isActive
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`
                            }
                        >
                            <Layers className="h-5 w-5" />
                            <span>Channel Onboard</span>
                        </NavLink>
                        
                        <NavLink
                            to="/admin/users"
                            className={({ isActive }) =>
                                `flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                                    isActive
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`
                            }
                        >
                            <UserCog className="h-5 w-5" />
                            <span>User Management</span>
                        </NavLink>

                        <NavLink
                            to="/admin/audio"
                            className={({ isActive }) =>
                                `flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                                isActive
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`
                            }
                            >
                            <Music className="h-5 w-5" />
                            <span>Audio Management</span>
                        </NavLink>
                        
                        <NavLink
                            to="/admin/settings"
                            className={({ isActive }) =>
                                `flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                                    isActive
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`
                            }
                        >
                            <Settings className="h-5 w-5" />
                            <span>General Settings</span>
                        </NavLink>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </div>

            {/* Modals */}
            <CreateUserModal
                isOpen={isUserModalOpen}
                onClose={handleCloseUserModal}
            />
            
            <OnboardModal
                isOpen={isChannelModalOpen}
                onClose={handleCloseChannelModal}
            />

            {/* Channel Selection Modal */}
            <ChannelSelectionModal
                isOpen={isChannelSelectionOpen}
                onClose={handleCloseChannelSelection}
                onChannelSelect={handleChannelSelect}
                title="Select a Channel"
                description="Choose a channel to access the selected feature"
            />
        </div>
    );
};

export default AdminLayout;