import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Card, Button, Pagination, Badge, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { fetchNotifications } from '../services/api';
import { userService } from '../services/UserService';

interface SentNotificationRealEstate {
  id: string;
  name: string;
  url: string;
  price: number;
  city: string;
  image: string;
  provider: string;
}

interface SentNotification {
  notificationId: string;
  userId: string;
  type: string;
  realEstate: SentNotificationRealEstate;
  sentAt: string; // OffsetDateTime as string (for simplicity)
}

interface ReceivedNotificationsProps {
  token: string;
}

const ReceivedNotifications = ({ token }: ReceivedNotificationsProps) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<SentNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  // Always assume there are more pages until proven otherwise
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const limit = 20;
  const defaultImage = 'https://via.placeholder.com/150?text=Image+Not+Available';

  // Use a single useEffect for data fetching that depends only on currentPage and token
  useEffect(() => {
    const fetchData = async () => {
      if (loading) return;

      setLoading(true);

      try {
        // Get the user ID from storage
        const userId = userService.getUserId();
        
        if (!userId) {
          console.error('User ID not found in storage');
          setLoading(false);
          return;
        }
        
        const newNotifications = await fetchNotifications(
          userId,
          limit,
          (currentPage - 1) * limit,
        );
        
        // Always replace notifications with new page data
        setNotifications(newNotifications);
        
        // If we got no results, definitely no more pages
        // Otherwise, assume there might be more until proven otherwise
        setHasMore(newNotifications.length > 0);
      } catch (error) {
        console.error('Failed to fetch notifications', error);
        // In case of error, don't change hasMore state
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
    // Only run when these dependencies change
  }, [currentPage, token, limit]);

  const handleNextPage = () => {
    if (!hasMore || loading) return; // Prevent navigating if no more data or currently loading
    setCurrentPage((prevPage) => prevPage + 1);
  };
  
  const handlePreviousPage = () => {
    if (currentPage === 1 || loading) return; // Prevent navigating if already at first page or loading
    setCurrentPage((prevPage) => prevPage - 1);
  };

  const handleRealEstateClick = (realEstateId: string) => {
    navigate(`/real-estates/${realEstateId}`);
  };

  return (
    <Container fluid className="p-0">
      {/* Modern Header Section */}
      <div className="gradient-header py-4 py-md-5 mb-4">
        <Container>
          <Row className="align-items-center">
            <Col>
              <h1 className="display-6 display-md-4 fw-bold text-white mb-2 mb-md-3">
                Your Property Alerts
              </h1>
              <p className="text-white opacity-90 mb-0 fs-6">
                Stay updated with the latest property notifications matching your preferences
              </p>
            </Col>
            <Col xs="auto">
              <div className="d-flex align-items-center text-white">
                <i className="fas fa-bell fa-2x me-3 opacity-75"></i>
                <div>
                  <div className="fs-4 fw-bold">{notifications.length}</div>
                  <small className="opacity-90">Notifications</small>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      <Container>
        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading notifications...</span>
            </Spinner>
          </div>
        )}

        {/* Empty State */}
        {!loading && notifications.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <i className="fas fa-bell-slash"></i>
            </div>
            <h3>No Notifications Yet</h3>
            <p className="text-muted">
              You haven't received any property notifications yet. Set up alerts to get notified about new listings!
            </p>
            <Button variant="primary" className="modern-btn" href="/notifications">
              <i className="fas fa-plus me-2"></i>
              Create Notifications
            </Button>
          </div>
        )}

        {/* Notifications Grid */}
        {!loading && notifications.length > 0 && (
          <>
            <Row className="mb-4">
              <Col>
                <div className="d-flex justify-content-between align-items-center">
                  <h4 className="mb-0">Recent Notifications</h4>
                  <Badge bg="primary" className="fs-6 px-3 py-2">
                    {notifications.length} Total
                  </Badge>
                </div>
              </Col>
            </Row>

            <Row className="g-4">
              {notifications.map((notification) => (
                <Col key={notification.notificationId} sm={6} lg={4} xl={3}>
                  <Card
                    className="real-estate-card h-100"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleRealEstateClick(notification.realEstate.id)}
                  >
                    {/* Property Image */}
                    <div className="position-relative">
                      <Card.Img
                        variant="top"
                        src={notification.realEstate.image || defaultImage}
                        alt={notification.realEstate.name}
                        className="card-img-top"
                        style={{ height: '200px', objectFit: 'cover' }}
                      />
                      <Badge
                        bg="success"
                        className="position-absolute top-0 start-0 m-2"
                      >
                        {notification.type}
                      </Badge>
                      <Badge
                        bg="secondary"
                        className="position-absolute top-0 end-0 m-2"
                      >
                        {notification.realEstate.provider}
                      </Badge>
                    </div>

                    <Card.Body className="d-flex flex-column">
                      <Card.Title className="h6 mb-2 line-clamp-2">
                        {notification.realEstate.name}
                      </Card.Title>

                      <div className="d-flex align-items-center text-muted mb-2">
                        <i className="fas fa-map-marker-alt me-1"></i>
                        <small className="line-clamp-1">
                          {notification.realEstate.city}
                        </small>
                      </div>

                      <div className="mt-auto">
                        <div className="price-badge py-1 px-2 mb-2 text-center">
                          <div className="fw-bold">
                            {notification.realEstate.price.toLocaleString()} Kč
                          </div>
                        </div>

                        <div className="d-flex justify-content-between align-items-center">
                          <small className="text-muted">
                            {new Date(notification.sentAt).toLocaleDateString()}
                          </small>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="modern-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRealEstateClick(notification.realEstate.id);
                            }}
                          >
                            <i className="fas fa-eye me-1"></i>
                            View
                          </Button>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Pagination */}
            {hasMore && (
              <div className="d-flex justify-content-center mt-5">
                <Button
                  variant="primary"
                  className="modern-btn px-4 py-2"
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-chevron-down me-2"></i>
                      Load More
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </Container>
    </Container>
  );
};

export default ReceivedNotifications;
