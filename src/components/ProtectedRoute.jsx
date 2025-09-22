import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/user-login" state={{ from: location }} replace />;
  }

  if (requireAdmin && (!user || !user.isAdmin)) {
    // Redirect non-admin users away from admin pages
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;