import { Routes, Route, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Dashboard from '../pages/Dashboard';
import Settings from '../pages/Settings';
import ReceivedNotifications from '../pages/ReceivedNotifications';
import { Navbar, Nav, Dropdown } from 'react-bootstrap';
import { GearFill } from 'react-bootstrap-icons';
import { useAuth } from '../context/AuthContext';

const AdminLayout = () => {
  const navigate = useNavigate();
  const { logout, token } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="d-flex flex-column" style={{ minHeight: '100vh' }}>
      <Navbar bg="body" data-bs-theme="auto" expand="lg" className="px-4 border-bottom">
        <Navbar.Brand className="fw-bold">Admin Panel</Navbar.Brand>
        <Navbar.Collapse className="justify-content-end">
          <Nav>
            <Dropdown align="end">
              <Dropdown.Toggle variant="light" id="dropdown-basic">
                <GearFill />
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => navigate('/settings')}>
                  Settings
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout}>
                  Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </Navbar.Collapse>
      </Navbar>

      <div className="d-flex flex-grow-1">
        <Sidebar />
        <div className="flex-grow-1 p-4 bg-body">
          <Routes>
            <Route path="/" element={<Dashboard token={token || ''} />} />
            <Route path="/settings" element={<Settings token={token || ''} />} />
            <Route path="/sent-notifications" element={<ReceivedNotifications token={token || ''} />} />
            {/* Add more routes as needed */}
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
