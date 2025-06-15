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
    <Container>
      <h1 className="text-center my-4">Sent Notifications</h1>
      <Row>
        {notifications.map((notification) => (
          <Col key={notification.notificationId} xs={12} sm={6} md={4} lg={3} className="mb-4">
            <Card
              style={{ cursor: 'pointer' }}
              onClick={() => window.location.href = notification.realEstate.url}
            >
              <Card.Img
                variant="top"
                src={notification.realEstate.image || defaultImage}
                alt={notification.realEstate.name}
                style={{ height: '200px', objectFit: 'cover' }}
              />
              <Card.Body>
                <Card.Title>{notification.realEstate.name}</Card.Title>
                <Card.Text>
                  <strong>Price:</strong> {notification.realEstate.price.toFixed(0)} Kč
                </Card.Text>
                <Card.Text>
                  <strong>City:</strong> {notification.realEstate.city}
                </Card.Text>
                <Card.Text>
                  <strong>Notification Type:</strong> {notification.type}
                </Card.Text>
                <Card.Text>
                  <small className="text-muted">Sent At: {new Date(notification.sentAt).toLocaleString()}</small>
                </Card.Text>
                <Button variant="primary" onClick={() => window.location.href = notification.realEstate.url}>
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
        </div>
      )}

      <Pagination className="d-flex justify-content-center my-4">
        <Pagination.Prev
          disabled={currentPage === 1 || loading}
          onClick={handlePreviousPage}
        />
        <Pagination.Item active>{currentPage}</Pagination.Item>
        <Pagination.Next
          disabled={loading}
          onClick={handleNextPage}
        />
      </Pagination>
      
      {/* Only show this message if we've fetched at least once and got no results */}
      {!loading && notifications.length === 0 && (
        <div className="text-center my-4">
          <p>No notifications found.</p>
        </div>
      )}
    </Container>
  );
};

export default ReceivedNotifications;
