import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth } from '../store/slices/authSlice';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const dispatch = useDispatch();
  const { isAuthenticated, user, isLoading, accessToken, refreshToken } = useSelector((state) => state.auth);
  const location = useLocation();

  // If tokens exist but auth not resolved, trigger auth check
  useEffect(() => {
    if (!isAuthenticated && !isLoading && (accessToken || refreshToken)) {
      dispatch(checkAuth());
    }
  }, [isAuthenticated, isLoading, accessToken, refreshToken, dispatch]);

  // Wait for auth resolution to avoid incorrect redirects on refresh
  if (isLoading || (!isAuthenticated && (accessToken || refreshToken))) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/user-login" state={{ from: location }} replace />;
  }

  if (requireAdmin && (!user || !user.isAdmin)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;