import { Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useEffect } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { isAdmin } = useUser();

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
        className="border-end d-md-block"
        style={{
          // Desktop styles
          width: isOpen ? '250px' : '0',
          minWidth: isOpen ? '250px' : '0',
          flex: isOpen ? '0 0 250px' : '0 0 0',
          minHeight: '100vh',
          backgroundColor: 'var(--bs-body-bg)',
          color: 'var(--bs-body-color)',
          overflow: 'hidden',
          transition: 'width 0.3s ease, min-width 0.3s ease',
          // Mobile styles (override desktop on small screens)
          ...(window.innerWidth <= 768 ? {
            position: 'fixed',
            top: '0',
            left: isOpen ? '0' : '-250px',
            width: '250px',
            minWidth: '250px',
            height: '100vh',
            zIndex: 1041,
            transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s ease',
            paddingTop: '70px', // Account for navbar height
          } : {})
        }}
      >
        <div style={{
          width: '250px',
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.2s ease',
          visibility: isOpen ? 'visible' : 'hidden'
        }}>
          <ul className="list-group list-group-flush">
            {isAdmin && (
              <li className="list-group-item bg-transparent">
                <Link
                  to="/dashboard"
                  className="text-decoration-none text-reset d-block py-2"
                  onClick={() => window.innerWidth <= 768 && onClose?.()}
                >
                  Admin Dashboard
                </Link>
              </li>
            )}
            <li className="list-group-item bg-transparent">
              <Link
                to="/real-estates"
                className="text-decoration-none text-reset d-block py-2"
                onClick={() => window.innerWidth <= 768 && onClose?.()}
              >
                Real Estates
              </Link>
            </li>
            <li className="list-group-item bg-transparent">
              <Link
                to="/sent-notifications"
                className="text-decoration-none text-reset d-block py-2"
                onClick={() => window.innerWidth <= 768 && onClose?.()}
              >
                Received Notifications
              </Link>
            </li>
            <li className="list-group-item bg-transparent">
              <Link
                to="/notifications"
                className="text-decoration-none text-reset d-block py-2"
                onClick={() => window.innerWidth <= 768 && onClose?.()}
              >
                Notifications
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
