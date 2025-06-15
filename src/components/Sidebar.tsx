import { Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const Sidebar = () => {
  const { isAdmin } = useUser();

  return (
    <div
      className="border-end"
      style={{
        width: '250px',
        minWidth: '250px',  // Added minWidth to prevent shrinking
        flex: '0 0 250px',  // Added flex property to maintain width
        minHeight: '100vh',
        backgroundColor: 'var(--bs-body-bg)',
        color: 'var(--bs-body-color)',
      }}
    >
      <ul className="list-group list-group-flush">
        {isAdmin && (
          <li className="list-group-item bg-transparent">
            <Link to="/dashboard" className="text-decoration-none text-reset">Admin Dashboard</Link>
          </li>
        )}
        <li className="list-group-item bg-transparent">
          <Link to="/real-estates" className="text-decoration-none text-reset">Real Estates</Link>
        </li>
        <li className="list-group-item bg-transparent">
          <Link to="/sent-notifications" className="text-decoration-none text-reset">Received Notifications</Link>
        </li>
        <li className="list-group-item bg-transparent">
          <Link to="/notifications" className="text-decoration-none text-reset">Notifications</Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
