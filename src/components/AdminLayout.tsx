import {Navigate, Route, Routes, useLocation} from 'react-router-dom';
import Sidebar from './Sidebar';
import Dashboard from '../pages/Dashboard';
import Settings from '../pages/Settings';
import AdminRoute from './AdminRoute';
import RootRedirect from './RootRedirect';
import ReceivedNotifications from '../pages/ReceivedNotifications';
import Notifications from '../pages/Notifications';
import RealEstates from '../pages/RealEstates';
import RealEstateDetail from '../pages/RealEstateDetail';
import Stats from '../pages/Stats';
import Admin from '../pages/Admin';
import {Button} from 'react-bootstrap';
import {List} from 'react-bootstrap-icons';
import {Link} from 'react-router-dom';
import {useAuth} from '../context/AuthContext';
import {useEffect, useState} from 'react';
import {BrandMark} from './ui';

const AdminLayout = ({children}: { children?: React.ReactNode }) => {
  const {token} = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && setSidebarOpen(false);
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [sidebarOpen]);

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && <div className="app-backdrop d-lg-none" onClick={() => setSidebarOpen(false)} aria-hidden="true" />}

      <div className="app-main">
        <header className="app-topbar">
          <Button variant="ghost" className="btn-icon" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <List size={20} />
          </Button>
          <Link to="/" className="brand">
            <BrandMark size={24} />
            Havasi Reality
          </Link>
        </header>

        <main className="app-content">
          {children || (
            <Routes>
              <Route path="/" element={<RootRedirect />}/>
              <Route path="/dashboard" element={<AdminRoute element={<Dashboard token={token || ''}/>}/>}/>
              <Route path="/real-estates" element={<RealEstates token={token || ''}/>}/>
              <Route path="/real-estates/:id" element={<RealEstateDetail token={token || ''}/>}/>
              <Route path="/stats" element={<Stats />}/>
              <Route path="/settings" element={<Settings token={token || ''}/>}/>
              <Route path="/sent-notifications" element={<ReceivedNotifications token={token || ''}/>}/>
              <Route path="/notifications" element={<Notifications token={token || ''}/>}/>
              <Route path="/admin" element={<AdminRoute element={<Admin />}/>}/>
              <Route path="*" element={<Navigate to="/" />}/>
            </Routes>
          )}
        </main>
      </div>
    </>
  );
};

export default AdminLayout;
