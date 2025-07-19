import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Card, Button, Pagination } from 'react-bootstrap';
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

  return (
    <Container fluid className="px-2 px-md-4">
      <h1 className="text-center my-3 my-md-4 fs-4 fs-md-1">Sent Notifications</h1>
      <Row className="g-3 g-md-4">
        {notifications.map((notification) => (
          <Col key={notification.notificationId} xs={12} sm={6} lg={4} xl={3}>
            <Card
              className="h-100 shadow-sm"
              style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
              onClick={() => window.location.href = notification.realEstate.url}
              onMouseOver={(e) => {
                if (window.innerWidth > 768) {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 .5rem 1rem rgba(0,0,0,.15)';
                }
              }}
              onMouseOut={(e) => {
                if (window.innerWidth > 768) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 .125rem .25rem rgba(0,0,0,.075)';
                }
              }}
            >
              <Card.Img
                variant="top"
                src={notification.realEstate.image || defaultImage}
                alt={notification.realEstate.name}
                style={{ height: '160px', objectFit: 'cover' }}
              />
              <Card.Body className="d-flex flex-column">
                <Card.Title className="fs-6 line-clamp-2">{notification.realEstate.name}</Card.Title>
                <Card.Text className="mb-2">
                  <strong>Price:</strong> <span className="text-success fw-bold">{notification.realEstate.price.toFixed(0)} Kč</span>
                </Card.Text>
                <Card.Text className="mb-2">
                  <strong>City:</strong> <span className="text-muted">{notification.realEstate.city}</span>
                </Card.Text>
                <Card.Text className="mb-2">
                  <strong>Type:</strong> <span className="text-muted">{notification.type}</span>
                </Card.Text>
                <Card.Text className="mb-3">
                  <small className="text-muted">
                    Sent: {new Date(notification.sentAt).toLocaleDateString()}
                  </small>
                </Card.Text>
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(notification.realEstate.url, '_blank');
                  }}
                >
                  View Details
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {loading && (
        <div className="text-center my-4">
          <Spinner animation="border" variant="primary" />
          <div className="mt-2 text-muted">Loading notifications...</div>
        </div>
      )}

      <div className="d-flex justify-content-center my-4">
        <Pagination size="sm" className="flex-wrap">
          <Pagination.Prev
            disabled={currentPage === 1 || loading}
            onClick={handlePreviousPage}
          >
            <span className="d-none d-sm-inline">Previous</span>
            <span className="d-sm-none">‹</span>
          </Pagination.Prev>
          <Pagination.Item active>{currentPage}</Pagination.Item>
          <Pagination.Next
            disabled={loading}
            onClick={handleNextPage}
          >
            <span className="d-none d-sm-inline">Next</span>
            <span className="d-sm-none">›</span>
          </Pagination.Next>
        </Pagination>
      </div>

      {/* Only show this message if we've fetched at least once and got no results */}
      {!loading && notifications.length === 0 && (
        <div className="text-center my-5">
          <div className="alert alert-info d-inline-block">
            <h5>No notifications found</h5>
            <p className="mb-0">You haven't received any notifications yet.</p>
          </div>
        </div>
      )}
    </Container>
  );
};

export default ReceivedNotifications;
