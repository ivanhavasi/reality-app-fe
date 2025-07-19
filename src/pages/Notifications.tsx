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
import { Button, Modal, Badge, Card, ListGroup, ButtonGroup } from 'react-bootstrap';
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

  if (loading) return <div className="d-flex justify-content-center mt-5"><div className="spinner-border" role="status"></div></div>;

  return (
    <div className="container-fluid px-2 px-md-4 mt-3 mt-md-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 mb-md-4 gap-3">
        <h2 className="fs-4 fs-md-2 mb-0">My Notifications</h2>
        <Button
          variant="primary"
          onClick={() => setShowAddModal(true)}
          className="d-flex align-items-center gap-2"
          size="sm"
        >
          <PlusCircle /> Add Notification
        </Button>
      </div>

      {notifications.length === 0 ? (
        <div className="alert alert-info">
          You don't have any notifications set up yet.
        </div>
      ) : (
        <div className="row g-3 g-md-4">
          {notifications.map(notification => (
            <div key={notification.id} className="col-12 col-lg-6 col-xl-4">
              <Card className="h-100">
                <Card.Header className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
                  <h5 className="mb-0 fs-6 text-truncate">{notification.name}</h5>
                  <Badge bg={notification.enabled ? 'success' : 'secondary'} className="flex-shrink-0">
                    {notification.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </Card.Header>
                <Card.Body className="d-flex flex-column">
                  <div className="mb-2">
                    <strong>Type:</strong> <span className="text-muted">{notification.type}</span>
                  </div>
                  {getTypeSpecificInfo(notification)}
                  {renderFilter(notification)}
                  <div className="mt-3">
                    <small className="text-muted">
                      <div><strong>Created:</strong> {new Date(notification.createdAt).toLocaleDateString()}</div>
                      <div><strong>Updated:</strong> {new Date(notification.updatedAt).toLocaleDateString()}</div>
                    </small>
                  </div>
                  <div className="mt-auto pt-3 d-flex justify-content-end">
                    <ButtonGroup size="sm">
                      <Button
                        variant="outline-secondary"
                        onClick={() => handleToggleEnable(notification)}
                        disabled={actionLoading[notification.id] === 'enable' || actionLoading[notification.id] === 'disable'}
                        title={notification.enabled ? "Disable notification" : "Enable notification"}
                        className="d-flex align-items-center justify-content-center"
                        style={{ minWidth: '40px' }}
                      >
                        {actionLoading[notification.id] === 'enable' || actionLoading[notification.id] === 'disable' ? (
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        ) : notification.enabled ? (
                          <ToggleOn size={16} />
                        ) : (
                          <ToggleOff size={16} />
                        )}
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        onClick={() => handleDelete(notification.id)}
                        disabled={actionLoading[notification.id] === 'delete'}
                        title="Delete notification"
                        className="d-flex align-items-center justify-content-center"
                        style={{ minWidth: '40px' }}
                      >
                        {actionLoading[notification.id] === 'delete' ? (
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        ) : (
                          <Trash size={16} />
                        )}
                      </Button>
                    </ButtonGroup>
                  </div>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      )}

      <Modal 
        show={showAddModal} 
        onHide={() => setShowAddModal(false)}
        size="lg"
        fullscreen="md-down"
      >
        <Modal.Header closeButton>
          <Modal.Title>Add Notification</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-2 p-md-3">
          <AddNotification onSuccess={onNotificationAdded} onCancel={() => setShowAddModal(false)} />
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Notifications;
