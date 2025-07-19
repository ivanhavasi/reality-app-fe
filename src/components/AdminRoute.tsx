import React from 'react';
import { useUser } from '../context/UserContext';
import {Navigate} from "react-router-dom";

interface AdminRouteProps {
  element: React.ReactElement;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ element }) => {
  const { isAdmin } = useUser();

  if (!isAdmin) {
    // Show access denied page to non-admin users
    return <Navigate to="/"/>;
  }

  return element;
};

export default AdminRoute;
