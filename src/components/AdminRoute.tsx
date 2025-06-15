import React from 'react';
import { useUser } from '../context/UserContext';
import AccessDenied from '../pages/AccessDenied';

interface AdminRouteProps {
  element: React.ReactElement;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ element }) => {
  const { isAdmin } = useUser();

  if (!isAdmin) {
    // Show access denied page to non-admin users
    return <AccessDenied />;
  }

  return element;
};

export default AdminRoute;
