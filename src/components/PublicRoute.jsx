import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth } from '../store/slices/authSlice';
import LoadingSpinner from './DashboardUserSide/LoadingSpinner';

const PublicRoute = ({ children, restricted = false }) => {
  const dispatch = useDispatch();
  const { isAuthenticated, isLoading, accessToken, refreshToken } = useSelector((state) => state.auth);

  // If tokens exist but auth not resolved, trigger auth check
  useEffect(() => {
    if (!isAuthenticated && !isLoading && (accessToken || refreshToken)) {
      dispatch(checkAuth());
    }
  }, [isAuthenticated, isLoading, accessToken, refreshToken, dispatch]);

  // Wait for auth resolution to avoid flicker/incorrect redirects
  if (isLoading || (!isAuthenticated && (accessToken || refreshToken))) {
    return <LoadingSpinner message="Loading..." />;
  }

  // If route is restricted and user is authenticated, send to user landing
  if (restricted && isAuthenticated) {
    return <Navigate to="/user-channels" replace />;
  }

  return children;
};

export default PublicRoute;