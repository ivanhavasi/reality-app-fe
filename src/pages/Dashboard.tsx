import { useEffect, useState } from 'react';
import { getUserInfo } from '../services/api';
import { useUser } from '../context/UserContext';

interface Props {
  token: string;
}

const Dashboard = ({ token }: Props) => {
  const [data, setData] = useState<string | null>(null);
  const { isAdmin, user } = useUser();

  useEffect(() => {
    // No need to call getUserInfo here as it's handled in login
    if (user) {
      setData(user.username);
    }
  }, [user, token]);

  return (
    <div>
      <h2>Welcome to {isAdmin ? 'Admin' : 'User'} Dashboard</h2>
      <p>Hello, {data}</p>
      {isAdmin && (
        <div className="admin-section">
          <h3>Admin Controls</h3>
          <p>You have administrative privileges</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
