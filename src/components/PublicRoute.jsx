import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PublicRoute = ({ children, restricted = false }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  // If route is restricted and user is authenticated, redirect based on user type
  if (restricted && isAuthenticated) {
    if (user?.isAdmin) {
      return <Navigate to="/admin/channels" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default PublicRoute;