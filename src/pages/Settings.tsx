import { useEffect, useState } from 'react';
import { Button, Form, Container, Row, Col, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

interface SettingsProps {
  token: string;
}

const Settings = ({ token }: SettingsProps) => {
  const { user } = useUser();
  const [theme, setTheme] = useState<string>('light');
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') ?? 'light';
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
    <Container fluid className="p-0">
      {/* Modern Hero Section */}
      <div className="gradient-header py-4 py-md-5 mb-4 rounded-3">
        <Container>
          <Row>
            <Col>
              <h1 className="display-6 fw-bold text-white mb-3">
                <i className="fas fa-cog me-3"></i>
                Settings
              </h1>
              <p className="text-white opacity-90 fs-5 mb-0">
                Manage your account preferences and application settings
              </p>
            </Col>
          </Row>
        </Container>
      </div>

      <Container>
        <Row className="g-4">
          {/* User Information Card */}
          <Col lg={6}>
            <Card className="modern-card h-100 border-0">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center mb-4">
                  <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center me-3" style={{width: '50px', height: '50px'}}>
                    <i className="fas fa-user fa-lg text-primary"></i>
                  </div>
                  <h4 className="mb-0">Account Information</h4>
                </div>

                {user ? (
                  <div className="mb-3">
                    <div className="mb-3">
                      <label className="form-label text-muted small">USERNAME</label>
                      <p className="fw-medium mb-0">{user.username}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-muted small">EMAIL</label>
                      <p className="fw-medium mb-0">{user.email}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-muted small">MEMBER SINCE</label>
                      <p className="fw-medium mb-0">
                        {new Date(user.createdAt).toLocaleString('en-GB', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </p>
                    </div>
                    {user.roles && user.roles.length > 0 && (
                      <div className="mb-0">
                        <label className="form-label text-muted small">ROLES</label>
                        <div>
                          {user.roles.map((role, index) => (
                            <span key={index} className="badge bg-secondary me-2">
                              {role}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="text-muted mt-2">Loading user data...</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Theme Settings Card */}
          <Col lg={6}>
            <Card className="modern-card h-100 border-0">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center mb-4">
                  <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center me-3" style={{width: '50px', height: '50px'}}>
                    <i className="fas fa-palette fa-lg text-success"></i>
                  </div>
                  <h4 className="mb-0">Appearance</h4>
                </div>

                <Form>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-medium mb-3">Theme Preference</Form.Label>
                    <Form.Select
                      value={theme}
                      onChange={(e) => handleThemeChange(e.target.value)}
                      className="form-select-lg"
                    >
                      <option value="light">Light Mode</option>
                      <option value="dark">Dark Mode</option>
                    </Form.Select>
                    <Form.Text className="text-muted">
                      Choose your preferred color scheme for the application
                    </Form.Text>
                  </Form.Group>
                </Form>

                <div className="d-flex gap-2 mt-auto">
                  <Button
                    variant="outline-secondary"
                    className="flex-fill"
                    onClick={() => navigate(-1)}
                  >
                    <i className="fas fa-arrow-left me-2"></i>
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-fill modern-btn"
                    onClick={() => navigate('/dashboard')}
                  >
                    <i className="fas fa-home me-2"></i>
                    Dashboard
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </Container>
  );
};

export default Settings;
