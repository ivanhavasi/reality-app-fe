import { useEffect, useState } from 'react';
import { Spinner } from 'react-bootstrap';
import { Moon, Sun } from 'react-bootstrap-icons';
import { useUser } from '../context/UserContext';
import { PageHeader, Segmented } from '../components/ui';

interface SettingsProps {
  token: string;
}

type Theme = 'light' | 'dark';

const Settings = ({ token }: SettingsProps) => {
  const { user } = useUser();
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const savedTheme = (localStorage.getItem('theme') ?? 'light') as Theme;
    setTheme(savedTheme);
    document.body.setAttribute('data-bs-theme', savedTheme);
  }, [token]);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.body.setAttribute('data-bs-theme', newTheme);
  };

  return (
    <div style={{ maxWidth: 720 }}>
      <PageHeader title="Settings" subtitle="Your account and how the app looks" />

      <section className="panel mb-3">
        <h2 className="panel-title mb-3">Account</h2>
        {user ? (
          <dl className="kv">
            <div className="kv-row">
              <dt>Name</dt>
              <dd>{user.username}</dd>
            </div>
            <div className="kv-row">
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div className="kv-row">
              <dt>Member since</dt>
              <dd>
                {new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </dd>
            </div>
            {user.roles && user.roles.length > 0 && (
              <div className="kv-row">
                <dt>Roles</dt>
                <dd className="d-flex flex-wrap justify-content-end gap-1">
                  {user.roles.map(role => (
                    <span key={role} className="chip">{role.toLowerCase()}</span>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        ) : (
          <div className="loading-block" style={{ minHeight: 120 }}>
            <Spinner animation="border" size="sm" role="status" />
            Loading account…
          </div>
        )}
      </section>

      <section className="panel">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <h2 className="panel-title">Appearance</h2>
            <p className="panel-subtitle">Saved on this device</p>
          </div>
          <Segmented
            ariaLabel="Theme"
            value={theme}
            onChange={handleThemeChange}
            options={[
              { value: 'light', label: 'Light', icon: Sun },
              { value: 'dark', label: 'Dark', icon: Moon },
            ]}
          />
        </div>
      </section>
    </div>
  );
};

export default Settings;
