import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const RootRedirect: React.FC = () => {
  const { isAdmin } = useUser();

  // Redirect to dashboard for admins, settings for regular users
  return <Navigate to={isAdmin ? "/dashboard" : "/settings"} />;
};

export default RootRedirect;
