import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { APP_NAME, formatPageTitle } from '../config/appBranding';

const getPageTitle = (pathname) => {
  if (pathname.startsWith('/admin-login')) return formatPageTitle('Admin Sign In');
  if (pathname.startsWith('/user-login')) return formatPageTitle('Sign In');
  if (pathname.startsWith('/create-password')) return formatPageTitle('Create Password');
  if (pathname.includes('/admin/users')) return formatPageTitle('User Management');
  if (pathname.includes('/admin/channels')) return formatPageTitle('Channel Management');
  if (pathname.includes('/admin/audio')) return formatPageTitle('Audio Management');
  if (pathname.includes('/admin/settings')) return formatPageTitle('General Settings');
  if (pathname.includes('/admin/custom-flags')) return formatPageTitle('Custom Flags');
  if (pathname.includes('/admin/content-type-deactivation')) return formatPageTitle('Content Type Deactivation');
  if (pathname.includes('/transcript-compare')) return formatPageTitle('Transcript Compare');
  if (pathname.includes('/segments')) return formatPageTitle('Audio Segments');
  if (pathname.startsWith('/user-channels')) return formatPageTitle('Channels');
  if (pathname.startsWith('/reports/')) return formatPageTitle('Report Details');
  if (pathname.startsWith('/reports')) return formatPageTitle('Reports');
  if (pathname.startsWith('/dashboard/settings')) return formatPageTitle('Dashboard Settings');
  if (pathname.startsWith('/dashboard/shift-management')) return formatPageTitle('Shift Management');
  if (pathname.startsWith('/dashboard/predefined-filters')) return formatPageTitle('Predefined Filters');
  if (pathname.startsWith('/dashboard')) return formatPageTitle('Dashboard');
  if (pathname.startsWith('/admin')) return formatPageTitle('Admin');
  return APP_NAME;
};

const DocumentTitle = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = getPageTitle(pathname);
  }, [pathname]);

  return null;
};

export default DocumentTitle;
