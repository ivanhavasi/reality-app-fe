import React, { useState, useEffect } from 'react';
import { 
  getUserNotifications, 
  deleteNotification, 
  enableNotification, 
  disableNotification 
} from '../services/api';
import { 
  Notification, 
  NotificationType, 
  BuildingType, 
  TransactionType, 
  FilterRange 
} from '../types/notifications';
import { Button, Modal, Badge, Card, ListGroup, ButtonGroup, Container, Row, Col, Spinner } from 'react-bootstrap';
import {
  Trash, 
  ToggleOff, 
  ToggleOn, 
  PlusCircle,
  CaretDown,
  CaretUp
} from 'react-bootstrap-icons';
import AddNotification from '../components/AddNotification';
import { useError } from '../context/ErrorContext';

interface NotificationsProps {
  token?: string;
}

const Notifications: React.FC<NotificationsProps> = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [expandedFilters, setExpandedFilters] = useState<{[id: string]: boolean}>({});
  const [actionLoading, setActionLoading] = useState<{[id: string]: string}>({});
  const { setError } = useError();
  
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      console.log('Fetching notifications...');
      const data = await getUserNotifications();
      console.log('Notifications received:', data);
      setNotifications(data);
      return true; // Indicate successful fetch
    } catch (err) {
      // Extract error message from Error object
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Fetch error:', errorMessage);
      setError(errorMessage);
      return false; // Indicate failed fetch
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Notifications component mounted');
    fetchNotifications();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      try {
        setActionLoading({...actionLoading, [id]: 'delete'});
        await deleteNotification(id);

        // After delete operation, refresh the entire notifications list
        // to ensure we have the latest data
        await fetchNotifications();
      } catch (err) {
        // Extract error message from Error object
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('Delete error:', errorMessage);
        setError(errorMessage);
      } finally {
        const newActionLoading = {...actionLoading};
        delete newActionLoading[id];
        setActionLoading(newActionLoading);
      }
    }
  };

  const handleToggleEnable = async (notification: Notification) => {
    try {
      const action = notification.enabled ? 'disable' : 'enable';
      setActionLoading({...actionLoading, [notification.id]: action});

      if (notification.enabled) {
        await disableNotification(notification.id);
      } else {
        await enableNotification(notification.id);
      }

      // After enable/disable operation, refresh the entire notifications list
      // to ensure we have the latest data
      await fetchNotifications();

    } catch (err) {
      // Extract error message from Error object
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Toggle error:', errorMessage);
      setError(errorMessage);
    } finally {
      const newActionLoading = {...actionLoading};
      delete newActionLoading[notification.id];
      setActionLoading(newActionLoading);
    }
  };

  const getTypeSpecificInfo = (notification: Notification) => {
    switch (notification.type) {
      case NotificationType.EMAIL:
        return <div><strong>Email:</strong> {(notification as any).email}</div>;
      case NotificationType.WEBHOOK:
        return <div><strong>URL:</strong> {(notification as any).url}</div>;
      case NotificationType.DISCORD:
        return <div><strong>Discord Webhook ID:</strong> {(notification as any).webhookId}</div>;
      default:
        return null;
    }
  };

  const toggleFilterDetails = (id: string) => {
    setExpandedFilters(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const renderFilterRange = <T extends number>(range?: FilterRange<T>) => {
    if (!range) return 'Any';
    if (range.from && range.to) return `${range.from} - ${range.to}`;
    if (range.from) return `Min: ${range.from}`;
    if (range.to) return `Max: ${range.to}`;
    return 'Any';
  };

  const renderFilter = (notification: Notification) => {
    const { filter } = notification;
    const isExpanded = expandedFilters[notification.id] || false;

    return (
      <div className="mt-3">
        <div className="d-flex justify-content-between align-items-center">
          <strong>Filter:</strong>
          <Button
            variant="link"
            size="sm"
            onClick={() => toggleFilterDetails(notification.id)}
            className="p-0"
          >
            {isExpanded ? (
              <>Hide Details <CaretUp size={14} /></>
            ) : (
              <>Show Details <CaretDown size={14} /></>
            )}
          </Button>
        </div>

        {isExpanded && (
          <ListGroup variant="flush" className="mt-2 border rounded">
            <ListGroup.Item>
              <strong>Building Type:</strong> {filter.buildingType}
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Transaction Type:</strong> {filter.transactionType}
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Size:</strong> {renderFilterRange(filter.size)} m²
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Price:</strong> {renderFilterRange(filter.price)}
            </ListGroup.Item>
            {filter.subTypes && filter.subTypes.length > 0 && (
              <ListGroup.Item>
                <strong>Sub Types:</strong>{' '}
                {filter.subTypes.map((subType, index) => (
                  <Badge key={index} bg="secondary" className="me-1">
                    {subType}
                  </Badge>
                ))}
              </ListGroup.Item>
            )}
          </ListGroup>
        )}
      </div>
    );
  };

  const onNotificationAdded = () => {
    fetchNotifications();
    setShowAddModal(false);
  };

  return (
    <Container fluid className="p-0">
      {/* Modern Header Section */}
      <div className="gradient-header py-4 py-md-5 mb-4">
        <Container>
          <Row className="align-items-center">
            <Col>
              <h1 className="display-6 display-md-4 fw-bold text-white mb-2 mb-md-3">
                Notification Settings
              </h1>
              <p className="text-white opacity-90 mb-0 fs-6">
                Manage your property alerts and stay informed about new listings
              </p>
            </Col>
            <Col xs="auto">
              <Button
                variant="light"
                onClick={() => setShowAddModal(true)}
                className="modern-btn shadow-sm"
                size="lg"
              >
                <PlusCircle className="me-2" />
                Add Notification
              </Button>
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
            <h3>No Notifications Set Up</h3>
            <p className="text-muted">
              Create your first notification to get alerts about new properties that match your criteria.
            </p>
            <Button
              variant="primary"
              className="modern-btn"
              onClick={() => setShowAddModal(true)}
            >
              <PlusCircle className="me-2" />
              Create Your First Notification
            </Button>
          </div>
        )}

        {/* Notifications Grid */}
        {!loading && notifications.length > 0 && (
          <>
            <Row className="mb-4">
              <Col>
                <Card className="modern-card border-0 mb-4" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
                  <Card.Body className="p-4">
                    <Row className="align-items-center">
                      <Col md={8}>
                        <div className="text-white">
                          <h4 className="text-white mb-2">
                            <i className="fas fa-bell me-2"></i>
                            Your Active Notifications
                          </h4>
                          <p className="text-white opacity-90 mb-0">
                            {notifications.filter(n => n.enabled).length} of {notifications.length} notifications are currently active and monitoring Prague properties
                          </p>
                        </div>
                      </Col>
                      <Col md={4} className="text-center text-md-end mt-3 mt-md-0">
                        <div className="d-flex flex-column align-items-center align-items-md-end">
                          <Button
                            variant="light"
                            size="sm"
                            onClick={() => setShowAddModal(true)}
                            className="modern-btn"
                          >
                            <i className="fas fa-plus me-1"></i>
                            Add More
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Row className="g-4">
              {notifications.map(notification => (
                <Col key={notification.id} lg={6} xl={4}>
                  <Card className="modern-card h-100" style={{backgroundColor: 'var(--bs-body-bg)', borderColor: 'var(--bs-border-color)'}}>
                    <Card.Header className="bg-transparent border-0 py-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <div className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${
                            notification.enabled ? 'bg-success bg-opacity-10' : 'bg-secondary bg-opacity-10'
                          }`} style={{width: '40px', height: '40px'}}>
                            <i className={`fas fa-bell ${
                              notification.enabled ? 'text-success' : 'text-secondary'
                            }`}></i>
                          </div>
                          <div>
                            <h6 className="mb-0 fw-bold" style={{color: 'var(--bs-body-color)'}}>{notification.name}</h6>
                            <small className="text-muted">{notification.type}</small>
                          </div>
                        </div>
                        <Badge bg={notification.enabled ? 'success' : 'secondary'}>
                          {notification.enabled ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </Card.Header>

                    <Card.Body className="pt-0">
                      {/* Type-specific information */}
                      <div className="mb-3">
                        <div className="d-inline-block p-2 rounded-2 mb-2" style={{backgroundColor: 'var(--bs-secondary-bg)', color: 'var(--bs-body-color)'}}>
                          {getTypeSpecificInfo(notification)}
                        </div>
                      </div>

                      {/* Filter Details */}
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <strong className="small" style={{color: 'var(--bs-body-color)'}}>Filter Criteria:</strong>
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => toggleFilterDetails(notification.id)}
                            className="p-0 text-decoration-none"
                            style={{color: 'var(--bs-primary)'}}
                          >
                            {expandedFilters[notification.id] ?
                              <CaretUp size={16} /> : <CaretDown size={16} />
                            }
                          </Button>
                        </div>

                        {expandedFilters[notification.id] && (
                          <div className="rounded-3 p-3" style={{backgroundColor: 'var(--bs-secondary-bg)'}}>
                            <Row className="g-2 small">
                              <Col sm={6}>
                                <div style={{color: 'var(--bs-body-color)'}}><strong>Building:</strong> {notification.filter.buildingType || 'Any'}</div>
                              </Col>
                              <Col sm={6}>
                                <div style={{color: 'var(--bs-body-color)'}}><strong>Transaction:</strong> {notification.filter.transactionType || 'Any'}</div>
                              </Col>
                              <Col sm={6}>
                                <div style={{color: 'var(--bs-body-color)'}}><strong>Price:</strong> {renderFilterRange(notification.filter.price)}</div>
                              </Col>
                              <Col sm={6}>
                                <div style={{color: 'var(--bs-body-color)'}}><strong>Size:</strong> {renderFilterRange(notification.filter.size)} m²</div>
                              </Col>
                            </Row>
                          </div>
                        )}
                      </div>

                      {/* Dates */}
                      <div className="mb-3">
                        <Row className="g-1 small text-muted">
                          <Col xs={6}>
                            <div><i className="fas fa-calendar-plus me-1"></i>Created: {new Date(notification.createdAt).toLocaleDateString()}</div>
                          </Col>
                          <Col xs={6}>
                            <div><i className="fas fa-calendar-edit me-1"></i>Updated: {new Date(notification.updatedAt).toLocaleDateString()}</div>
                          </Col>
                        </Row>
                      </div>

                      {/* Action Buttons */}
                      <div className="d-flex gap-2 mt-auto">
                        <Button
                          variant={notification.enabled ? "outline-warning" : "outline-success"}
                          size="sm"
                          onClick={() => handleToggleEnable(notification)}
                          disabled={actionLoading[notification.id] === 'enable' || actionLoading[notification.id] === 'disable'}
                          className="modern-btn flex-fill"
                        >
                          {actionLoading[notification.id] === 'enable' || actionLoading[notification.id] === 'disable' ? (
                            <Spinner size="sm" />
                          ) : notification.enabled ? (
                            <>
                              <ToggleOff className="me-1" size={16} />
                              Disable
                            </>
                          ) : (
                            <>
                              <ToggleOn className="me-1" size={16} />
                              Enable
                            </>
                          )}
                        </Button>

                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(notification.id)}
                          disabled={actionLoading[notification.id] === 'delete'}
                          className="modern-btn"
                        >
                          {actionLoading[notification.id] === 'delete' ? (
                            <Spinner size="sm" />
                          ) : (
                            <Trash size={16} />
                          )}
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </>
        )}

        {/* Add Notification Modal */}
        <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
          <AddNotification
            onSuccess={() => {
              setShowAddModal(false);
              fetchNotifications();
            }}
            onCancel={() => setShowAddModal(false)}
          />
        </Modal>
      </Container>
    </Container>
  );
};

export default Notifications;
