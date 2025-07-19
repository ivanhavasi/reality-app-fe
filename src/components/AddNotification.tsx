import React, { useState } from 'react';
import { Form, Button, Row, Col, Modal, Card, Alert, Badge } from 'react-bootstrap';
import {
  NotificationFilter, 
  EmailNotificationCommand, 
  WebhookNotificationCommand, 
  DiscordWebhookNotificationCommand,
  BuildingType,
  TransactionType
} from '../types/notifications';
import { addNotification } from '../services/api';
import { useError } from '../context/ErrorContext';

interface AddNotificationProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const AddNotification: React.FC<AddNotificationProps> = ({ onSuccess, onCancel }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('email');
  const [email, setEmail] = useState('');
  const [url, setUrl] = useState('');
  const [webhookId, setWebhookId] = useState('');
  const [token, setToken] = useState('');
  
  // Filter state
  const [buildingType, setBuildingType] = useState<BuildingType>(BuildingType.APARTMENT);
  const [transactionType, setTransactionType] = useState<TransactionType>(TransactionType.SALE);
  const [sizeFrom, setSizeFrom] = useState<string>('');
  const [sizeTo, setSizeTo] = useState<string>('');
  const [priceFrom, setPriceFrom] = useState<string>('');
  const [priceTo, setPriceTo] = useState<string>('');
  const [subTypes, setSubTypes] = useState<string>('');
  
  const [loading, setLoading] = useState(false);
  const { setError } = useError();

  const createFilter = (): NotificationFilter => {
    // Create filter with required properties
    const filter: NotificationFilter = {
      buildingType,
      transactionType
    };
    
    // Add size range if provided
    if (sizeFrom || sizeTo) {
      filter.size = {
        from: sizeFrom ? parseFloat(sizeFrom) : undefined,
        to: sizeTo ? parseFloat(sizeTo) : undefined
      };
    }
    
    // Add price range if provided
    if (priceFrom || priceTo) {
      filter.price = {
        from: priceFrom ? parseInt(priceFrom) : undefined,
        to: priceTo ? parseInt(priceTo) : undefined
      };
    }
    
    // Add subTypes if provided
    if (subTypes) {
      filter.subTypes = subTypes.split(',').map(t => t.trim());
    }
    
    return filter;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name) {
      console.log('Setting error: Name is required');
      setError('Name is required');
      return;
    }
  
    const filter = createFilter();
    setLoading(true);
  
    try {
      let command;
      
      switch (type) {
        case 'email':
          if (!email) {
            console.log('Setting error: Email is required');
            setError('Email is required');
            setLoading(false);
            return;
          }
          command = new EmailNotificationCommand(name, filter, email);
          break;
          
        case 'api':
          if (!url) {
            console.log('Setting error: URL is required');
            setError('URL is required');
            setLoading(false);
            return;
          }
          command = new WebhookNotificationCommand(name, filter, url);
          break;
          
        case 'discord':
          if (!webhookId || !token) {
            console.log('Setting error: Webhook ID and Token are required');
            setError('Webhook ID and Token are required');
            setLoading(false);
            return;
          }
          command = new DiscordWebhookNotificationCommand(name, filter, webhookId, token);
          break;
          
        default:
          console.log('Setting error: Invalid notification type');
          setError('Invalid notification type');
          setLoading(false);
          return;
      }
  
      // Add the notification
      const result = await addNotification(command);
      console.log('Notification added successfully:', result);
      
      // Call onSuccess to close the modal and refresh parent data
      onSuccess();
    } catch (err) {
      // Extract error message from Error object
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.log('Setting error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="d-flex align-items-center">
          <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '50px', height: '50px'}}>
            <i className="fas fa-bell-plus text-primary"></i>
          </div>
          <div>
            <h4 className="mb-0">Create New Notification</h4>
            <small className="text-muted">Set up alerts for new property listings</small>
          </div>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="pt-3">
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col lg={6}>
              <Card className="modern-card border-0 mb-4" style={{backgroundColor: 'var(--bs-body-bg)'}}>
                <Card.Header className="bg-transparent border-0 pb-2">
                  <h6 className="mb-0 fw-bold text-primary">
                    <i className="fas fa-cog me-2"></i>
                    Notification Settings
                  </h6>
                </Card.Header>
                <Card.Body className="pt-2">
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium">Notification Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Prague Apartments Alert"
                      className="modern-search"
                      required
                    />
                    <Form.Text className="text-muted">
                      Give your notification a descriptive name
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium">Notification Type</Form.Label>
                    <Form.Select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="modern-search"
                    >
                      <option value="email">📧 Email Notification</option>
                      <option value="api">🔗 Webhook (API)</option>
                      <option value="discord">💬 Discord</option>
                    </Form.Select>
                  </Form.Group>

                  {type === 'email' && (
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium">Email Address</Form.Label>
                      <Form.Control
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        className="modern-search"
                        required
                      />
                      <Form.Text className="text-muted">
                        We'll send new property alerts to this email
                      </Form.Text>
                    </Form.Group>
                  )}

                  {type === 'api' && (
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium">Webhook URL</Form.Label>
                      <Form.Control
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://your-app.com/webhook"
                        className="modern-search"
                        required
                      />
                      <Form.Text className="text-muted">
                        HTTP endpoint to receive property notifications
                      </Form.Text>
                    </Form.Group>
                  )}

                  {type === 'discord' && (
                    <>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-medium">Discord Webhook ID</Form.Label>
                        <Form.Control
                          type="text"
                          value={webhookId}
                          onChange={(e) => setWebhookId(e.target.value)}
                          placeholder="Discord webhook ID"
                          className="modern-search"
                          required
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-medium">Discord Token</Form.Label>
                        <Form.Control
                          type="password"
                          value={token}
                          onChange={(e) => setToken(e.target.value)}
                          placeholder="Discord webhook token"
                          className="modern-search"
                          required
                        />
                        <Form.Text className="text-muted">
                          Your Discord webhook credentials
                        </Form.Text>
                      </Form.Group>
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col lg={6}>
              <Card className="modern-card border-0 mb-4" style={{backgroundColor: 'var(--bs-body-bg)'}}>
                <Card.Header className="bg-transparent border-0 pb-2">
                  <h6 className="mb-0 fw-bold text-primary">
                    <i className="fas fa-filter me-2"></i>
                    Property Filters
                  </h6>
                </Card.Header>
                <Card.Body className="pt-2">
                  <Row>
                    <Col sm={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-medium">Building Type</Form.Label>
                        <Form.Select
                          value={buildingType}
                          onChange={(e) => setBuildingType(e.target.value as BuildingType)}
                          className="modern-search"
                        >
                          <option value={BuildingType.APARTMENT}>🏠 Apartment</option>
                          <option value={BuildingType.HOUSE}>🏘️ House</option>
                          <option value={BuildingType.COMMERCIAL}>🏢 Commercial</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col sm={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-medium">Transaction Type</Form.Label>
                        <Form.Select
                          value={transactionType}
                          onChange={(e) => setTransactionType(e.target.value as TransactionType)}
                          className="modern-search"
                        >
                          <option value={TransactionType.SALE}>💰 For Sale</option>
                          <option value={TransactionType.RENT}>🏠 For Rent</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium">Size Range (m²)</Form.Label>
                    <Row>
                      <Col sm={6}>
                        <Form.Control
                          type="number"
                          value={sizeFrom}
                          onChange={(e) => setSizeFrom(e.target.value)}
                          placeholder="Min size"
                          className="modern-search"
                          min="0"
                        />
                      </Col>
                      <Col sm={6}>
                        <Form.Control
                          type="number"
                          value={sizeTo}
                          onChange={(e) => setSizeTo(e.target.value)}
                          placeholder="Max size"
                          className="modern-search"
                          min="0"
                        />
                      </Col>
                    </Row>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium">Price Range (CZK)</Form.Label>
                    <Row>
                      <Col sm={6}>
                        <Form.Control
                          type="number"
                          value={priceFrom}
                          onChange={(e) => setPriceFrom(e.target.value)}
                          placeholder="Min price"
                          className="modern-search"
                          min="0"
                        />
                      </Col>
                      <Col sm={6}>
                        <Form.Control
                          type="number"
                          value={priceTo}
                          onChange={(e) => setPriceTo(e.target.value)}
                          placeholder="Max price"
                          className="modern-search"
                          min="0"
                        />
                      </Col>
                    </Row>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium">Property Subtypes</Form.Label>
                    <Form.Control
                      type="text"
                      value={subTypes}
                      onChange={(e) => setSubTypes(e.target.value)}
                      placeholder="e.g., 2+1, 3+1, penthouse"
                      className="modern-search"
                    />
                    <Form.Text className="text-muted">
                      Comma-separated list of property subtypes
                    </Form.Text>
                  </Form.Group>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Alert variant="info" className="d-flex align-items-center">
            <i className="fas fa-info-circle me-2"></i>
            <div>
              <strong>How it works:</strong> You'll receive notifications when new properties matching your criteria are found in Prague region.
            </div>
          </Alert>
        </Form>
      </Modal.Body>

      <Modal.Footer className="border-0 pt-0">
        <div className="d-flex justify-content-between w-100">
          <Button
            variant="outline-secondary"
            onClick={onCancel}
            className="modern-btn"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            className="modern-btn px-4"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Creating...
              </>
            ) : (
              <>
                <i className="fas fa-plus me-2"></i>
                Create Notification
              </>
            )}
          </Button>
        </div>
      </Modal.Footer>
    </>
  );
};

export default AddNotification;
