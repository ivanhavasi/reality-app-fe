import {Navigate, Route, Routes, useNavigate} from 'react-router-dom';
import Sidebar from './Sidebar';
import Dashboard from '../pages/Dashboard';
import Settings from '../pages/Settings';
import AdminRoute from './AdminRoute';
import RootRedirect from './RootRedirect';
import ReceivedNotifications from '../pages/ReceivedNotifications';
import Notifications from '../pages/Notifications';
import RealEstates from '../pages/RealEstates';
import RealEstateDetail from '../pages/RealEstateDetail';
import {Dropdown, Nav, Navbar, Button} from 'react-bootstrap';
import {GearFill, List} from 'react-bootstrap-icons';
import {useAuth} from '../context/AuthContext';
import {useState, useEffect} from 'react';

const AdminLayout = ({children}: { children?: React.ReactNode }) => {
  const navigate = useNavigate();
  const {logout, token} = useAuth();
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

  const handleLogout = () => {
    logout();
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="d-flex flex-column" style={{minHeight: '100vh'}}>
      {/* Modern Navbar with gradient */}
      <Navbar
        data-bs-theme="dark"
        expand="lg"
        className="px-3 px-md-4 shadow-sm"
        style={{
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          borderBottom: 'none'
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
        <Navbar.Collapse className="justify-content-end">
          <Nav>
            <Dropdown align="end">
              <Dropdown.Toggle
                variant="light"
                id="dropdown-basic"
                size="sm"
                className="shadow-sm"
              >
                <GearFill/>
              </Dropdown.Toggle>
              <Dropdown.Menu className="shadow">
                <Dropdown.Item onClick={() => navigate('/settings')}>
                  Settings
                </Dropdown.Item>
                <Dropdown.Divider/>
                <Dropdown.Item onClick={handleLogout}>
                  Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </Navbar.Collapse>
      </Navbar>

      <div className="d-flex flex-grow-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <div
          className="flex-grow-1 p-2 p-md-4"
          style={{
            overflow: 'auto',
            overflowX: 'hidden',
            background: 'var(--bs-body-bg)',
            // Adjust margin on mobile when sidebar is open
            ...(isMobile && sidebarOpen ? { marginLeft: '0' } : {})
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
