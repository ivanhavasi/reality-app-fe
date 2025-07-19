import { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

interface Props {
  token: string;
}

const Dashboard = ({ token }: Props) => {
  const [data, setData] = useState<string | null>(null);
  const { isAdmin, user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    // No need to call getUserInfo here as it's handled in login
    if (user) {
      setData(user.username);
    }
  }, [user, token]);

  return (
    <Container fluid className="p-0">
      {/* Modern Hero Section */}
      <div className="gradient-header py-4 py-md-5 mb-4 rounded-3">
        <Container>
          <Row>
            <Col>
              <h1 className="display-6 display-md-4 fw-bold text-white mb-3">
                Welcome back, {data || 'User'}! 👋
              </h1>
              <p className="text-white opacity-90 fs-5 mb-4">
                {isAdmin ? 'Manage your real estate platform' : 'Find your perfect home in Prague'}
              </p>
              <Button
                variant="light"
                size="lg"
                className="modern-btn px-4 py-2 shadow"
                onClick={() => navigate('/real-estates')}
              >
                <i className="fas fa-search me-2"></i>
                Browse Properties
              </Button>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Quick Actions Section */}
      <Container>
        <Row className="mb-4">
          <Col>
            <h3 className="h4 mb-4">Quick Actions</h3>
          </Col>
        </Row>

        <Row className="g-4">
          <Col md={6} lg={4}>
            <Card className="modern-card h-100 border-0">
              <Card.Body className="text-center p-4">
                <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                  <i className="fas fa-home fa-lg text-primary"></i>
                </div>
                <Card.Title className="h5">Real Estates</Card.Title>
                <Card.Text className="text-muted mb-3">
                  Browse and search through available properties in Prague region
                </Card.Text>
                <Button
                  variant="primary"
                  className="modern-btn"
                  onClick={() => navigate('/real-estates')}
                >
                  View Properties
                </Button>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} lg={4}>
            <Card className="modern-card h-100 border-0">
              <Card.Body className="text-center p-4">
                <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                  <i className="fas fa-bell fa-lg text-success"></i>
                </div>
                <Card.Title className="h5">Notifications</Card.Title>
                <Card.Text className="text-muted mb-3">
                  Set up alerts for new properties matching your preferences
                </Card.Text>
                <Button
                  variant="success"
                  className="modern-btn"
                  onClick={() => navigate('/notifications')}
                >
                  Manage Alerts
                </Button>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} lg={4}>
            <Card className="modern-card h-100 border-0">
              <Card.Body className="text-center p-4">
                <div className="bg-info bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                  <i className="fas fa-cog fa-lg text-info"></i>
                </div>
                <Card.Title className="h5">Settings</Card.Title>
                <Card.Text className="text-muted mb-3">
                  Customize your account preferences and notification settings
                </Card.Text>
                <Button
                  variant="info"
                  className="modern-btn"
                  onClick={() => navigate('/settings')}
                >
                  Open Settings
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {isAdmin && (
          <>
            <Row className="mt-5 mb-4">
              <Col>
                <h3 className="h4 mb-4">
                  <i className="fas fa-crown text-warning me-2"></i>
                  Admin Controls
                </h3>
              </Col>
            </Row>

            <Row className="g-4">
              <Col md={6}>
                <Card className="modern-card border-0" style={{background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'}}>
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center mb-3">
                      <div className="bg-warning bg-opacity-20 rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '50px', height: '50px'}}>
                        <i className="fas fa-users fa-lg text-warning"></i>
                      </div>
                      <div>
                        <Card.Title className="h5 mb-1">User Management</Card.Title>
                        <Card.Text className="text-muted small mb-0">
                          Administrative privileges active
                        </Card.Text>
                      </div>
                    </div>
                    <Card.Text>
                      You have full administrative access to manage users, properties, and platform settings.
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6}>
                <Card className="modern-card border-0" style={{background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'}}>
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center mb-3">
                      <div className="bg-info bg-opacity-20 rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '50px', height: '50px'}}>
                        <i className="fas fa-chart-line fa-lg text-info"></i>
                      </div>
                      <div>
                        <Card.Title className="h5 mb-1">Platform Analytics</Card.Title>
                        <Card.Text className="text-muted small mb-0">
                          Monitor platform performance
                        </Card.Text>
                      </div>
                    </div>
                    <Card.Text>
                      Access detailed analytics and insights about user activity and property listings.
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Container>
    </Container>
  );
};

export default Dashboard;
