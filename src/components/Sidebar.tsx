import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { isAdmin } = useUser();
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('sidebar');
      const sidebarToggle = document.querySelector('[data-sidebar-toggle]');

      if (window.innerWidth <= 768 && isOpen && sidebar && onClose &&
          !sidebar.contains(event.target as Node) &&
          !sidebarToggle?.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const isActiveRoute = (path: string) => location.pathname === path;

  const menuItems = [
    ...(isAdmin ? [{
      path: '/dashboard',
      label: 'Dashboard',
      icon: 'fas fa-tachometer-alt',
      description: 'Overview & Analytics'
    }] : []),
    {
      path: '/real-estates',
      label: 'Real Estates',
      icon: 'fas fa-home',
      description: 'Browse Properties'
    },
    {
      path: '/sent-notifications',
      label: 'Received Notifications',
      icon: 'fas fa-inbox',
      description: 'Your Alerts'
    },
    {
      path: '/notifications',
      label: 'Notifications',
      icon: 'fas fa-bell',
      description: 'Manage Alerts'
    },
  ];

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    if (window.innerWidth <= 768 && onClose) {
      onClose();
    }
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const handleSettingsClick = () => {
    navigate('/settings');
    if (window.innerWidth <= 768 && onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{
            zIndex: 2000,
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
          }}
        >
          <div
            className="bg-white rounded-4 shadow-lg p-4"
            style={{
              maxWidth: '400px',
              width: '90%',
              backgroundColor: 'var(--bs-body-bg)',
              color: 'var(--bs-body-color)',
              border: '1px solid var(--bs-border-color)'
            }}
          >
            <div className="text-center mb-4">
              <div className="mb-3">
                <i className="fas fa-sign-out-alt text-warning" style={{ fontSize: '3rem' }}></i>
              </div>
              <h5 className="fw-bold mb-2">Confirm Logout</h5>
              <p className="text-muted mb-0">
                Are you sure you want to log out of your account?
              </p>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-secondary flex-fill"
                onClick={cancelLogout}
                type="button"
              >
                Cancel
              </button>
              <button
                className="btn btn-danger flex-fill"
                onClick={confirmLogout}
                type="button"
              >
                <i className="fas fa-sign-out-alt me-2"></i>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="d-md-none position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
          style={{ zIndex: 1040 }}
          onClick={onClose}
          onKeyDown={(e) => e.key === 'Escape' && onClose?.()}
          role="button"
          tabIndex={0}
          aria-label="Close sidebar"
        />
      )}

      <div
        id="sidebar"
        className="border-end d-md-block shadow-sm d-flex flex-column position-fixed"
        style={{
          // Desktop styles - now fixed position
          width: isOpen ? '280px' : '0',
          minWidth: isOpen ? '280px' : '0',
          height: '100vh',
          maxHeight: '100vh',
          backgroundColor: 'var(--bs-body-bg)',
          color: 'var(--bs-body-color)',
          overflow: 'hidden',
          top: '0',
          // Mobile styles
          ...(window.innerWidth <= 768 ? {
            left: isOpen ? '0' : '-280px',
            zIndex: 1041,
            transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s ease',
            paddingTop: '70px', // Account for navbar height
          } : {
            paddingTop: '70px', // Account for navbar height on desktop too
          })
        }}
      >
        <div style={{
          width: '280px',
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.2s ease',
          visibility: isOpen ? 'visible' : 'hidden',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '100%' // Ensure content doesn't overflow
        }}>
          {/* Sidebar Header */}
          <div className="p-4 border-bottom" style={{ flexShrink: 0 }}>
            <h6 className="fw-bold text-muted mb-0 small">NAVIGATION</h6>
          </div>

          {/* Modern Menu Items - Scrollable area */}
          <div
            className="flex-grow-1"
            style={{
              overflowY: 'auto',
              overflowX: 'hidden',
              minHeight: 0 // Allow flexbox shrinking
            }}
          >
            <div className="p-3">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="text-decoration-none text-reset"
                  onClick={() => window.innerWidth <= 768 && onClose?.()}
                >
                  <div
                    className={`d-flex align-items-center p-3 mb-2 rounded-3 nav-item ${
                      isActiveRoute(item.path) ? 'nav-item-active' : ''
                    }`}
                  >
                    <div
                      className={`nav-icon rounded-circle d-flex align-items-center justify-content-center me-3`}
                      style={{width: '40px', height: '40px'}}
                    >
                      <i className={item.icon}></i>
                    </div>
                    <div className="flex-grow-1">
                      <div className="fw-medium">
                        {item.label}
                      </div>
                      <small className="nav-description">
                        {item.description}
                      </small>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Fixed Bottom Section with Settings and Logout - Always visible */}
          <div className="border-top" style={{ flexShrink: 0 }}>
            <div className="p-3">
              {/* Settings - Compact version */}
              <button
                className={`d-flex align-items-center p-2 mb-2 rounded-3 nav-item nav-item-compact w-100 border-0 bg-transparent ${
                  isActiveRoute('/settings') ? 'nav-item-active' : ''
                }`}
                onClick={handleSettingsClick}
                type="button"
                aria-label="Settings"
              >
                <div
                  className="nav-icon-compact rounded-circle d-flex align-items-center justify-content-center me-2"
                  style={{width: '32px', height: '32px', fontSize: '14px'}}
                >
                  <i className="fas fa-cog"></i>
                </div>
                <div className="flex-grow-1 text-start">
                  <div className="fw-medium" style={{ fontSize: '14px' }}>Settings</div>
                </div>
              </button>

              {/* Logout - Compact version */}
              <button
                className="d-flex align-items-center p-2 mb-2 rounded-3 nav-item nav-item-compact nav-item-logout w-100 border-0 bg-transparent"
                onClick={handleLogout}
                type="button"
                aria-label="Logout"
              >
                <div
                  className="nav-icon-compact rounded-circle d-flex align-items-center justify-content-center me-2"
                  style={{width: '32px', height: '32px', fontSize: '14px'}}
                >
                  <i className="fas fa-sign-out-alt"></i>
                </div>
                <div className="flex-grow-1 text-start">
                  <div className="fw-medium" style={{ fontSize: '14px' }}>Logout</div>
                </div>
              </button>
            </div>

            {/* Sidebar Footer */}
            <div className="p-2 text-center border-top">
              <small className="text-muted" style={{ fontSize: '11px' }}>
                🏠 Havasi Reality Platform
              </small>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
