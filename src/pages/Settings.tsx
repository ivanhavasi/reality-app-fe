import { useEffect, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

interface SettingsProps {
  token: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
  roles: string[];
}

const Settings = ({ token }: SettingsProps) => {
  const { user } = useUser();
  const [theme, setTheme] = useState<string>('light');
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.body.setAttribute('data-bs-theme', savedTheme);
  }, [token]);

useEffect(() => {
  if (user) {
    console.log('User loaded:', user);
  }
}, [user]);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.body.setAttribute('data-bs-theme', newTheme);
  };

  return (
    <div>
      <h3>User Settings</h3>
      {user ? (
        <div className="mb-3">
          <p><strong>Name:</strong> {user.username}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Joined:</strong> {new Date(user.createdAt).toLocaleString('en-GB', {dateStyle: 'medium', timeStyle: 'short'})}</p>
        </div>
      ) : (<div>Loading user data {user}</div>)
    }

      <Form>
        <Form.Label>Theme</Form.Label>
        <Form.Select
          value={theme}
          onChange={(e) => handleThemeChange(e.target.value)}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </Form.Select>
      </Form>

      <Button variant="secondary" className="mt-3" onClick={() => navigate(-1)}>
        Back
      </Button>
    </div>
  );
};

export default Settings;
