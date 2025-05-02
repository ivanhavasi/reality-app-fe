import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Login from './components/Login';
import AdminLayout from './components/AdminLayout';
import { AuthProvider, useAuth } from './context/AuthContext';

const AppContent = () => {
  const { isAuthenticated } = useAuth();
  
  return isAuthenticated ? <AdminLayout /> : <Login />;
};

const App = () => {
  return (
    <GoogleOAuthProvider clientId="825102483513-d84p826mvtddldb1urdg1kv1gsj7tfv4.apps.googleusercontent.com">
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
