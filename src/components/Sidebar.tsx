import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useEffect } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { isAdmin } = useUser();
  const location = useLocation();

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

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="d-md-none position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
          style={{ zIndex: 1040 }}
          onClick={onClose}
        />
      )}

      <div
        id="sidebar"
        className="border-end d-md-block shadow-sm"
        style={{
          // Desktop styles
          width: isOpen ? '280px' : '0',
          minWidth: isOpen ? '280px' : '0',
          flex: isOpen ? '0 0 280px' : '0 0 0',
          minHeight: '100vh',
          backgroundColor: 'var(--bs-body-bg)',
          color: 'var(--bs-body-color)',
          overflow: 'hidden',
          transition: 'width 0.3s ease, min-width 0.3s ease',
          // Mobile styles (override desktop on small screens)
          ...(window.innerWidth <= 768 ? {
            position: 'fixed',
            top: '0',
            left: isOpen ? '0' : '-280px',
            width: '280px',
            minWidth: '280px',
            height: '100vh',
            zIndex: 1041,
            transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s ease',
            paddingTop: '70px', // Account for navbar height
          } : {})
        }}
      >
        <div style={{
          width: '280px',
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.2s ease',
          visibility: isOpen ? 'visible' : 'hidden'
        }}>
          {/* Sidebar Header */}
          <div className="p-4 border-bottom">
            <h6 className="fw-bold text-muted mb-0 small">NAVIGATION</h6>
          </div>

          {/* Modern Menu Items */}
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

          {/* Sidebar Footer */}
          <div className="position-absolute bottom-0 w-100 p-3 border-top">
            <div className="text-center">
              <small className="text-muted">
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
