import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Login from './components/Login';
import AdminLayout from './components/AdminLayout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UserProvider } from './context/UserContext';
import { RealEstateProvider } from './context/RealEstateContext';
import PublicRealEstateDetail from './pages/PublicRealEstateDetail';
import RealEstateDetail from './pages/RealEstateDetail';
import { ErrorProvider } from './context/ErrorContext';
import ErrorToast from './components/ErrorToast';
import { Spinner } from 'react-bootstrap';

// Component to show the appropriate real estate detail based on authentication
const RealEstateDetailRouter: React.FC = () => {
  const { isAuthenticated, token } = useAuth();

  if (isAuthenticated) {
    // Show the full admin version with sidebar and all features
    return (
      <AdminLayout>
        <RealEstateDetail token={token || ''} />
      </AdminLayout>
    );
  } else {
    // Show public version for non-authenticated users
    return <PublicRealEstateDetail />;
  }
};

const AppContent = () => {
  const { isAuthenticated, isInitializing } = useAuth();

  // Show loading spinner while initializing authentication
  if (isInitializing) {
    return (
      <div className="splash">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
      {/* Same URL shows different components based on authentication */}
      <Route path="/real-estates/:id" element={<RealEstateDetailRouter />} />
      {/* All other routes require authentication */}
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
            <ErrorProvider>
              <Router>
                <AppContent />
              </Router>
              <ErrorToast />
            </ErrorProvider>
          </RealEstateProvider>
        </AuthProvider>
      </UserProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
