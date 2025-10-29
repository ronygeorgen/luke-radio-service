import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const LandingRedirect = () => {
  const { isAuthenticated, isLoading } = useSelector((state) => state.auth);

  // Wait for auth to settle to avoid mis-redirects on first paint
  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/user-channels" replace />;
  }

  return <Navigate to="/user-login" replace />;
};

export default LandingRedirect;