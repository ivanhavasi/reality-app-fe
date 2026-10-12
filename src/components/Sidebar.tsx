import { Link, NavLink } from 'react-router-dom';
import { useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { BarChartLine, Bell, BoxArrowRight, DatabaseGear, Gear, Grid1x2, HouseDoor, Inbox, Star } from 'react-bootstrap-icons';
import type { Icon } from 'react-bootstrap-icons';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { BrandMark, initials } from './ui';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: Icon;
  count?: number | null;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { isAdmin, user } = useUser();
  const { logout } = useAuth();
  const { count: favoriteCount } = useFavorites();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const browseItems: NavItem[] = [
    ...(isAdmin ? [{ to: '/dashboard', label: 'Overview', icon: Grid1x2 }] : []),
    { to: '/real-estates', label: 'Listings', icon: HouseDoor },
    { to: '/favorites', label: 'Saved', icon: Star, count: favoriteCount },
    { to: '/stats', label: 'Market stats', icon: BarChartLine },
  ];

  const alertItems: NavItem[] = [
    { to: '/notifications', label: 'Alerts', icon: Bell },
    { to: '/sent-notifications', label: 'Matches', icon: Inbox },
  ];

  const renderLink = ({ to, label, icon: ItemIcon, count }: NavItem) => (
    <NavLink
      key={to}
      to={to}
      className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
      onClick={onClose}
    >
      <ItemIcon size={17} />
      {label}
      {!!count && <span className="sidebar-count">{count}</span>}
    </NavLink>
  );

  return (
    <>
      <aside id="sidebar" className={`app-sidebar${isOpen ? ' is-open' : ''}`} aria-label="Main navigation">
        <div className="sidebar-brand">
          <Link to="/" className="brand" onClick={onClose}>
            <BrandMark />
            Havasi Reality
          </Link>
        </div>

        <div className="sidebar-scroll">
          <div className="sidebar-label">Browse</div>
          <nav className="sidebar-nav">{browseItems.map(renderLink)}</nav>

          <div className="sidebar-label">Alerts</div>
          <nav className="sidebar-nav">{alertItems.map(renderLink)}</nav>

          {isAdmin && (
            <>
              <div className="sidebar-divider" />
              <div className="sidebar-label">Admin</div>
              <nav className="sidebar-nav">{renderLink({ to: '/admin', label: 'Data jobs', icon: DatabaseGear })}</nav>
            </>
          )}
        </div>

        <div className="sidebar-footer">
          <nav className="sidebar-nav p-0">
            {renderLink({ to: '/settings', label: 'Settings', icon: Gear })}
          </nav>
          <div className="sidebar-user">
            <div className="avatar">{initials(user?.username)}</div>
            <div className="flex-grow-1" style={{ minWidth: 0 }}>
              <div className="sidebar-user-name text-truncate">{user?.username ?? 'Signed in'}</div>
              {user?.email && <div className="sidebar-user-email text-truncate">{user.email}</div>}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="btn-icon"
              onClick={() => setShowLogoutConfirm(true)}
              aria-label="Sign out"
              title="Sign out"
            >
              <BoxArrowRight size={16} />
            </Button>
          </div>
        </div>
      </aside>

      <Modal show={showLogoutConfirm} onHide={() => setShowLogoutConfirm(false)} centered size="sm">
        <Modal.Body className="pb-2">
          <h2 className="h6 fw-bold mb-1">Sign out?</h2>
          <p className="text-2 mb-0" style={{ fontSize: '0.875rem' }}>You'll need to sign in with Google again to see your alerts.</p>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-2">
          <Button variant="outline-secondary" onClick={() => setShowLogoutConfirm(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setShowLogoutConfirm(false);
              onClose?.();
              logout();
            }}
          >
            Sign out
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Sidebar;
