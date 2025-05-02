import { Link } from 'react-router-dom';

const Sidebar = () => {
  return (
    <div
      className="border-end"
      style={{
        width: '250px',
        minHeight: '100vh',
        backgroundColor: 'var(--bs-body-bg)',
        color: 'var(--bs-body-color)',
      }}
    >
      <ul className="list-group list-group-flush">
        <li className="list-group-item bg-transparent">
          <Link to="/" className="text-decoration-none text-reset">Dashboard</Link>
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
