import { useEffect, useState } from 'react';
import { fetchProtectedData } from '../services/api';

interface Props {
  token: string;
}

const Dashboard = ({ token }: Props) => {
  const [data, setData] = useState<string | null>(null);

  useEffect(() => {
    fetchProtectedData().then(setData).catch(console.error);
  }, [token]);

  return (
    <div>
      <h2>Welcome to Admin Dashboard</h2>
      <p>Data from API: {data}</p>
    </div>
  );
};

export default Dashboard;
