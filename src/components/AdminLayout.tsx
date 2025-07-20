import {Navigate, Route, Routes} from 'react-router-dom';
import Sidebar from './Sidebar';
import Dashboard from '../pages/Dashboard';
import Settings from '../pages/Settings';
import AdminRoute from './AdminRoute';
import RootRedirect from './RootRedirect';
import ReceivedNotifications from '../pages/ReceivedNotifications';
import Notifications from '../pages/Notifications';
import RealEstates from '../pages/RealEstates';
import RealEstateDetail from '../pages/RealEstateDetail';
import {Navbar, Button} from 'react-bootstrap';
import {List} from 'react-bootstrap-icons';
import {useAuth} from '../context/AuthContext';
import {useState, useEffect} from 'react';

const AdminLayout = ({children}: { children?: React.ReactNode }) => {
  const {token} = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile and adjust sidebar behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false); // Close sidebar by default on mobile
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="d-flex flex-column" style={{minHeight: '100vh'}}>
      {/* Modern Navbar with gradient - Fixed position to stay above sidebar */}
      <Navbar
        data-bs-theme="dark"
        expand="lg"
        className="px-3 px-md-4 shadow-sm position-fixed w-100"
        style={{
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          borderBottom: 'none',
          zIndex: 1050, // Higher than sidebar to stay on top
          top: 0
        }}
      >
        <div className="d-flex align-items-center">
          <Button
            variant="light"
            onClick={toggleSidebar}
            className="me-2 me-md-3 shadow-sm"
            size="sm"
            data-sidebar-toggle
          >
            <List />
          </Button>
          <Navbar.Brand className="fw-bold fs-6 fs-md-5 text-white d-flex align-items-center">
            🏠 <span className="ms-2">Havasi Reality Platform</span>
          </Navbar.Brand>
        </div>
      </Navbar>

      {/* Main content area with top padding for fixed navbar */}
      <div className="d-flex flex-grow-1 overflow-hidden" style={{ paddingTop: '70px' }}>
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <div
          className="flex-grow-1 p-2 p-md-4"
          style={{
            overflow: 'auto',
            overflowX: 'hidden',
            background: 'var(--bs-body-bg)',
            // Add left margin for fixed sidebar on desktop
            marginLeft: window.innerWidth > 768 ? (sidebarOpen ? '280px' : '0') : '0',
            transition: 'margin-left 0.3s ease',
            // Mobile doesn't need margin since sidebar is overlay
            ...(isMobile ? { marginLeft: '0' } : {})
          }}
        >
          {children || (
            <Routes>
              <Route path="/" element={<RootRedirect />}/>
              <Route path="/dashboard" element={<AdminRoute element={<Dashboard token={token || ''}/>}/>}/>
              <Route path="/real-estates" element={<RealEstates token={token || ''}/>}/>
              <Route path="/real-estates/:id" element={<RealEstateDetail token={token || ''}/>}/>
              <Route path="/settings" element={<Settings token={token || ''}/>}/>
              <Route path="/sent-notifications" element={<ReceivedNotifications token={token || ''}/>}/>
              <Route path="/notifications" element={<Notifications token={token || ''}/>}/>
            </Routes>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
