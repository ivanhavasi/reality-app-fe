import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Login from './components/Login';
import AdminLayout from './components/AdminLayout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UserProvider } from './context/UserContext';
import { RealEstateProvider } from './context/RealEstateContext';

const AppContent = () => {
  const { isAuthenticated } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/*" element={isAuthenticated ? <AdminLayout /> : <Navigate to="/login" />} />
    </Routes>
  );
};

const App = () => {
  return (
    <GoogleOAuthProvider clientId="825102483513-d84p826mvtddldb1urdg1kv1gsj7tfv4.apps.googleusercontent.com">
      <UserProvider>
        <AuthProvider>
          <RealEstateProvider>
            <Router>
              <AppContent />
            </Router>
          </RealEstateProvider>
        </AuthProvider>
      </UserProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
