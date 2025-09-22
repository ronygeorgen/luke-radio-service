import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const LandingRedirect = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  
  if (isAuthenticated) {
    if (user?.isAdmin) {
      return <Navigate to="/admin/channels" replace />;
    } else {
      return <Navigate to="/user-channels" replace />;
    }
  } else {
    return <Navigate to="/user-login" replace />;
  }
};

export default LandingRedirect;